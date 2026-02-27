import { describe, expect, it } from 'vitest';
import type { ManifestEntry } from '../types/index.js';
import { bumpVersion, determineVersionBump } from './version-manager.js';

describe('bumpVersion', () => {
	it('bumps patch', () => {
		expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4');
	});

	it('bumps minor and resets patch', () => {
		expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0');
	});

	it('handles zero versions', () => {
		expect(bumpVersion('0.1.0', 'patch')).toBe('0.1.1');
		expect(bumpVersion('0.1.0', 'minor')).toBe('0.2.0');
	});
});

describe('determineVersionBump', () => {
	it('returns null when content hash unchanged and no dirty deps', () => {
		const prev: ManifestEntry = {
			version: '1.0.0',
			contentHash: 'same',
			inputsHash: 'abc',
			outputsHash: 'def',
			dependencies: [],
			tokenEstimate: 0,
			inputTokenEstimate: 0,
		};
		const result = determineVersionBump(prev, 'same', 'abc', false);
		expect(result).toBeNull();
	});

	it('returns patch when content changed but inputs hash same', () => {
		const prev: ManifestEntry = {
			version: '1.0.0',
			contentHash: 'old',
			inputsHash: 'abc',
			outputsHash: 'def',
			dependencies: [],
			tokenEstimate: 0,
			inputTokenEstimate: 0,
		};
		const result = determineVersionBump(prev, 'new', 'abc', false);
		expect(result).toBe('patch');
	});

	it('returns minor when inputs hash changed', () => {
		const prev: ManifestEntry = {
			version: '1.0.0',
			contentHash: 'old',
			inputsHash: 'old-inputs',
			outputsHash: 'def',
			dependencies: [],
			tokenEstimate: 0,
			inputTokenEstimate: 0,
		};
		const result = determineVersionBump(prev, 'new', 'new-inputs', false);
		expect(result).toBe('minor');
	});

	it('returns patch when dependency is dirty but own content unchanged', () => {
		const prev: ManifestEntry = {
			version: '1.0.0',
			contentHash: 'same',
			inputsHash: 'abc',
			outputsHash: 'def',
			dependencies: ['dep.prompt.md'],
			tokenEstimate: 0,
			inputTokenEstimate: 0,
		};
		const result = determineVersionBump(prev, 'same', 'abc', true);
		expect(result).toBe('patch');
	});
});
