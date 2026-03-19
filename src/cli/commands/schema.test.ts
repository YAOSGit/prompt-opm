import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
	readFileSync: vi.fn(),
}));

vi.mock('../loadConfig.js', () => ({
	loadConfig: vi.fn(),
}));

vi.mock('../../core/Scanner/index.js', () => ({
	scanPromptFiles: vi.fn(),
}));

vi.mock('../../core/Parser/index.js', () => ({
	parsePromptFile: vi.fn(),
}));

vi.mock('../../core/SnippetResolver/index.js', () => ({
	resolveSnippets: vi.fn(),
}));

vi.mock('@yaos-git/toolkit/cli', () => ({
	fatalError: vi.fn(),
}));

vi.mock('chalk', () => ({
	default: {
		red: (s: string) => s,
	},
}));

import { readFileSync } from 'node:fs';
import { fatalError } from '@yaos-git/toolkit/cli';
import { parsePromptFile } from '../../core/Parser/index.js';
import { scanPromptFiles } from '../../core/Scanner/index.js';
import { resolveSnippets } from '../../core/SnippetResolver/index.js';
import { loadConfig } from '../loadConfig.js';
import { runSchema } from './schema.js';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('runSchema', () => {
	it('outputs JSON schema for prompt files', () => {
		vi.mocked(loadConfig).mockReturnValue({
			source: '/src/prompts',
			output: '/src/generated',
		});
		vi.mocked(scanPromptFiles).mockReturnValue([
			'/src/prompts/greet.prompt.md',
		]);
		vi.mocked(readFileSync).mockReturnValue('file content');
		vi.mocked(parsePromptFile).mockReturnValue({
			filePath: '/src/prompts/greet.prompt.md',
			frontmatter: {
				model: 'gpt-4',
				outputs: { response: 'string' },
			},
			body: 'Hello {{ name }}',
			variables: ['name'],
			snippets: [],
		});
		vi.mocked(resolveSnippets).mockReturnValue({
			body: 'Hello {{ name }}',
			mergedInputs: { name: 'string' },
			warnings: [],
			resolvedDependencies: [],
		});

		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		runSchema('/project', { format: 'jsonschema' });

		expect(logSpy).toHaveBeenCalledTimes(1);
		const output = JSON.parse(logSpy.mock.calls[0][0]);
		expect(output).toHaveProperty('greet');
		expect(output.greet.inputs).toEqual({
			type: 'object',
			properties: { name: { type: 'string' } },
			required: ['name'],
			additionalProperties: false,
		});
		expect(output.greet.outputs).toEqual({
			type: 'object',
			properties: { response: { type: 'string' } },
			required: ['response'],
			additionalProperties: false,
		});
	});

	it('skips snippet files', () => {
		vi.mocked(loadConfig).mockReturnValue({
			source: '/src/prompts',
			output: '/src/generated',
		});
		vi.mocked(scanPromptFiles).mockReturnValue([
			'/src/prompts/shared.prompt.md',
		]);
		vi.mocked(readFileSync).mockReturnValue('file content');
		vi.mocked(parsePromptFile).mockReturnValue({
			filePath: '/src/prompts/shared.prompt.md',
			frontmatter: {
				model: '',
				snippet: true,
			},
			body: 'Shared content.',
			variables: [],
			snippets: [],
		});

		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		runSchema('/project', { format: 'jsonschema' });

		const output = JSON.parse(logSpy.mock.calls[0][0]);
		expect(Object.keys(output)).toHaveLength(0);
	});

	it('calls fatalError for unsupported format', () => {
		vi.mocked(loadConfig).mockReturnValue({
			source: '/src/prompts',
			output: '/src/generated',
		});
		vi.mocked(scanPromptFiles).mockReturnValue([]);

		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		runSchema('/project', { format: 'yaml' });

		expect(fatalError).toHaveBeenCalledWith('Unsupported format: yaml');
		expect(logSpy).not.toHaveBeenCalled();
	});

	it('handles errors in individual files gracefully', () => {
		vi.mocked(loadConfig).mockReturnValue({
			source: '/src/prompts',
			output: '/src/generated',
		});
		vi.mocked(scanPromptFiles).mockReturnValue([
			'/src/prompts/bad.prompt.md',
			'/src/prompts/good.prompt.md',
		]);
		vi.mocked(readFileSync).mockReturnValue('file content');
		vi.mocked(parsePromptFile)
			.mockImplementationOnce(() => {
				throw new Error('parse failure');
			})
			.mockReturnValueOnce({
				filePath: '/src/prompts/good.prompt.md',
				frontmatter: {
					model: 'gpt-4',
					outputs: {},
				},
				body: 'Good prompt.',
				variables: [],
				snippets: [],
			});
		vi.mocked(resolveSnippets).mockReturnValue({
			body: 'Good prompt.',
			mergedInputs: {},
			warnings: [],
			resolvedDependencies: [],
		});

		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		runSchema('/project', { format: 'jsonschema' });

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('bad.prompt.md'),
			expect.any(Error),
		);
		const output = JSON.parse(logSpy.mock.calls[0][0]);
		expect(output).toHaveProperty('good');
		expect(output).not.toHaveProperty('bad');
	});

	it('handles optional inputs with ? suffix', () => {
		vi.mocked(loadConfig).mockReturnValue({
			source: '/src/prompts',
			output: '/src/generated',
		});
		vi.mocked(scanPromptFiles).mockReturnValue([
			'/src/prompts/test.prompt.md',
		]);
		vi.mocked(readFileSync).mockReturnValue('file content');
		vi.mocked(parsePromptFile).mockReturnValue({
			filePath: '/src/prompts/test.prompt.md',
			frontmatter: {
				model: 'gpt-4',
				outputs: {},
			},
			body: 'Test',
			variables: [],
			snippets: [],
		});
		vi.mocked(resolveSnippets).mockReturnValue({
			body: 'Test',
			mergedInputs: { name: 'string', 'age?': 'number' },
			warnings: [],
			resolvedDependencies: [],
		});

		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		runSchema('/project', { format: 'jsonschema' });

		const output = JSON.parse(logSpy.mock.calls[0][0]);
		expect(output.test.inputs.properties.name).toEqual({ type: 'string' });
		expect(output.test.inputs.properties.age).toEqual({ type: 'number' });
		expect(output.test.inputs.required).toEqual(['name']);
	});

	it('converts array types in schema', () => {
		vi.mocked(loadConfig).mockReturnValue({
			source: '/src/prompts',
			output: '/src/generated',
		});
		vi.mocked(scanPromptFiles).mockReturnValue([
			'/src/prompts/list.prompt.md',
		]);
		vi.mocked(readFileSync).mockReturnValue('file content');
		vi.mocked(parsePromptFile).mockReturnValue({
			filePath: '/src/prompts/list.prompt.md',
			frontmatter: {
				model: 'gpt-4',
				outputs: { tags: 'string[]' },
			},
			body: 'List',
			variables: [],
			snippets: [],
		});
		vi.mocked(resolveSnippets).mockReturnValue({
			body: 'List',
			mergedInputs: { items: 'number[]' },
			warnings: [],
			resolvedDependencies: [],
		});

		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		runSchema('/project', { format: 'jsonschema' });

		const output = JSON.parse(logSpy.mock.calls[0][0]);
		expect(output.list.inputs.properties.items).toEqual({
			type: 'array',
			items: { type: 'number' },
		});
		expect(output.list.outputs.properties.tags).toEqual({
			type: 'array',
			items: { type: 'string' },
		});
	});

	it('converts enum types in schema', () => {
		vi.mocked(loadConfig).mockReturnValue({
			source: '/src/prompts',
			output: '/src/generated',
		});
		vi.mocked(scanPromptFiles).mockReturnValue([
			'/src/prompts/mood.prompt.md',
		]);
		vi.mocked(readFileSync).mockReturnValue('file content');
		vi.mocked(parsePromptFile).mockReturnValue({
			filePath: '/src/prompts/mood.prompt.md',
			frontmatter: {
				model: 'gpt-4',
				outputs: { sentiment: 'enum(positive, negative, neutral)' },
			},
			body: 'Mood',
			variables: [],
			snippets: [],
		});
		vi.mocked(resolveSnippets).mockReturnValue({
			body: 'Mood',
			mergedInputs: {},
			warnings: [],
			resolvedDependencies: [],
		});

		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		runSchema('/project', { format: 'jsonschema' });

		const output = JSON.parse(logSpy.mock.calls[0][0]);
		expect(output.mood.outputs.properties.sentiment).toEqual({
			type: 'string',
			enum: ['positive', 'negative', 'neutral'],
		});
	});

	it('converts nested object types in schema', () => {
		vi.mocked(loadConfig).mockReturnValue({
			source: '/src/prompts',
			output: '/src/generated',
		});
		vi.mocked(scanPromptFiles).mockReturnValue([
			'/src/prompts/nested.prompt.md',
		]);
		vi.mocked(readFileSync).mockReturnValue('file content');
		vi.mocked(parsePromptFile).mockReturnValue({
			filePath: '/src/prompts/nested.prompt.md',
			frontmatter: {
				model: 'gpt-4',
				outputs: {},
			},
			body: 'Nested',
			variables: [],
			snippets: [],
		});
		vi.mocked(resolveSnippets).mockReturnValue({
			body: 'Nested',
			mergedInputs: {
				user: { name: 'string', age: 'number' },
			},
			warnings: [],
			resolvedDependencies: [],
		});

		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		runSchema('/project', { format: 'jsonschema' });

		const output = JSON.parse(logSpy.mock.calls[0][0]);
		expect(output.nested.inputs.properties.user).toEqual({
			type: 'object',
			properties: {
				name: { type: 'string' },
				age: { type: 'number' },
			},
			required: ['name', 'age'],
			additionalProperties: false,
		});
	});
});
