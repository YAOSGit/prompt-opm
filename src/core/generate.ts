import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { hashContent, hashInputsOutputs } from '../manifest/hasher.js';
import { loadManifest, saveManifest } from '../manifest/manifest.js';
import type {
	DiagnosticError,
	ManifestData,
	OpmConfig,
} from '../types/index.js';
import type { EmitInput } from './emitter.js';
import { generateBarrelContent, generateFileContent } from './emitter.js';
import { parsePromptFile } from './parser.js';
import { scanPromptFiles } from './scanner.js';
import { resolveSnippets } from './snippet-resolver.js';
import { estimateFixedTokens, estimateTemplateTokens } from './token-estimator.js';
import { bumpVersion, determineVersionBump } from './version-manager.js';

export type GenerateResult = {
	generated: number;
	skipped: number;
	errors: DiagnosticError[];
	warnings: string[];
};

export function generate(config: OpmConfig): GenerateResult {
	const { source, output } = config;
	const manifestDir = config.manifest ?? output;

	// 1. Create output directory if needed
	if (!existsSync(output)) {
		mkdirSync(output, { recursive: true });
	}
	if (manifestDir !== output && !existsSync(manifestDir)) {
		mkdirSync(manifestDir, { recursive: true });
	}

	// 2. Load manifest
	const oldManifest = loadManifest(manifestDir);

	// 3. Scan source directory for .prompt.md files
	const filePaths = scanPromptFiles(source);

	// 4. First pass: detect dirty files by comparing content hashes
	const fileContents = new Map<string, string>();
	const fileContentHashes = new Map<string, string>();
	const relPaths = new Map<string, string>();
	const dirtySet = new Set<string>();

	for (const filePath of filePaths) {
		const relPath = relative(source, filePath);
		relPaths.set(filePath, relPath);

		const rawContent = readFileSync(filePath, 'utf-8');
		fileContents.set(filePath, rawContent);

		const contentHash = hashContent(rawContent);
		fileContentHashes.set(filePath, contentHash);

		const prevEntry = oldManifest.files[relPath];
		if (!prevEntry || prevEntry.contentHash !== contentHash) {
			dirtySet.add(filePath);
		}
	}

	// Mark dependents of dirty files as dirty (incremental invalidation)
	// We need to check if any file's dependencies include a dirty file
	// Since dependencies are stored in the manifest, we use those to propagate dirtiness
	let changed = true;
	while (changed) {
		changed = false;
		for (const filePath of filePaths) {
			if (dirtySet.has(filePath)) continue;
			const relPath = relPaths.get(filePath);
			if (!relPath) continue;
			const prevEntry = oldManifest.files[relPath];
			if (!prevEntry) continue;
			for (const dep of prevEntry.dependencies) {
				// dep is a relative path, find its absolute path
				const depAbsolute = join(source, dep);
				if (dirtySet.has(depAbsolute)) {
					dirtySet.add(filePath);
					changed = true;
					break;
				}
			}
		}
	}

	// 5. Second pass: process files
	const result: GenerateResult = {
		generated: 0,
		skipped: 0,
		errors: [],
		warnings: [],
	};

	const newManifest: ManifestData = {
		generatedAt: new Date().toISOString(),
		files: {},
	};

	const moduleNames: string[] = [];

	for (const filePath of filePaths) {
		const relPath = relPaths.get(filePath);
		if (!relPath) continue;
		const moduleName = basename(relPath, '.prompt.md');

		// Quick-parse to check if this is a snippet-only file
		const rawCheck = fileContents.get(filePath);
		if (rawCheck) {
			try {
				const check = parsePromptFile(rawCheck, filePath);
				if (check.frontmatter.snippet) {
					// Snippet-only files are not emitted as modules
					continue;
				}
			} catch {
				// Parse errors will be caught in the main try block below
			}
		}

		moduleNames.push(moduleName);

		if (!dirtySet.has(filePath)) {
			// Not dirty - skip, carry forward manifest entry
			result.skipped++;
			newManifest.files[relPath] = oldManifest.files[relPath];
			continue;
		}

		try {
			const rawContent = fileContents.get(filePath);
			const contentHash = fileContentHashes.get(filePath);
			if (!rawContent || !contentHash) continue;

			// Parse the prompt file
			const parsed = parsePromptFile(rawContent, filePath);

			// Resolve snippets
			const resolved = resolveSnippets(parsed, source);
			result.warnings.push(...resolved.warnings);

			const inputs = resolved.mergedInputs;
			const outputs = parsed.frontmatter.outputs ?? {};
			const inputsHash = hashInputsOutputs(inputs, outputs);
			const outputsHash = hashInputsOutputs(undefined, outputs);

			// Determine version bump
			let version = parsed.frontmatter.version ?? '0.1.0';
			const prevEntry = oldManifest.files[relPath];

			if (prevEntry) {
				const hasDirtyDep = resolved.resolvedDependencies.some((dep) => {
					const depRel = relative(source, dep);
					return dirtySet.has(dep) || dirtySet.has(join(source, depRel));
				});

				const bumpType = determineVersionBump(
					prevEntry,
					contentHash,
					inputsHash,
					hasDirtyDep,
				);

				if (bumpType) {
					const newVersion = bumpVersion(version, bumpType);

					// Write updated version back into source .prompt.md file
					const updatedContent = rawContent.replace(
						`version: "${version}"`,
						`version: "${newVersion}"`,
					);
					writeFileSync(filePath, updatedContent, 'utf-8');
					version = newVersion;
				}
			}

			// Build dependencies list (relative paths)
			const dependencies = resolved.resolvedDependencies.map((dep) =>
				relative(source, dep),
			);

			// Compute token estimates from the resolved template
			const tokenEstimate = estimateTemplateTokens(resolved.body);
			const inputTokenEstimate = estimateFixedTokens(resolved.body);

			// Emit .ts file
			const emitInput: EmitInput = {
				model: parsed.frontmatter.model,
				configs: parsed.frontmatter.config ?? {},
				meta: {
					version,
					lastUpdated: new Date().toISOString(),
					sourceFile: relPath,
					contentHash,
					tokenEstimate,
					inputTokenEstimate,
				},
				inputs,
				outputs,
				template: resolved.body,
			};

			const tsContent = generateFileContent(emitInput);
			writeFileSync(join(output, `${moduleName}.ts`), tsContent, 'utf-8');

			// Build new manifest entry
			newManifest.files[relPath] = {
				version,
				contentHash,
				inputsHash,
				outputsHash,
				dependencies,
				tokenEstimate,
				inputTokenEstimate,
			};

			result.generated++;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);

			// Determine error type
			let errorType: DiagnosticError['type'] = 'parse';
			if (message.includes('Circular dependency')) {
				errorType = 'circular';
			} else if (message.includes('Snippet')) {
				errorType = 'snippet';
			} else if (message.includes('Conflict')) {
				errorType = 'conflict';
			} else if (message.includes('Unsupported type')) {
				errorType = 'schema';
			}

			result.errors.push({
				filePath,
				message,
				type: errorType,
			});
		}
	}

	// 6. Write barrel index.ts
	const barrelContent = generateBarrelContent(moduleNames.sort());
	if (barrelContent) {
		writeFileSync(join(output, 'index.ts'), barrelContent, 'utf-8');
	}

	// 7. Save updated manifest
	saveManifest(manifestDir, newManifest);

	return result;
}
