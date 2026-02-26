import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PromptFile } from '../types/index.js';
import { resolveSnippets } from './snippet-resolver.js';

const TEST_DIR = join(import.meta.dirname, '../../.test-prompts-snippets');

beforeEach(() => {
	mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
	if (existsSync(TEST_DIR)) {
		rmSync(TEST_DIR, { recursive: true });
	}
});

function makePromptFile(overrides: Partial<PromptFile>): PromptFile {
	return {
		filePath: overrides.filePath ?? '/test.prompt.md',
		frontmatter: { model: 'test', ...overrides.frontmatter },
		body: overrides.body ?? '',
		variables: overrides.variables ?? [],
		snippets: overrides.snippets ?? [],
	};
}

describe('resolveSnippets', () => {
	it('returns body unchanged when no snippets', () => {
		const file = makePromptFile({ body: 'Hello {{ name }}' });
		const result = resolveSnippets(file, TEST_DIR);
		expect(result.body).toBe('Hello {{ name }}');
	});

	it('resolves root snippet', () => {
		writeFileSync(
			join(TEST_DIR, 'greeting.prompt.md'),
			'---\nmodel: test\n---\nYou are a friendly assistant.',
		);

		const file = makePromptFile({
			body: '{{ @greeting }}\nHelp me.',
			snippets: ['@greeting'],
		});

		const result = resolveSnippets(file, TEST_DIR);
		expect(result.body).toContain('You are a friendly assistant.');
		expect(result.body).toContain('Help me.');
		expect(result.body).not.toContain('{{ @greeting }}');
	});

	it('resolves relative snippet with @.', () => {
		const subDir = join(TEST_DIR, 'sub');
		mkdirSync(subDir, { recursive: true });

		writeFileSync(
			join(subDir, 'local.prompt.md'),
			'---\nmodel: test\n---\nLocal content.',
		);

		const file = makePromptFile({
			filePath: join(subDir, 'main.prompt.md'),
			body: '{{ @.local }}\nMore text.',
			snippets: ['@.local'],
		});

		const result = resolveSnippets(file, TEST_DIR);
		expect(result.body).toContain('Local content.');
	});

	it('merges snippet inputs with same name and type', () => {
		writeFileSync(
			join(TEST_DIR, 'intro.prompt.md'),
			'---\nmodel: test\ninputs:\n  name: string\n---\nHi {{ name }}.',
		);

		const file = makePromptFile({
			frontmatter: { model: 'test', inputs: { name: 'string' } },
			body: '{{ @intro }}\nBye {{ name }}.',
			snippets: ['@intro'],
		});

		const result = resolveSnippets(file, TEST_DIR);
		expect(result.mergedInputs).toEqual({ name: 'string' });
	});

	it('throws on conflicting input types', () => {
		writeFileSync(
			join(TEST_DIR, 'conflict.prompt.md'),
			'---\nmodel: test\ninputs:\n  name: number\n---\nHi {{ name }}.',
		);

		const file = makePromptFile({
			frontmatter: { model: 'test', inputs: { name: 'string' } },
			body: '{{ @conflict }}\nBye.',
			snippets: ['@conflict'],
		});

		expect(() => resolveSnippets(file, TEST_DIR)).toThrow(/conflict.*name/i);
	});

	it('detects circular dependencies', () => {
		writeFileSync(
			join(TEST_DIR, 'a.prompt.md'),
			'---\nmodel: test\n---\n{{ @b }}',
		);
		writeFileSync(
			join(TEST_DIR, 'b.prompt.md'),
			'---\nmodel: test\n---\n{{ @a }}',
		);

		const file = makePromptFile({
			filePath: join(TEST_DIR, 'a.prompt.md'),
			body: '{{ @b }}',
			snippets: ['@b'],
		});

		expect(() => resolveSnippets(file, TEST_DIR)).toThrow(/circular/i);
	});

	it('resolves nested snippets recursively', () => {
		writeFileSync(
			join(TEST_DIR, 'outer.prompt.md'),
			'---\nmodel: test\n---\nOuter {{ @inner }}',
		);
		writeFileSync(
			join(TEST_DIR, 'inner.prompt.md'),
			'---\nmodel: test\n---\nInner content',
		);

		const file = makePromptFile({
			body: '{{ @outer }}',
			snippets: ['@outer'],
		});

		const result = resolveSnippets(file, TEST_DIR);
		expect(result.body).toContain('Inner content');
		expect(result.body).toContain('Outer');
	});

	it('warns and ignores outputs in snippets', () => {
		writeFileSync(
			join(TEST_DIR, 'withoutput.prompt.md'),
			'---\nmodel: test\noutputs:\n  bio: string\n---\nSnippet body.',
		);

		const file = makePromptFile({
			body: '{{ @withoutput }}',
			snippets: ['@withoutput'],
		});

		const result = resolveSnippets(file, TEST_DIR);
		expect(result.warnings).toContainEqual(
			expect.stringMatching(/output.*withoutput/i),
		);
	});

	it('throws when snippet file not found', () => {
		const file = makePromptFile({
			body: '{{ @nonexistent }}',
			snippets: ['@nonexistent'],
		});

		expect(() => resolveSnippets(file, TEST_DIR)).toThrow(
			/not found.*nonexistent/i,
		);
	});
});
