import { describe, expect, it } from 'vitest';
import { generateBarrelContent, generateFileContent } from './emitter.js';

describe('generateFileContent', () => {
	it('generates valid TypeScript with all exports', () => {
		const result = generateFileContent({
			model: 'gemini-1.5-pro',
			configs: { temperature: 0.7 },
			meta: {
				version: '1.0.0',
				lastUpdated: '2026-01-01T00:00:00Z',
				sourceFile: 'test.prompt.md',
				contentHash: 'abc',
				tokenEstimate: 0,
				inputTokenEstimate: 0,
			},
			inputs: { name: 'string' },
			outputs: { bio: 'string' },
			template: 'Hello {{ name }}',
		});

		expect(result).toContain('import { z } from "zod"');
		expect(result).toContain('export const model = "gemini-1.5-pro" as const');
		expect(result).toContain('export const configs =');
		expect(result).toContain('temperature: 0.7');
		expect(result).toContain('export const meta =');
		expect(result).toContain('export const inputSchema = z.object(');
		expect(result).toContain('name: z.string()');
		expect(result).toContain('export type InputType =');
		expect(result).toContain('export const outputSchema = z.object(');
		expect(result).toContain('bio: z.string()');
		expect(result).toContain('export type OutputType =');
		expect(result).toContain('export const template =');
		expect(result).toContain('export const prompt =');
	});

	it('handles empty config', () => {
		const result = generateFileContent({
			model: 'test',
			configs: {},
			meta: {
				version: '0.1.0',
				lastUpdated: '',
				sourceFile: 'x.prompt.md',
				contentHash: 'x',
				tokenEstimate: 0,
				inputTokenEstimate: 0,
			},
			inputs: {},
			outputs: {},
			template: 'Hello',
		});

		expect(result).toContain('export const configs = {} as const');
	});

	it('includes tokenEstimate and inputTokenEstimate in meta', () => {
		const result = generateFileContent({
			model: 'test',
			configs: {},
			meta: {
				version: '1.0.0',
				lastUpdated: '2026-01-01T00:00:00Z',
				sourceFile: 'test.prompt.md',
				contentHash: 'abc',
				tokenEstimate: 245,
				inputTokenEstimate: 200,
			},
			inputs: { name: 'string' },
			outputs: { bio: 'string' },
			template: 'Hello {{ name }}',
		});

		expect(result).toContain('tokenEstimate: 245');
		expect(result).toContain('inputTokenEstimate: 200');
	});

	it('generates prompt function that handles default values', () => {
		const result = generateFileContent({
			model: 'test',
			configs: {},
			meta: {
				version: '0.1.0',
				lastUpdated: '',
				sourceFile: 'x.prompt.md',
				contentHash: 'x',
				tokenEstimate: 0,
				inputTokenEstimate: 0,
			},
			inputs: { name: 'string' },
			outputs: {},
			template: 'Hello {{ name | "Stranger" }}!',
		});

		expect(result).toContain('const VARIABLE_WITH_DEFAULT_RE =');
		expect(result).toContain('if (value === undefined || value === null) return defaultValue;');
	});
});

describe('generateBarrelContent', () => {
	it('generates re-exports for all files', () => {
		const result = generateBarrelContent(['generateBio', 'translateEmail']);
		expect(result).toContain('export * as generateBio from "./generateBio.js"');
		expect(result).toContain(
			'export * as translateEmail from "./translateEmail.js"',
		);
	});

	it('handles empty list', () => {
		const result = generateBarrelContent([]);
		expect(result).toBe('');
	});
});
