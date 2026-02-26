import { readFileSync } from 'node:fs';
import { parsePromptFile } from '../../core/parser.js';
import { scanPromptFiles } from '../../core/scanner.js';
import { resolveSnippets } from '../../core/snippet-resolver.js';
import type { DiagnosticError } from '../../types/index.js';
import { loadConfig } from '../load-config.js';

export function runValidate(cwd: string): void {
	const config = loadConfig(cwd);
	const files = scanPromptFiles(config.source);
	const errors: DiagnosticError[] = [];
	const warnings: string[] = [];

	for (const filePath of files) {
		try {
			const content = readFileSync(filePath, 'utf-8');
			const parsed = parsePromptFile(content, filePath);
			const resolved = resolveSnippets(parsed, config.source);
			warnings.push(...resolved.warnings);

			// Variable/Schema Sync Validation
			const declaredInputs = Object.keys(resolved.mergedInputs).map((k) =>
				k.endsWith('?') ? k.slice(0, -1) : k,
			);
			const usedVariables = resolved.body
				.match(/\{\{\s*([a-zA-Z_]\w*)(?:\s*\|\s*"[^"]*")?\s*\}\}/g)
				?.map((m) => m.match(/\{\{\s*([a-zA-Z_]\w*)/)![1])
				.filter((v) => !v.startsWith('@')) || [];

			const uniqueUsed = [...new Set(usedVariables)];

			// 1. Used but not declared
			for (const variable of uniqueUsed) {
				if (!declaredInputs.includes(variable)) {
					errors.push({
						filePath,
						message: `Variable "{{ ${variable} }}" used in body but not declared in inputs`,
						type: 'schema',
					});
				}
			}

			// 2. Declared but not used
			if (!parsed.frontmatter.snippet) {
				for (const input of declaredInputs) {
					if (!uniqueUsed.includes(input)) {
						warnings.push(
							`Input "${input}" declared in ${filePath} but never used in template`,
						);
					}
				}
			}
		} catch (err) {
			errors.push({
				filePath,
				message: err instanceof Error ? err.message : String(err),
				type: 'parse',
			});
		}
	}

	for (const warn of warnings) {
		console.warn(`WARN: ${warn}`);
	}

	for (const err of errors) {
		console.error(`ERROR [${err.filePath}]: ${err.message}`);
	}

	if (errors.length === 0) {
		console.log(`Validated ${files.length} file(s) — no errors.`);
	} else {
		console.error(
			`Found ${errors.length} error(s) in ${files.length} file(s).`,
		);
		process.exitCode = 1;
	}
}
