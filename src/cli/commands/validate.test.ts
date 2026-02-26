import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runValidate } from './validate.js';

const TEST_DIR = join(import.meta.dirname, '../../../.test-validate-cmd');

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

	vi.spyOn(console, 'log').mockImplementation(() => { });
	vi.spyOn(console, 'warn').mockImplementation(() => { });
	vi.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
	if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
	vi.restoreAllMocks();
	process.exitCode = undefined;
});

describe('runValidate', () => {
	it('reports no errors for valid prompts', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'valid.prompt.md'),
			'---\nmodel: "test-model"\ninputs:\n  name: string\n---\nHello {{ name }}!',
		);

		runValidate(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('Validated 1 file(s) — no errors'),
		);
		expect(process.exitCode).toBeUndefined();
	});

	it('reports errors for invalid prompts and sets exit code', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'invalid.prompt.md'),
			'no frontmatter',
		);

		runValidate(TEST_DIR);

		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('ERROR'),
		);
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('Found 1 error(s)'),
		);
		expect(process.exitCode).toBe(1);
	});

	it('validates multiple files and counts correctly', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'a.prompt.md'),
			'---\nmodel: test\n---\nA',
		);
		writeFileSync(
			join(TEST_DIR, '.prompts', 'b.prompt.md'),
			'---\nmodel: test\n---\nB',
		);
		writeFileSync(
			join(TEST_DIR, '.prompts', 'c.prompt.md'),
			'---\nmodel: test\n---\nC',
		);

		runValidate(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('Validated 3 file(s) — no errors'),
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

		runValidate(TEST_DIR);

		expect(console.warn).toHaveBeenCalledWith(
			expect.stringContaining('WARN:'),
		);
	});

	it('reports missing snippets as errors', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'missing-snippet.prompt.md'),
			'---\nmodel: test\n---\n{{ @nonexistent }}\nBody',
		);

		runValidate(TEST_DIR);

		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('ERROR'),
		);
		expect(process.exitCode).toBe(1);
	});

	it('handles empty prompts directory', () => {
		runValidate(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('Validated 0 file(s) — no errors'),
		);
	});

	it('continues validation after encountering errors', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'good.prompt.md'),
			'---\nmodel: test\n---\nGood',
		);
		writeFileSync(
			join(TEST_DIR, '.prompts', 'bad.prompt.md'),
			'invalid content',
		);

		runValidate(TEST_DIR);

		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('Found 1 error(s) in 2 file(s)'),
		);
	});

	it('warns when inputs are declared but not used', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'unused.prompt.md'),
			'---\nmodel: test\ninputs:\n  used: string\n  unused: string\n---\n{{ used }}',
		);

		runValidate(TEST_DIR);

		expect(console.warn).toHaveBeenCalledWith(
			expect.stringContaining('Input "unused" declared in'),
		);
		expect(console.warn).toHaveBeenCalledWith(
			expect.stringContaining('but never used in template'),
		);
	});

	it('errors when variables are used but not declared', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'missing.prompt.md'),
			'---\nmodel: test\ninputs:\n  declared: string\n---\n{{ declared }} {{ missing }}',
		);

		runValidate(TEST_DIR);

		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('Variable "{{ missing }}" used in body but not declared in inputs'),
		);
		expect(process.exitCode).toBe(1);
	});

	it('errors when variables with defaults are missing from inputs', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'missing-with-default.prompt.md'),
			'---\nmodel: test\n---\n{{ missing | "default" }}',
		);

		runValidate(TEST_DIR);

		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('Variable "{{ missing }}" used in body but not declared in inputs'),
		);
		expect(process.exitCode).toBe(1);
	});
});
