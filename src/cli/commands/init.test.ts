import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runInit } from './init.js';

const TEST_DIR = join(import.meta.dirname, '../../../.test-init');

beforeEach(() => {
	mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
	if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
});

describe('runInit', () => {
	it('creates .prompts directory', () => {
		runInit(TEST_DIR);
		expect(existsSync(join(TEST_DIR, '.prompts'))).toBe(true);
	});

	it('creates config file', () => {
		runInit(TEST_DIR);
		const configPath = join(TEST_DIR, '.prompt-opm.config.json');
		expect(existsSync(configPath)).toBe(true);

		const config = JSON.parse(readFileSync(configPath, 'utf-8'));
		expect(config.source).toBe('./.prompts');
		expect(config.output).toBeDefined();
	});

	it('creates example prompt', () => {
		runInit(TEST_DIR);
		const examplePath = join(TEST_DIR, '.prompts', 'hello.prompt.md');
		expect(existsSync(examplePath)).toBe(true);

		const content = readFileSync(examplePath, 'utf-8');
		expect(content).toContain('model:');
		expect(content).toContain('inputs:');
	});

	it('does not overwrite existing files', () => {
		runInit(TEST_DIR);

		const configPath = join(TEST_DIR, '.prompt-opm.config.json');
		const original = readFileSync(configPath, 'utf-8');

		// Run again — should not overwrite
		runInit(TEST_DIR);
		expect(readFileSync(configPath, 'utf-8')).toBe(original);
	});
});
