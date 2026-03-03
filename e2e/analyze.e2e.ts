import { execSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	rmSync,
	unlinkSync,
	writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const E2E_DIR = join(import.meta.dirname, '../.test-e2e-analyze');
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

describe('analyze command E2E', () => {
	it('table format output contains prompt name and model', () => {
		run('init');
		const output = run('analyze');

		expect(output).toContain('hello');
		expect(output).toContain('gemini-1.5-pro');
	});

	it('--json flag returns valid JSON output', () => {
		run('init');
		const output = run('analyze --json');

		const parsed = JSON.parse(output);
		expect(parsed).toHaveProperty('prompts');
		expect(Array.isArray(parsed.prompts)).toBe(true);
		expect(parsed.prompts.length).toBeGreaterThan(0);
		expect(parsed.prompts[0]).toHaveProperty('model');
	});

	it('token estimates are present in output', () => {
		run('init');
		const output = run('analyze --json');

		const parsed = JSON.parse(output);
		const prompt = parsed.prompts[0];
		expect(prompt).toHaveProperty('tokenEstimate');
		expect(typeof prompt.tokenEstimate).toBe('number');
		expect(prompt.tokenEstimate).toBeGreaterThan(0);
	});

	it('snippet dependencies shown in analysis', () => {
		run('init');

		// Create a snippet
		writeFileSync(
			join(E2E_DIR, '.prompts', 'persona.prompt.md'),
			'---\nsnippet: true\n---\nYou are a helpful assistant.',
		);

		// Create a prompt that uses the snippet
		writeFileSync(
			join(E2E_DIR, '.prompts', 'chat.prompt.md'),
			'---\nmodel: "gpt-4"\ninputs:\n  question: string\n---\n{{ @persona }}\nAnswer: {{ question }}',
		);

		const output = run('analyze --json');
		const parsed = JSON.parse(output);

		// Find the chat prompt
		const chatPrompt = parsed.prompts.find((p: { file?: string }) =>
			p?.file?.includes('chat'),
		);
		expect(chatPrompt).toBeDefined();
		expect(chatPrompt.snippets.length).toBeGreaterThan(0);
	});

	it('empty project shows graceful output', () => {
		run('init');

		// Remove all prompt files
		unlinkSync(join(E2E_DIR, '.prompts', 'hello.prompt.md'));

		const output = run('analyze');

		expect(output).toContain('No prompts found');
	});
});
