import { readFileSync } from 'node:fs';
import { basename, relative } from 'node:path';
import chalk from 'chalk';
import { parsePromptFile } from '../../core/parser.js';
import { scanPromptFiles } from '../../core/scanner.js';
import { resolveSnippets } from '../../core/snippet-resolver.js';
import { determineVersionBump } from '../../core/version-manager.js';
import { hashContent, hashInputsOutputs } from '../../manifest/hasher.js';
import { loadManifest } from '../../manifest/manifest.js';
import { loadConfig } from '../load-config.js';

export function runDiff(cwd: string): void {
	const config = loadConfig(cwd);
	const manifestDir = config.manifest ?? config.output;
	const manifest = loadManifest(manifestDir);
	const files = scanPromptFiles(config.source);

	const currentFiles = new Set<string>();
	const changes: string[] = [];

	for (const filePath of files) {
		const relPath = relative(config.source, filePath);
		const moduleName = basename(relPath, '.prompt.md');
		currentFiles.add(relPath);

		try {
			const content = readFileSync(filePath, 'utf-8');
			const contentHash = hashContent(content);
			const prev = manifest.files[relPath];

			if (!prev) {
				changes.push(chalk.green(`  + ${moduleName}.ts (new)`));
				continue;
			}

			if (prev.contentHash === contentHash) {
				continue;
			}

			const parsed = parsePromptFile(content, filePath);
			const resolved = resolveSnippets(parsed, config.source);
			const inputsHash = hashInputsOutputs(
				resolved.mergedInputs,
				parsed.frontmatter.outputs,
			);
			const bump = determineVersionBump(prev, contentHash, inputsHash, false);

			if (bump) {
				changes.push(chalk.yellow(`  ~ ${moduleName}.ts (${bump} bump)`));
			}
		} catch (err) {
			changes.push(
				chalk.red(
					`  ! ${moduleName}.ts (error: ${err instanceof Error ? err.message : String(err)})`,
				),
			);
		}
	}

	// Detect removed files
	for (const relPath of Object.keys(manifest.files)) {
		if (!currentFiles.has(relPath)) {
			const moduleName = basename(relPath, '.prompt.md');
			changes.push(chalk.red(`  - ${moduleName}.ts (removed)`));
		}
	}

	if (changes.length === 0) {
		console.log(chalk.green('No changes detected.'));
	} else {
		console.log(chalk.bold('Changes:'));
		for (const change of changes) {
			console.log(change);
		}
	}
}
