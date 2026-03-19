import { execSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const E2E_DIR = join(import.meta.dirname, '../.test-e2e-multi-prompt');
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

describe('multi-prompt E2E', () => {
	it('barrel index re-exports all prompts', () => {
		run('init');

		writeFileSync(
			join(E2E_DIR, '.prompts', 'summarize.prompt.md'),
			'---\nmodel: "gpt-4"\ninputs:\n  text: string\n---\nSummarize: {{ text }}',
		);

		writeFileSync(
			join(E2E_DIR, '.prompts', 'translate.prompt.md'),
			'---\nmodel: "gpt-4"\ninputs:\n  text: string\n---\nTranslate: {{ text }}',
		);

		const output = run('generate');

		// Should generate 3 files (hello + summarize + translate)
		expect(output).toContain('Generated 3 file');

		const barrel = readFileSync(
			join(E2E_DIR, 'src/generated/prompts/index.ts'),
			'utf-8',
		);

		expect(barrel).toContain('hello');
		expect(barrel).toContain('summarize');
		expect(barrel).toContain('translate');
	});

	it('multiple models are correctly assigned', () => {
		run('init');

		writeFileSync(
			join(E2E_DIR, '.prompts', 'fast.prompt.md'),
			'---\nmodel: "gpt-3.5-turbo"\ninputs:\n  q: string\n---\nAnswer: {{ q }}',
		);

		writeFileSync(
			join(E2E_DIR, '.prompts', 'smart.prompt.md'),
			'---\nmodel: "claude-3-opus"\ninputs:\n  q: string\n---\nThink: {{ q }}',
		);

		run('generate');

		const fast = readFileSync(
			join(E2E_DIR, 'src/generated/prompts/fast.ts'),
			'utf-8',
		);
		const smart = readFileSync(
			join(E2E_DIR, 'src/generated/prompts/smart.ts'),
			'utf-8',
		);

		expect(fast).toContain('"gpt-3.5-turbo"');
		expect(smart).toContain('"claude-3-opus"');
	});

	it('nested directory prompts generate to correct output paths', () => {
		run('init');

		// Create a subdirectory with a prompt
		const subDir = join(E2E_DIR, '.prompts', 'sub');
		mkdirSync(subDir, { recursive: true });

		writeFileSync(
			join(subDir, 'nested.prompt.md'),
			'---\nmodel: "gpt-4"\ninputs:\n  x: string\n---\nNested: {{ x }}',
		);

		run('generate');

		// The scanner walks recursively, so nested prompt should be found
		// The output file name is based on the basename
		expect(existsSync(join(E2E_DIR, 'src/generated/prompts/nested.ts'))).toBe(
			true,
		);
	});

	it('array and enum types produce correct Zod schemas', () => {
		run('init');

		writeFileSync(
			join(E2E_DIR, '.prompts', 'complex.prompt.md'),
			`---
model: "gpt-4"
inputs:
  tags: string[]
  priority: "enum(low, medium, high)"
outputs:
  result: string
  scores: number[]
---
Process tags: {{ tags }} with priority {{ priority }}.`,
		);

		run('generate');

		const generated = readFileSync(
			join(E2E_DIR, 'src/generated/prompts/complex.ts'),
			'utf-8',
		);

		// Array type should produce z.array(z.string())
		expect(generated).toContain('z.array(z.string())');
		// Enum type should produce z.enum(["low", "medium", "high"])
		expect(generated).toContain('z.enum(');
		expect(generated).toContain('"low"');
		expect(generated).toContain('"high"');
		// Output array type
		expect(generated).toContain('z.array(z.number())');
	});
});
