import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from './load-config.js';

const TEST_DIR = join(import.meta.dirname, '../../.test-load-config');

beforeEach(() => {
	mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
	if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
});

describe('loadConfig', () => {
	it('loads and resolves config paths', () => {
		writeFileSync(
			join(TEST_DIR, '.prompt-opm.config.json'),
			JSON.stringify({
				source: './.prompts',
				output: './src/generated/prompts',
			}),
		);

		const config = loadConfig(TEST_DIR);

		expect(config.source).toBe(resolve(TEST_DIR, './.prompts'));
		expect(config.output).toBe(resolve(TEST_DIR, './src/generated/prompts'));
		expect(config.manifest).toBeUndefined();
	});

	it('resolves manifest path when provided', () => {
		writeFileSync(
			join(TEST_DIR, '.prompt-opm.config.json'),
			JSON.stringify({
				source: './.prompts',
				output: './dist',
				manifest: './.manifest',
			}),
		);

		const config = loadConfig(TEST_DIR);

		expect(config.manifest).toBe(resolve(TEST_DIR, './.manifest'));
	});

	it('throws when config file is missing', () => {
		expect(() => loadConfig(TEST_DIR)).toThrow();
	});

	it('throws when config file is invalid JSON', () => {
		writeFileSync(join(TEST_DIR, '.prompt-opm.config.json'), 'not json');

		expect(() => loadConfig(TEST_DIR)).toThrow();
	});
});
