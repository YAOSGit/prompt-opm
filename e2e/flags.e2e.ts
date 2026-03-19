import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const CLI = path.resolve(import.meta.dirname, '../dist/cli.js');

function run(args: string[]): { stdout: string; stderr: string; exitCode: number } {
	try {
		const stdout = execFileSync('node', [CLI, ...args], {
			encoding: 'utf-8',
			timeout: 10_000,
		});
		return { stdout, stderr: '', exitCode: 0 };
	} catch (err: unknown) {
		const e = err as { stdout?: string; stderr?: string; status?: number };
		return {
			stdout: e.stdout ?? '',
			stderr: e.stderr ?? '',
			exitCode: e.status ?? 1,
		};
	}
}

describe('prompt-opm CLI flags', () => {
	it('--help shows usage with "prompt-opm" and lists subcommands', () => {
		const { stdout, exitCode } = run(['--help']);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('prompt-opm');
		expect(stdout).toContain('init');
		expect(stdout).toContain('generate');
		expect(stdout).toContain('watch');
		expect(stdout).toContain('validate');
		expect(stdout).toContain('diff');
		expect(stdout).toContain('analyze');
		expect(stdout).toContain('schema');
	});

	it('--version shows version string', () => {
		const { stdout, exitCode } = run(['--version']);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('prompt-opm/');
	});

	it('init --help shows init description', () => {
		const { stdout, exitCode } = run(['init', '--help']);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('init');
		expect(stdout).toContain('Scaffold');
	});

	it('generate --help shows generate description', () => {
		const { stdout, exitCode } = run(['generate', '--help']);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('generate');
		expect(stdout).toContain('Compile');
	});

	it('watch --help shows watch description', () => {
		const { stdout, exitCode } = run(['watch', '--help']);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('watch');
		expect(stdout).toContain('Watch');
	});

	it('validate --help shows validate description', () => {
		const { stdout, exitCode } = run(['validate', '--help']);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('validate');
		expect(stdout).toContain('Check');
	});

	it('diff --help shows diff description', () => {
		const { stdout, exitCode } = run(['diff', '--help']);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('diff');
		expect(stdout).toContain('Preview');
	});

	it('analyze --help shows analyze options', () => {
		const { stdout, exitCode } = run(['analyze', '--help']);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('analyze');
		expect(stdout).toContain('--json');
	});

	it('schema --help shows schema options', () => {
		const { stdout, exitCode } = run(['schema', '--help']);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('schema');
		expect(stdout).toContain('--format');
	});
});
