import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runGenerate } from './generate.js';

const TEST_DIR = join(import.meta.dirname, '../../../.test-generate-cmd');

beforeEach(() => {
	mkdirSync(TEST_DIR, { recursive: true });
	mkdirSync(join(TEST_DIR, '.prompts'), { recursive: true });

	writeFileSync(
		join(TEST_DIR, '.prompt-opm.config.json'),
		JSON.stringify({
			source: './.prompts',
			output: './src/generated/prompts',
		}),
	);

	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
	vi.restoreAllMocks();
});

describe('runGenerate', () => {
	it('generates files and logs output', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'test.prompt.md'),
			'---\nmodel: "test-model"\ninputs:\n  name: string\n---\nHello {{ name }}!',
		);

		runGenerate(TEST_DIR);

		expect(existsSync(join(TEST_DIR, 'src/generated/prompts/test.ts'))).toBe(
			true,
		);
		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('Generated 1 file'),
		);
	});

	it('logs warnings when snippets have outputs', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'withoutput.prompt.md'),
			'---\nmodel: test\noutputs:\n  result: string\n---\nSnippet body',
		);
		writeFileSync(
			join(TEST_DIR, '.prompts', 'uses-snippet.prompt.md'),
			'---\nmodel: test\n---\n{{ @withoutput }}\nMain body',
		);

		runGenerate(TEST_DIR);

		expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('WARN:'));
	});

	it('logs errors and sets exit code on parse errors', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'bad.prompt.md'),
			'no frontmatter at all',
		);

		runGenerate(TEST_DIR);

		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('ERROR'),
		);
		expect(process.exitCode).toBe(1);

		process.exitCode = undefined;
	});

	it('handles empty prompts directory', () => {
		runGenerate(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('Generated 0 file'),
		);
	});
});
