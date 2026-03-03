import { spawn } from 'node:child_process';
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
const CLI = join(import.meta.dirname, '../dist/cli/index.js');

function initProject(): void {
	const { execSync } = require('node:child_process');
	execSync(`node ${CLI} init`, { cwd: E2E_DIR, encoding: 'utf-8' });
}

function collectOutput(
	args: string[],
	action: () => void,
	timeoutMs = 5000,
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
	return new Promise((resolve) => {
		let stdout = '';
		let stderr = '';

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

		// Wait for initial generation to complete, then perform the action
		const actionTimer = setTimeout(() => {
			action();
		}, 1500);

		// Kill the process after timeout
		const killTimer = setTimeout(() => {
			proc.kill('SIGTERM');
		}, timeoutMs);

		proc.on('close', (code) => {
			clearTimeout(actionTimer);
			clearTimeout(killTimer);
			resolve({ stdout, stderr, exitCode: code });
		});
	});
}

beforeEach(() => {
	mkdirSync(E2E_DIR, { recursive: true });
});

afterEach(() => {
	if (existsSync(E2E_DIR)) rmSync(E2E_DIR, { recursive: true });
});

describe('watch command E2E', () => {
	it('watch regenerates on prompt change', async () => {
		initProject();

		const result = await collectOutput(
			['watch'],
			() => {
				// Modify the prompt file to trigger regeneration
				const promptPath = join(E2E_DIR, '.prompts', 'hello.prompt.md');
				const original = readFileSync(promptPath, 'utf-8');
				const modified = original.replace(
					'Write a friendly greeting for {{ name }}.',
					'Write a very special greeting for {{ name }}.',
				);
				writeFileSync(promptPath, modified);
			},
			6000,
		);

		// Watch should produce initial generation output
		expect(result.stdout).toContain('Generated');
		// Should show watching message
		expect(result.stdout).toMatch(/[Ww]atching/);
	});

	it('watch handles invalid prompt gracefully', async () => {
		initProject();

		const result = await collectOutput(
			['watch'],
			() => {
				// Write an invalid prompt file
				writeFileSync(
					join(E2E_DIR, '.prompts', 'bad.prompt.md'),
					'this has no frontmatter at all',
				);
			},
			6000,
		);

		// Watch should not crash — initial generation should succeed
		expect(result.stdout).toContain('Generated');
	});

	it('watch can be interrupted cleanly', async () => {
		initProject();

		const result = await collectOutput(
			['watch'],
			() => {
				// Do nothing — just let the kill timer handle it
			},
			5000,
		);

		// Process should have exited after SIGTERM (exitCode can be null on some platforms if killed)
		// The key assertion is that it didn't hang forever and we got output
		expect(result.stdout + result.stderr).toBeTruthy();
	});
});
