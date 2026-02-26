import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { OpmConfig } from '../types/index.js';
import { analyze } from './analyzer.js';

const TEST_SOURCE = join(import.meta.dirname, '../../.test-analyzer-source');
const config: OpmConfig = { source: TEST_SOURCE, output: '' };

beforeEach(() => {
	mkdirSync(TEST_SOURCE, { recursive: true });
});

afterEach(() => {
	if (existsSync(TEST_SOURCE)) rmSync(TEST_SOURCE, { recursive: true });
});

describe('analyze', () => {
	it('returns analysis for a single prompt', () => {
		writeFileSync(
			join(TEST_SOURCE, 'hello.prompt.md'),
			'---\nmodel: "test-model"\nversion: "1.0.0"\ninputs:\n  name: string\noutputs:\n  greeting: string\n---\nHello {{ name }}!',
		);

		const result = analyze(config);

		expect(result.prompts).toHaveLength(1);
		expect(result.prompts[0].file).toBe('hello.prompt.md');
		expect(result.prompts[0].model).toBe('test-model');
		expect(result.prompts[0].version).toBe('1.0.0');
		expect(result.prompts[0].tokenEstimate).toBeGreaterThan(0);
		expect(result.prompts[0].inputTokenEstimate).toBeLessThanOrEqual(
			result.prompts[0].tokenEstimate,
		);
		expect(result.prompts[0].variables).toEqual(['name']);
		expect(result.prompts[0].snippets).toEqual([]);
		expect(result.prompts[0].dependencies).toEqual([]);
	});

	it('computes summary totals', () => {
		writeFileSync(
			join(TEST_SOURCE, 'a.prompt.md'),
			'---\nmodel: test\n---\nPrompt A body text here.',
		);
		writeFileSync(
			join(TEST_SOURCE, 'b.prompt.md'),
			'---\nmodel: test\n---\nPrompt B body text here.',
		);

		const result = analyze(config);

		expect(result.summary.totalPrompts).toBe(2);
		expect(result.summary.totalTokens).toBeGreaterThan(0);
	});

	it('builds dependency graph from snippets', () => {
		writeFileSync(
			join(TEST_SOURCE, 'shared.prompt.md'),
			'---\nmodel: test\nsnippet: true\n---\nShared content here.',
		);
		writeFileSync(
			join(TEST_SOURCE, 'main.prompt.md'),
			'---\nmodel: test\n---\n{{ @shared }}\nMain body.',
		);

		const result = analyze(config);

		expect(result.prompts).toHaveLength(1); // snippet excluded
		expect(result.dependencyGraph.main).toContain('shared.prompt.md');
	});

	it('skips snippet-only files from prompt list', () => {
		writeFileSync(
			join(TEST_SOURCE, 'snippet.prompt.md'),
			'---\nmodel: test\nsnippet: true\n---\nSnippet only.',
		);

		const result = analyze(config);

		expect(result.prompts).toHaveLength(0);
		expect(result.summary.totalPrompts).toBe(0);
	});

	it('handles empty source directory', () => {
		const result = analyze(config);

		expect(result.prompts).toEqual([]);
		expect(result.summary.totalPrompts).toBe(0);
		expect(result.summary.totalTokens).toBe(0);
	});

	it('collects errors gracefully without crashing', () => {
		writeFileSync(
			join(TEST_SOURCE, 'good.prompt.md'),
			'---\nmodel: test\n---\nGood prompt.',
		);
		writeFileSync(join(TEST_SOURCE, 'bad.prompt.md'), 'no frontmatter at all');

		const result = analyze(config);

		// Should still return the good prompt
		expect(result.prompts).toHaveLength(1);
		expect(result.prompts[0].file).toBe('good.prompt.md');
	});
});
