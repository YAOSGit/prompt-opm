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

const E2E_DIR = join(import.meta.dirname, '../.test-e2e-snippets');
const CLI = join(import.meta.dirname, '../dist/cli/index.js');

function run(command: string): string {
	return execSync(`node ${CLI} ${command}`, {
		cwd: E2E_DIR,
		encoding: 'utf-8',
	});
}

function runWithStatus(command: string): {
	stdout: string;
	stderr: string;
	status: number;
} {
	try {
		const stdout = execSync(`node ${CLI} ${command}`, {
			cwd: E2E_DIR,
			encoding: 'utf-8',
			stdio: 'pipe',
		});
		return { stdout, stderr: '', status: 0 };
	} catch (err: unknown) {
		return {
			stdout: (err as { stdout?: string }).stdout || '',
			stderr: (err as { stderr?: string }).stderr || '',
			status: (err as { status?: number }).status || 1,
		};
	}
}

beforeEach(() => {
	mkdirSync(E2E_DIR, { recursive: true });
});

afterEach(() => {
	if (existsSync(E2E_DIR)) rmSync(E2E_DIR, { recursive: true });
});

describe('snippets E2E', () => {
	it('@snippet is resolved in generated output', () => {
		run('init');

		// Create a snippet
		writeFileSync(
			join(E2E_DIR, '.prompts', 'persona.prompt.md'),
			'---\nsnippet: true\n---\nYou are a helpful coding assistant.',
		);

		// Create a prompt that uses the snippet
		writeFileSync(
			join(E2E_DIR, '.prompts', 'coder.prompt.md'),
			'---\nmodel: "gpt-4"\ninputs:\n  task: string\n---\n{{ @persona }}\nComplete this task: {{ task }}',
		);

		run('generate');

		const generated = readFileSync(
			join(E2E_DIR, 'src/generated/prompts/coder.ts'),
			'utf-8',
		);

		// Snippet content should be inlined
		expect(generated).toContain('You are a helpful coding assistant.');
		// Variable should be preserved
		expect(generated).toContain('{{ task }}');
	});

	it('nested snippets are resolved transitively', () => {
		run('init');

		// Snippet B: base persona
		writeFileSync(
			join(E2E_DIR, '.prompts', 'base.prompt.md'),
			'---\nsnippet: true\n---\nYou are an AI.',
		);

		// Snippet A: uses snippet B
		writeFileSync(
			join(E2E_DIR, '.prompts', 'extended.prompt.md'),
			'---\nsnippet: true\n---\n{{ @base }}\nYou are also creative.',
		);

		// Prompt uses snippet A
		writeFileSync(
			join(E2E_DIR, '.prompts', 'writer.prompt.md'),
			'---\nmodel: "gpt-4"\ninputs:\n  topic: string\n---\n{{ @extended }}\nWrite about {{ topic }}.',
		);

		run('generate');

		const generated = readFileSync(
			join(E2E_DIR, 'src/generated/prompts/writer.ts'),
			'utf-8',
		);

		// Both snippet contents should be resolved
		expect(generated).toContain('You are an AI.');
		expect(generated).toContain('You are also creative.');
		expect(generated).toContain('{{ topic }}');
	});

	it('circular snippet reference reports error', () => {
		run('init');

		// Snippet A uses snippet B
		writeFileSync(
			join(E2E_DIR, '.prompts', 'alpha.prompt.md'),
			'---\nsnippet: true\n---\n{{ @beta }}\nAlpha content.',
		);

		// Snippet B uses snippet A
		writeFileSync(
			join(E2E_DIR, '.prompts', 'beta.prompt.md'),
			'---\nsnippet: true\n---\n{{ @alpha }}\nBeta content.',
		);

		// Prompt uses snippet A
		writeFileSync(
			join(E2E_DIR, '.prompts', 'loop.prompt.md'),
			'---\nmodel: "gpt-4"\n---\n{{ @alpha }}',
		);

		const result = runWithStatus('generate');

		expect(result.status).not.toBe(0);
		expect(result.stdout + result.stderr).toMatch(/circular/i);
	});

	it('missing snippet reference reports error', () => {
		run('init');

		writeFileSync(
			join(E2E_DIR, '.prompts', 'broken.prompt.md'),
			'---\nmodel: "gpt-4"\n---\n{{ @nonexistent }}\nHello.',
		);

		const result = runWithStatus('generate');

		expect(result.status).not.toBe(0);
		expect(result.stdout + result.stderr).toMatch(
			/snippet not found|nonexistent/i,
		);
	});
});
