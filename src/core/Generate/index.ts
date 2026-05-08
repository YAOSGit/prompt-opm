import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { formatError } from '@yaos-git/toolkit/cli';
import { hashContent, hashInputsOutputs } from '../../manifest/hasher.js';
import { loadManifest, saveManifest } from '../../manifest/manifest.js';
import type {
	GenerateResult,
	ManifestData,
	OpmConfig,
	PromptFile,
} from '../../types/index.js';
import type { EmitInput } from '../Emitter/index.js';
import {
	generateBarrelContent,
	generateFileContent,
} from '../Emitter/index.js';
import { parsePromptFile } from '../Parser/index.js';
import { classifyDiagnosticError } from '../patterns.js';
import { scanPromptFiles } from '../Scanner/index.js';
import { resolveSnippets } from '../SnippetResolver/index.js';
import {
	estimateFixedTokens,
	estimateTemplateTokens,
} from '../TokenEstimator/index.js';
import { bumpVersion } from '../VersionManager/index.js';

export type { GenerateResult } from '../../types/index.js';

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

	// 4. First pass: parse files and detect dirty ones by comparing body hashes
	const fileContents = new Map<string, string>();
	const fileParsed = new Map<string, PromptFile>();
	const fileBodyHashes = new Map<string, string>();
	const relPaths = new Map<string, string>();
	const dirtySet = new Set<string>();

	for (const filePath of filePaths) {
		const relPath = relative(source, filePath);
		relPaths.set(filePath, relPath);

		const rawContent = readFileSync(filePath, 'utf-8');
		fileContents.set(filePath, rawContent);

		try {
			const parsed = parsePromptFile(rawContent, filePath);
			fileParsed.set(filePath, parsed);

			const bodyHash = hashContent(parsed.body);
			fileBodyHashes.set(filePath, bodyHash);

			const prevEntry = oldManifest.files[relPath];
			if (!prevEntry || prevEntry.contentHash !== bodyHash) {
				dirtySet.add(filePath);
			}
		} catch {
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

		const cachedParsed = fileParsed.get(filePath);
		if (cachedParsed?.frontmatter.snippet) {
			continue;
		}
		if (!cachedParsed) {
			const rawCheck = fileContents.get(filePath);
			if (
				rawCheck &&
				/^---\n[\s\S]*?snippet:\s*true[\s\S]*?\n---/.test(rawCheck)
			) {
				continue;
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
			if (!rawContent) continue;

			const parsed = cachedParsed ?? parsePromptFile(rawContent, filePath);
			const bodyHash = fileBodyHashes.get(filePath) ?? hashContent(parsed.body);

			const resolved = resolveSnippets(parsed, source);
			result.warnings.push(...resolved.warnings);

			const inputs = resolved.mergedInputs;
			const outputs = parsed.frontmatter.outputs ?? {};
			const inputsHash = hashInputsOutputs(inputs, outputs);
			const outputsHash = hashInputsOutputs(undefined, outputs);

			let version = parsed.frontmatter.version ?? '0.1.0';

			const hasExistingHashes = parsed.frontmatter.contentHash != null;
			const contentChanged =
				hasExistingHashes && parsed.frontmatter.contentHash !== bodyHash;
			const inputsChanged =
				hasExistingHashes && parsed.frontmatter.inputsHash !== inputsHash;
			const outputsChanged =
				hasExistingHashes && parsed.frontmatter.outputsHash !== outputsHash;
			const hasDirtyDep = resolved.resolvedDependencies.some((dep) => {
				const depRel = relative(source, dep);
				return dirtySet.has(dep) || dirtySet.has(join(source, depRel));
			});

			const needsHashUpdate =
				!hasExistingHashes || contentChanged || inputsChanged || outputsChanged;

			if (
				contentChanged ||
				outputsChanged ||
				(hasExistingHashes && hasDirtyDep)
			) {
				const bumpType =
					(contentChanged && inputsChanged) || outputsChanged
						? 'minor'
						: 'patch';
				version = bumpVersion(version, bumpType);
			}

			if (needsHashUpdate || contentChanged || hasDirtyDep) {
				let updated = rawContent;
				const fm = parsed.frontmatter;

				const replacements: [string | undefined, string, string][] = [
					[fm.version, 'version', version],
					[fm.contentHash, 'contentHash', bodyHash],
					[fm.inputsHash, 'inputsHash', inputsHash],
					[fm.outputsHash, 'outputsHash', outputsHash],
				];

				const insertLines: string[] = [];
				for (const [existing, key, value] of replacements) {
					if (existing != null) {
						updated = updated.replace(
							new RegExp(
								`^(${key}:\\s*)"${existing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
								'm',
							),
							`$1"${value}"`,
						);
					} else {
						insertLines.push(`${key}: "${value}"`);
					}
				}

				if (insertLines.length > 0) {
					const closingIdx =
						updated.indexOf('\n---\n', 3) !== -1
							? updated.indexOf('\n---\n', 3)
							: updated.indexOf('\n---', 3);
					if (closingIdx !== -1) {
						updated =
							updated.slice(0, closingIdx) +
							'\n' +
							insertLines.join('\n') +
							updated.slice(closingIdx);
					}
				}

				writeFileSync(filePath, updated, 'utf-8');
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
					contentHash: bodyHash,
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
				contentHash: bodyHash,
				inputsHash,
				outputsHash,
				dependencies,
				tokenEstimate,
				inputTokenEstimate,
			};

			result.generated++;
		} catch (err) {
			const message = formatError(err);

			result.errors.push({
				filePath,
				message,
				type: classifyDiagnosticError(message),
			});
		}
	}

	// 6. Write barrel index.ts
	const barrelContent = generateBarrelContent(moduleNames.sort());
	writeFileSync(join(output, 'index.ts'), barrelContent || '', 'utf-8');

	// 7. Save updated manifest
	saveManifest(manifestDir, newManifest);

	return result;
}
