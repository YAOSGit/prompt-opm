import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runAnalyze } from './analyze.js';

const TEST_DIR = join(import.meta.dirname, '../../../.test-analyze-cmd');

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
});

afterEach(() => {
	if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
	vi.restoreAllMocks();
});

describe('runAnalyze', () => {
	it('displays table output for prompts', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'hello.prompt.md'),
			'---\nmodel: "test-model"\nversion: "1.0.0"\ninputs:\n  name: string\n---\nHello {{ name }}!',
		);

		runAnalyze(TEST_DIR, { json: false });

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('hello'),
		);
		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('test-model'),
		);
		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('Tokens'),
		);
	});

	it('displays dependency graph', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'shared.prompt.md'),
			'---\nmodel: test\nsnippet: true\n---\nShared.',
		);
		writeFileSync(
			join(TEST_DIR, '.prompts', 'main.prompt.md'),
			'---\nmodel: test\n---\n{{ @shared }}\nMain body.',
		);

		runAnalyze(TEST_DIR, { json: false });

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('Dependency Graph'),
		);
		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('└── @shared'),
		);
	});

	it('outputs valid JSON with --json flag', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'test.prompt.md'),
			'---\nmodel: "test-model"\nversion: "1.0.0"\n---\nTest prompt body.',
		);

		runAnalyze(TEST_DIR, { json: true });

		// Find the JSON output call
		const calls = (console.log as any).mock.calls;
		const jsonCall = calls.find((c: string[]) => {
			try { JSON.parse(c[0]); return true; } catch { return false; }
		});
		expect(jsonCall).toBeDefined();

		const parsed = JSON.parse(jsonCall[0]);
		expect(parsed.prompts).toHaveLength(1);
		expect(parsed.summary.totalPrompts).toBe(1);
		expect(parsed.dependencyGraph).toBeDefined();
	});

	it('handles empty prompts directory', () => {
		runAnalyze(TEST_DIR, { json: false });

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('No prompts found'),
		);
	});
});
