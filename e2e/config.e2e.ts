import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const E2E_DIR = join(import.meta.dirname, '../.test-e2e-config');
const CLI = join(import.meta.dirname, '../dist/cli.js');

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

describe('config E2E', () => {
	it('custom config paths are respected', () => {
		// Create custom source and output directories
		const customSource = join(E2E_DIR, 'my-prompts');
		const customOutput = join(E2E_DIR, 'dist/prompts');
		mkdirSync(customSource, { recursive: true });

		// Write config with custom paths
		writeFileSync(
			join(E2E_DIR, '.prompt-opm.config.json'),
			JSON.stringify(
				{ source: './my-prompts', output: './dist/prompts' },
				null,
				2,
			),
		);

		// Write a prompt in the custom source directory
		writeFileSync(
			join(customSource, 'greet.prompt.md'),
			'---\nmodel: "gpt-4"\ninputs:\n  name: string\n---\nHello {{ name }}.',
		);

		run('generate');

		// Output should be in the custom output directory
		expect(existsSync(join(customOutput, 'greet.ts'))).toBe(true);
		expect(existsSync(join(customOutput, 'index.ts'))).toBe(true);
	});

	it('default paths work via init', () => {
		run('init');
		run('generate');

		// Default source is .prompts/, default output is src/generated/prompts/
		expect(existsSync(join(E2E_DIR, '.prompts', 'hello.prompt.md'))).toBe(true);
		expect(existsSync(join(E2E_DIR, 'src/generated/prompts/hello.ts'))).toBe(
			true,
		);
		expect(existsSync(join(E2E_DIR, 'src/generated/prompts/index.ts'))).toBe(
			true,
		);
	});

	it('invalid config format reports error', () => {
		// Write invalid JSON to config
		writeFileSync(
			join(E2E_DIR, '.prompt-opm.config.json'),
			'{ this is not valid json !!!',
		);

		const result = runWithStatus('generate');

		expect(result.status).not.toBe(0);
	});
});
