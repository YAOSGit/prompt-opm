import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scanPromptFiles } from './scanner.js';

const TEST_DIR = join(import.meta.dirname, '../../.test-prompts-scanner');

beforeEach(() => {
	mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
	if (existsSync(TEST_DIR)) {
		rmSync(TEST_DIR, { recursive: true });
	}
});

describe('scanPromptFiles', () => {
	it('finds .prompt.md files in directory', () => {
		writeFileSync(
			join(TEST_DIR, 'hello.prompt.md'),
			'---\nmodel: test\n---\nHello',
		);
		writeFileSync(join(TEST_DIR, 'other.md'), '# Not a prompt');

		const files = scanPromptFiles(TEST_DIR);
		expect(files).toHaveLength(1);
		expect(files[0]).toContain('hello.prompt.md');
	});

	it('finds files in nested directories', () => {
		const nested = join(TEST_DIR, 'sub');
		mkdirSync(nested, { recursive: true });
		writeFileSync(
			join(nested, 'deep.prompt.md'),
			'---\nmodel: test\n---\nDeep',
		);

		const files = scanPromptFiles(TEST_DIR);
		expect(files).toHaveLength(1);
		expect(files[0]).toContain('deep.prompt.md');
	});

	it('returns empty array for empty directory', () => {
		const files = scanPromptFiles(TEST_DIR);
		expect(files).toEqual([]);
	});

	it('returns absolute paths', () => {
		writeFileSync(
			join(TEST_DIR, 'abs.prompt.md'),
			'---\nmodel: test\n---\nAbs',
		);

		const files = scanPromptFiles(TEST_DIR);
		for (const f of files) {
			expect(f).toMatch(/^\//);
		}
	});
});
