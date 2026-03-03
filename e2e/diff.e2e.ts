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

const E2E_DIR = join(import.meta.dirname, '../.test-e2e-diff');
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

describe('diff command E2E', () => {
	it('shows new files before first generate', () => {
		run('init');
		const output = run('diff');

		expect(output).toContain('hello.ts');
		expect(output).toContain('new');
	});

	it('shows no changes after generate', () => {
		run('init');
		run('generate');
		const output = run('diff');

		expect(output).toContain('No changes');
	});

	it('detects body change after generate', () => {
		run('init');
		run('generate');

		// Modify the prompt body
		const promptPath = join(E2E_DIR, '.prompts', 'hello.prompt.md');
		const original = readFileSync(promptPath, 'utf-8');
		const modified = original.replace(
			'Write a friendly greeting for {{ name }}.',
			'Write a very warm and enthusiastic greeting for {{ name }}.',
		);
		writeFileSync(promptPath, modified);

		const output = run('diff');

		expect(output).toContain('hello.ts');
		expect(output).toContain('bump');
	});

	it('detects schema change after generate', () => {
		run('init');
		run('generate');

		// Add an input field to the prompt
		const promptPath = join(E2E_DIR, '.prompts', 'hello.prompt.md');
		const original = readFileSync(promptPath, 'utf-8');
		const modified = original.replace(
			'inputs:\n  name: string',
			'inputs:\n  name: string\n  language: string',
		);
		const modifiedBody = modified.replace(
			'Write a friendly greeting for {{ name }}.',
			'Write a friendly greeting for {{ name }} in {{ language }}.',
		);
		writeFileSync(promptPath, modifiedBody);

		const output = run('diff');

		expect(output).toContain('hello.ts');
		expect(output).toContain('bump');
	});
});
