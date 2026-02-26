import { basename } from 'node:path';
import { analyze } from '../../core/analyzer.js';
import { loadConfig } from '../load-config.js';

type AnalyzeOptions = {
	json: boolean;
};

export function runAnalyze(cwd: string, options: AnalyzeOptions): void {
	const config = loadConfig(cwd);
	const result = analyze(config);

	if (options.json) {
		console.log(JSON.stringify(result, null, 2));
		return;
	}

	if (result.prompts.length === 0) {
		console.log('No prompts found.');
		return;
	}

	// Build rows to compute dynamic column widths
	const headers = ['Prompt', 'Model', 'Ver', 'Tokens', 'Fixed', 'Vars', 'Snippets'];
	const rightAlign = [false, false, false, true, true, true, true];
	const rows = result.prompts.map((p) => [
		basename(p.file, '.prompt.md'),
		p.model,
		p.version,
		String(p.tokenEstimate),
		String(p.inputTokenEstimate),
		String(p.variables.length),
		String(p.snippets.length),
	]);

	const widths = headers.map((h, i) =>
		Math.max(h.length, ...rows.map((r) => r[i].length)) + 2,
	);

	const formatRow = (cols: string[]) =>
		cols.map((col, i) =>
			rightAlign[i] ? col.padStart(widths[i]) : col.padEnd(widths[i]),
		).join('');

	console.log('');
	console.log(formatRow(headers));
	console.log('-'.repeat(widths.reduce((a, b) => a + b, 0)));

	for (const row of rows) {
		console.log(formatRow(row));
	}

	// Dependency graph
	const hasAnyDeps = Object.values(result.dependencyGraph).some((d) => d.length > 0);
	if (hasAnyDeps) {
		console.log('');
		console.log('Dependency Graph:');
		for (const [name, deps] of Object.entries(result.dependencyGraph)) {
			console.log(` ${name}`);
			if (deps.length === 0) {
				console.log('   (no dependencies)');
			} else {
				for (let i = 0; i < deps.length; i++) {
					const prefix = i === deps.length - 1 ? '\u2514\u2500\u2500' : '\u251C\u2500\u2500';
					const depName = basename(deps[i], '.prompt.md');
					console.log(`   ${prefix} @${depName}`);
				}
			}
		}
	}
}

