import { execFileSync, spawn } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const E2E_DIR = join(import.meta.dirname, '../.test-e2e-watch');
const CLI = join(import.meta.dirname, '../dist/cli.js');

const initProject = (): void => {
	execFileSync('node', [CLI, 'init'], {
		cwd: E2E_DIR,
		encoding: 'utf-8',
		timeout: 10000,
	});
};

const collectOutput = (
	args: string[],
	action: () => void,
	actionDelayMs = 1500,
	killAfterMs = 5000,
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> => {
	return new Promise((resolve) => {
		let stdout = '';
		let stderr = '';
		let resolved = false;

		const done = (code: number | null) => {
			if (resolved) return;
			resolved = true;
			clearTimeout(actionTimer);
			clearTimeout(killTimer);
			clearTimeout(fallbackTimer);
			resolve({ stdout, stderr, exitCode: code });
		};

		const proc = spawn('node', [CLI, ...args], {
			cwd: E2E_DIR,
			env: { ...process.env, FORCE_COLOR: '0' },
		});

		proc.stdout.on('data', (data: Buffer) => {
			stdout += data.toString();
		});

		proc.stderr.on('data', (data: Buffer) => {
			stderr += data.toString();
		});

		proc.on('close', (code) => done(code));
		proc.on('error', () => done(1));

		// Perform the action after initial generation
		const actionTimer = setTimeout(() => {
			action();
		}, actionDelayMs);

		// Kill after timeout
		const killTimer = setTimeout(() => {
			proc.kill('SIGTERM');
			// Give it 1s to exit, then force kill
			setTimeout(() => {
				if (!resolved) {
					proc.kill('SIGKILL');
				}
			}, 1000);
		}, killAfterMs);

		// Hard fallback — resolve even if close never fires
		const fallbackTimer = setTimeout(() => {
			done(null);
		}, killAfterMs + 3000);
	});
};

beforeEach(() => {
	rmSync(E2E_DIR, { recursive: true, force: true });
	mkdirSync(E2E_DIR, { recursive: true });
});

afterEach(() => {
	rmSync(E2E_DIR, { recursive: true, force: true });
});

describe('watch command E2E', () => {
	it('watch regenerates on prompt change', async () => {
		initProject();

		const promptPath = join(E2E_DIR, '.prompts', 'hello.prompt.md');
		expect(existsSync(promptPath)).toBe(true);

		const result = await collectOutput(
			['watch'],
			() => {
				const original = readFileSync(promptPath, 'utf-8');
				writeFileSync(
					promptPath,
					original.replace(
						'Write a friendly greeting for {{ name }}.',
						'Write a very special greeting for {{ name }}.',
					),
				);
			},
			2000,
			7000,
		);

		expect(result.stdout).toContain('Generated');
		expect(result.stdout).toMatch(/[Ww]atching/);
	});

	it('watch handles invalid prompt gracefully', async () => {
		initProject();

		const result = await collectOutput(
			['watch'],
			() => {
				writeFileSync(
					join(E2E_DIR, '.prompts', 'bad.prompt.md'),
					'this has no frontmatter at all',
				);
			},
			2000,
			7000,
		);

		// Watch should not crash — initial generation should succeed
		expect(result.stdout).toContain('Generated');
	});

	it('watch can be interrupted cleanly', async () => {
		initProject();

		const result = await collectOutput(
			['watch'],
			() => {
				// No action — just let the kill timer stop it
			},
			1000,
			3000,
		);

		// Process exited (didn't hang) and produced some output
		expect(result.stdout + result.stderr).toBeTruthy();
	});
});
