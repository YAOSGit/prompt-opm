import { describe, expect, it } from 'vitest';
import { parsePromptFile } from './parser.js';

const VALID_PROMPT = `---
model: "gemini-1.5-pro"
version: "1.0.0"
config:
  temperature: 0.7
  topK: 40
inputs:
  name: string
  traits: string[]
outputs:
  bio: string
---
Hello {{ name }}, your traits are {{ traits }}.
{{ @persona_expert }}
{{ @.local_snippet }}`;

describe('parsePromptFile', () => {
	it('parses frontmatter model', () => {
		const result = parsePromptFile(VALID_PROMPT, '/test/file.prompt.md');
		expect(result.frontmatter.model).toBe('gemini-1.5-pro');
	});

	it('parses frontmatter version', () => {
		const result = parsePromptFile(VALID_PROMPT, '/test/file.prompt.md');
		expect(result.frontmatter.version).toBe('1.0.0');
	});

	it('parses config', () => {
		const result = parsePromptFile(VALID_PROMPT, '/test/file.prompt.md');
		expect(result.frontmatter.config).toEqual({ temperature: 0.7, topK: 40 });
	});

	it('parses inputs', () => {
		const result = parsePromptFile(VALID_PROMPT, '/test/file.prompt.md');
		expect(result.frontmatter.inputs).toEqual({
			name: 'string',
			traits: 'string[]',
		});
	});

	it('parses outputs', () => {
		const result = parsePromptFile(VALID_PROMPT, '/test/file.prompt.md');
		expect(result.frontmatter.outputs).toEqual({ bio: 'string' });
	});

	it('parses nested inputs', () => {
		const prompt =
			'---\nmodel: test\ninputs:\n  user:\n    name: string\n---\nHello';
		const result = parsePromptFile(prompt, '/test.prompt.md');
		expect(result.frontmatter.inputs).toEqual({ user: { name: 'string' } });
	});

	it('extracts variables from body', () => {
		const result = parsePromptFile(VALID_PROMPT, '/test/file.prompt.md');
		expect(result.variables).toEqual(['name', 'traits']);
	});

	it('extracts root snippets from body', () => {
		const result = parsePromptFile(VALID_PROMPT, '/test/file.prompt.md');
		expect(result.snippets).toContain('@persona_expert');
	});

	it('extracts relative snippets from body', () => {
		const result = parsePromptFile(VALID_PROMPT, '/test/file.prompt.md');
		expect(result.snippets).toContain('@.local_snippet');
	});

	it('extracts variables with default values', () => {
		const prompt = '---\nmodel: test\n---\nHello {{ name | "Stranger" }}!';
		const result = parsePromptFile(prompt, '/test.prompt.md');
		expect(result.variables).toEqual(['name']);
	});

	it('stores the body without frontmatter', () => {
		const result = parsePromptFile(VALID_PROMPT, '/test/file.prompt.md');
		expect(result.body).not.toContain('---');
		expect(result.body).toContain('Hello {{ name }}');
	});

	it('stores the file path', () => {
		const result = parsePromptFile(VALID_PROMPT, '/test/file.prompt.md');
		expect(result.filePath).toBe('/test/file.prompt.md');
	});

	it('throws on missing model', () => {
		const noModel = '---\ninputs:\n  name: string\n---\nHello';
		expect(() => parsePromptFile(noModel, '/test.prompt.md')).toThrow(/model/i);
	});

	it('defaults version to undefined if not provided', () => {
		const noVersion = '---\nmodel: test\n---\nHello';
		const result = parsePromptFile(noVersion, '/test.prompt.md');
		expect(result.frontmatter.version).toBeUndefined();
	});
});
