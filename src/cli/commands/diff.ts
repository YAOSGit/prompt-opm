import { readFileSync } from 'node:fs';
import { basename, relative } from 'node:path';
import { formatError } from '@yaos-git/toolkit/cli';
import chalk from 'chalk';
import { parsePromptFile } from '../../core/Parser/index.js';
import { scanPromptFiles } from '../../core/Scanner/index.js';
import { resolveSnippets } from '../../core/SnippetResolver/index.js';
import { hashContent, hashInputsOutputs } from '../../manifest/hasher.js';
import { loadManifest } from '../../manifest/manifest.js';
import { loadConfig } from '../loadConfig.js';

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
			const parsed = parsePromptFile(content, filePath);
			const bodyHash = hashContent(parsed.body);
			const resolved = resolveSnippets(parsed, config.source);
			const inputsHash = hashInputsOutputs(
				resolved.mergedInputs,
				parsed.frontmatter.outputs,
			);

			const fm = parsed.frontmatter;
			const isNew = !manifest.files[relPath] && !fm.contentHash;

			if (isNew) {
				changes.push(chalk.green(`  + ${moduleName}.ts (new)`));
				continue;
			}

			const contentChanged = fm.contentHash !== bodyHash;
			const inputsChanged = fm.inputsHash !== inputsHash;

			if (!contentChanged && !inputsChanged) {
				continue;
			}

			const bump = contentChanged && inputsChanged ? 'minor' : 'patch';
			changes.push(chalk.yellow(`  ~ ${moduleName}.ts (${bump} bump)`));
		} catch (err) {
			changes.push(
				chalk.red(`  ! ${moduleName}.ts (error: ${formatError(err)})`),
			);
		}
	}

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
