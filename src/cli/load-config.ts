import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { OpmConfig } from '../types/index.js';

export function loadConfig(cwd: string): OpmConfig {
	const configPath = resolve(cwd, '.prompt-opm.config.json');
	const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
	return {
		source: resolve(cwd, raw.source),
		output: resolve(cwd, raw.output),
		manifest: raw.manifest ? resolve(cwd, raw.manifest) : undefined,
	};
}
