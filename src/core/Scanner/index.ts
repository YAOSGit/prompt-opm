import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function scanPromptFiles(sourceDir: string): string[] {
	const absoluteDir = resolve(sourceDir);
	const results: string[] = [];

	function walk(dir: string): void {
		const entries = readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (entry.name.endsWith('.prompt.md')) {
				results.push(fullPath);
			}
		}
	}

	walk(absoluteDir);
	return results;
}
