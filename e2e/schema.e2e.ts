import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const E2E_DIR = join(import.meta.dirname, '../.test-e2e-schema');
const CLI = join(import.meta.dirname, '../dist/cli.js');

function run(command: string): string {
	return execSync(`node ${CLI} ${command}`, {
		cwd: E2E_DIR,
		encoding: 'utf-8',
	});
}

beforeEach(() => {
	mkdirSync(E2E_DIR, { recursive: true });
});

afterEach(() => {
	if (existsSync(E2E_DIR)) rmSync(E2E_DIR, { recursive: true });
});

describe('schema command E2E', () => {
	it('exports valid JSON Schema', () => {
		run('init');

		writeFileSync(
			join(E2E_DIR, '.prompts', 'summarize.prompt.md'),
			`---
model: "gpt-4"
inputs:
  text: string
  maxLength: number
outputs:
  summary: string
  keywords: string[]
---
Summarize the following text in {{ maxLength }} words: {{ text }}`,
		);

		const output = run('schema');
		const parsed = JSON.parse(output);

		expect(parsed).toHaveProperty('summarize');
		expect(parsed.summarize).toHaveProperty('inputs');
		expect(parsed.summarize).toHaveProperty('outputs');
		expect(parsed.summarize.inputs.type).toBe('object');
	});

	it('includes both input and output schemas with correct types', () => {
		run('init');

		writeFileSync(
			join(E2E_DIR, '.prompts', 'translate.prompt.md'),
			`---
model: "gpt-4"
inputs:
  text: string
  targetLang: string
outputs:
  translation: string
  confidence: number
---
Translate "{{ text }}" to {{ targetLang }}.`,
		);

		const output = run('schema');
		const parsed = JSON.parse(output);

		const schema = parsed.translate;
		expect(schema.inputs.properties.text).toEqual({ type: 'string' });
		expect(schema.inputs.properties.targetLang).toEqual({ type: 'string' });
		expect(schema.outputs.properties.translation).toEqual({ type: 'string' });
		expect(schema.outputs.properties.confidence).toEqual({ type: 'number' });
	});

	it('handles prompt with no outputs gracefully', () => {
		run('init');

		writeFileSync(
			join(E2E_DIR, '.prompts', 'simple.prompt.md'),
			`---
model: "gpt-4"
inputs:
  topic: string
---
Tell me about {{ topic }}.`,
		);

		const output = run('schema');
		const parsed = JSON.parse(output);

		expect(parsed).toHaveProperty('simple');
		expect(parsed.simple).toHaveProperty('inputs');
		expect(parsed.simple).toHaveProperty('outputs');
		// outputs should be an empty object schema
		expect(parsed.simple.outputs.type).toBe('object');
	});
});
