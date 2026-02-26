import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ManifestData } from '../types/index.js';

const MANIFEST_FILENAME = '.prompt-opm.manifest.json';

export function loadManifest(outputDir: string): ManifestData {
	const manifestPath = join(outputDir, MANIFEST_FILENAME);

	if (!existsSync(manifestPath)) {
		return {
			generatedAt: new Date().toISOString(),
			files: {},
		};
	}

	const content = readFileSync(manifestPath, 'utf-8');
	return JSON.parse(content) as ManifestData;
}

export function saveManifest(outputDir: string, data: ManifestData): void {
	const manifestPath = join(outputDir, MANIFEST_FILENAME);
	writeFileSync(manifestPath, JSON.stringify(data, null, 2), 'utf-8');
}
