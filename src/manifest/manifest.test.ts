import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ManifestData } from '../types/index.js';
import { loadManifest, saveManifest } from './manifest.js';

const TEST_DIR = join(import.meta.dirname, '../../.test-manifest');

beforeEach(() => {
	mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
	if (existsSync(TEST_DIR)) {
		rmSync(TEST_DIR, { recursive: true });
	}
});

describe('loadManifest', () => {
	it('returns empty manifest when file does not exist', () => {
		const manifest = loadManifest(TEST_DIR);
		expect(manifest.files).toEqual({});
		expect(manifest.generatedAt).toBeDefined();
	});

	it('reads existing manifest', () => {
		const data: ManifestData = {
			generatedAt: '2026-01-01T00:00:00Z',
			files: {
				'test.prompt.md': {
					version: '1.0.0',
					contentHash: 'abc',
					inputsHash: 'def',
					outputsHash: 'ghi',
					dependencies: [],
					tokenEstimate: 0,
					inputTokenEstimate: 0,
				},
			},
		};
		saveManifest(TEST_DIR, data);

		const loaded = loadManifest(TEST_DIR);
		expect(loaded.files['test.prompt.md'].version).toBe('1.0.0');
	});
});

describe('saveManifest', () => {
	it('writes manifest to output directory', () => {
		const data: ManifestData = {
			generatedAt: '2026-01-01T00:00:00Z',
			files: {},
		};

		saveManifest(TEST_DIR, data);
		expect(existsSync(join(TEST_DIR, '.prompt-opm.manifest.json'))).toBe(true);
	});

	it('can be loaded after saving', () => {
		const data: ManifestData = {
			generatedAt: '2026-02-26T00:00:00Z',
			files: {
				'a.prompt.md': {
					version: '2.1.0',
					contentHash: 'x',
					inputsHash: 'y',
					outputsHash: 'z',
					dependencies: ['b.prompt.md'],
					tokenEstimate: 0,
					inputTokenEstimate: 0,
				},
			},
		};

		saveManifest(TEST_DIR, data);
		const loaded = loadManifest(TEST_DIR);
		expect(loaded).toEqual(data);
	});
});
