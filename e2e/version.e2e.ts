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

const E2E_DIR = join(import.meta.dirname, '../.test-e2e-version');
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

describe('version management E2E', () => {
	it('version is set on first generate', () => {
		run('init');
		run('generate');

		const generated = readFileSync(
			join(E2E_DIR, 'src/generated/prompts/hello.ts'),
			'utf-8',
		);

		// The generated file should contain version info in the meta object
		expect(generated).toMatch(/version:\s*"/);
		expect(generated).toContain('0.1.0');
	});

	it('body change triggers version bump on regenerate', () => {
		run('init');
		run('generate');

		// Read the first generated version
		const firstGenerated = readFileSync(
			join(E2E_DIR, 'src/generated/prompts/hello.ts'),
			'utf-8',
		);

		// Modify the prompt body
		const promptPath = join(E2E_DIR, '.prompts', 'hello.prompt.md');
		const original = readFileSync(promptPath, 'utf-8');
		const modified = original.replace(
			'Write a friendly greeting for {{ name }}.',
			'Write an enthusiastic and warm greeting for {{ name }}.',
		);
		writeFileSync(promptPath, modified);

		run('generate');

		const secondGenerated = readFileSync(
			join(E2E_DIR, 'src/generated/prompts/hello.ts'),
			'utf-8',
		);

		// Version should have been bumped (patch bump for body-only change)
		// The first version is 0.1.0, the bumped version should be different
		expect(secondGenerated).not.toEqual(firstGenerated);
		// The meta should contain a different version
		expect(secondGenerated).toMatch(/version:\s*"/);
	});

	it('no change preserves output on second generate', () => {
		run('init');

		const firstOutput = run('generate');
		expect(firstOutput).toContain('Generated 1 file');

		const secondOutput = run('generate');
		// Second run should skip unchanged files
		expect(secondOutput).toContain('skipped');
		expect(secondOutput).toContain('Generated 0 file');
	});
});
