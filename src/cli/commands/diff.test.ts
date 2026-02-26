import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generate } from '../../core/generate.js';
import { runDiff } from './diff.js';

const TEST_DIR = join(import.meta.dirname, '../../../.test-diff-cmd');

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

describe('runDiff', () => {
	it('shows new files before first generate', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'new.prompt.md'),
			'---\nmodel: test\n---\nNew prompt',
		);

		runDiff(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith('Changes:');
		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('new.ts (new)'),
		);
	});

	it('shows no changes after generate', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'stable.prompt.md'),
			'---\nmodel: test\n---\nStable',
		);

		generate({
			source: join(TEST_DIR, '.prompts'),
			output: join(TEST_DIR, 'src/generated/prompts'),
		});

		runDiff(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith('No changes detected.');
	});

	it('detects patch bump when body changes', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'patch.prompt.md'),
			'---\nmodel: test\nversion: "1.0.0"\n---\nOriginal body',
		);

		generate({
			source: join(TEST_DIR, '.prompts'),
			output: join(TEST_DIR, 'src/generated/prompts'),
		});

		writeFileSync(
			join(TEST_DIR, '.prompts', 'patch.prompt.md'),
			'---\nmodel: test\nversion: "1.0.0"\n---\nModified body',
		);

		runDiff(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('patch.ts (patch bump)'),
		);
	});

	it('detects minor bump when inputs change', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'minor.prompt.md'),
			'---\nmodel: test\nversion: "1.0.0"\ninputs:\n  x: string\n---\nBody {{ x }}',
		);

		generate({
			source: join(TEST_DIR, '.prompts'),
			output: join(TEST_DIR, 'src/generated/prompts'),
		});

		writeFileSync(
			join(TEST_DIR, '.prompts', 'minor.prompt.md'),
			'---\nmodel: test\nversion: "1.0.0"\ninputs:\n  x: string\n  y: number\n---\nBody {{ x }} {{ y }}',
		);

		runDiff(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('minor.ts (minor bump)'),
		);
	});

	it('detects removed files', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'toremove.prompt.md'),
			'---\nmodel: test\n---\nWill be removed',
		);

		generate({
			source: join(TEST_DIR, '.prompts'),
			output: join(TEST_DIR, 'src/generated/prompts'),
		});

		rmSync(join(TEST_DIR, '.prompts', 'toremove.prompt.md'));

		runDiff(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('toremove.ts (removed)'),
		);
	});

	it('handles multiple changes at once', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'existing.prompt.md'),
			'---\nmodel: test\nversion: "1.0.0"\n---\nExisting',
		);

		generate({
			source: join(TEST_DIR, '.prompts'),
			output: join(TEST_DIR, 'src/generated/prompts'),
		});

		writeFileSync(
			join(TEST_DIR, '.prompts', 'existing.prompt.md'),
			'---\nmodel: test\nversion: "1.0.0"\n---\nModified',
		);
		writeFileSync(
			join(TEST_DIR, '.prompts', 'brand-new.prompt.md'),
			'---\nmodel: test\n---\nBrand new',
		);

		runDiff(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith('Changes:');
	});

	it('handles parse errors gracefully', () => {
		writeFileSync(
			join(TEST_DIR, '.prompts', 'bad.prompt.md'),
			'---\nmodel: test\n---\nGood',
		);

		generate({
			source: join(TEST_DIR, '.prompts'),
			output: join(TEST_DIR, 'src/generated/prompts'),
		});

		writeFileSync(
			join(TEST_DIR, '.prompts', 'bad.prompt.md'),
			'no frontmatter anymore',
		);

		runDiff(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('bad.ts (error:'),
		);
	});
});
