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

const E2E_DIR = join(import.meta.dirname, '../.test-e2e-project');
const CLI = join(import.meta.dirname, '../dist/cli/index.js');

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

describe('prompt-opm E2E', () => {
	it('init creates scaffolding', () => {
		run('init');

		expect(existsSync(join(E2E_DIR, '.prompts'))).toBe(true);
		expect(existsSync(join(E2E_DIR, '.prompt-opm.config.json'))).toBe(true);
		expect(existsSync(join(E2E_DIR, '.prompts', 'hello.prompt.md'))).toBe(true);
	});

	it('generate produces TypeScript files from init scaffold', () => {
		run('init');
		const output = run('generate');

		expect(output).toContain('Generated 1 file');
		expect(existsSync(join(E2E_DIR, 'src/generated/prompts/hello.ts'))).toBe(
			true,
		);
		expect(existsSync(join(E2E_DIR, 'src/generated/prompts/index.ts'))).toBe(
			true,
		);
	});

	it('validate reports clean on valid prompts', () => {
		run('init');
		const output = run('validate');

		expect(output).toContain('no errors');
	});

	it('diff shows new files before first generate', () => {
		run('init');
		const output = run('diff');

		expect(output).toContain('hello.ts');
		expect(output).toContain('new');
	});

	it('diff shows no changes after generate', () => {
		run('init');
		run('generate');
		const output = run('diff');

		expect(output).toContain('No changes');
	});

	it('full workflow with snippets', () => {
		run('init');

		// Create a snippet
		writeFileSync(
			join(E2E_DIR, '.prompts', 'persona.prompt.md'),
			'---\nmodel: test\n---\nYou are a helpful assistant.',
		);

		// Create a prompt that uses the snippet
		writeFileSync(
			join(E2E_DIR, '.prompts', 'greet.prompt.md'),
			'---\nmodel: "gemini-1.5-pro"\nversion: "1.0.0"\ninputs:\n  name: string\noutputs:\n  greeting: string\n---\n{{ @persona }}\nGreet {{ name }} warmly.',
		);

		run('generate');

		const generated = readFileSync(
			join(E2E_DIR, 'src/generated/prompts/greet.ts'),
			'utf-8',
		);

		// Snippet should be resolved
		expect(generated).toContain('You are a helpful assistant.');
		// Variable should still be template
		expect(generated).toContain('{{ name }}');
		// Should have zod schema
		expect(generated).toContain('z.string()');
	});
});
