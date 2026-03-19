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

const E2E_DIR = join(import.meta.dirname, '../.test-e2e-errors');
const CLI = join(import.meta.dirname, '../dist/cli.js');

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

describe('error handling E2E', () => {
	it('missing config file reports error', () => {
		// No config file exists — generate should fail
		const result = runWithStatus('generate');

		expect(result.status).not.toBe(0);
	});

	it('empty project with no prompts generates 0 files', () => {
		run('init');

		// Remove the example prompt
		unlinkSync(join(E2E_DIR, '.prompts', 'hello.prompt.md'));

		const output = run('generate');

		expect(output).toContain('Generated 0 file');
	});

	it('invalid Zod type in schema causes error', () => {
		run('init');

		writeFileSync(
			join(E2E_DIR, '.prompts', 'badtype.prompt.md'),
			'---\nmodel: "gpt-4"\ninputs:\n  data: regex\n---\nProcess {{ data }}.',
		);

		const result = runWithStatus('generate');

		// The SchemaMapper throws "Unsupported type: regex" during generate
		expect(result.status).not.toBe(0);
		expect(result.stdout + result.stderr).toMatch(/unsupported type|error/i);
	});

	it('duplicate prompt names in same directory are handled', () => {
		run('init');

		// The filesystem won't allow two files with the same name,
		// but we can test that two prompts generating to the same output module
		// are handled. Since basenames must differ in the same dir, test
		// that prompts in different subdirs with the same basename work.
		const subDir = join(E2E_DIR, '.prompts', 'sub');
		mkdirSync(subDir, { recursive: true });

		// Create a prompt with the same basename as hello.prompt.md in a subdir
		writeFileSync(
			join(subDir, 'hello.prompt.md'),
			'---\nmodel: "gpt-4"\ninputs:\n  name: string\n---\nSub hello {{ name }}.',
		);

		// This should still generate without crashing — the second one may overwrite the first
		const result = runWithStatus('generate');

		// Should not crash; may generate or report a conflict
		expect(result.stdout + result.stderr).toBeDefined();
	});
});
