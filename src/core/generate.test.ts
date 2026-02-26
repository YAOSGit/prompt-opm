import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { OpmConfig } from '../types/index.js';
import { generate } from './generate.js';

const TEST_SOURCE = join(import.meta.dirname, '../../.test-generate-source');
const TEST_OUTPUT = join(import.meta.dirname, '../../.test-generate-output');

const config: OpmConfig = { source: TEST_SOURCE, output: TEST_OUTPUT };

beforeEach(() => {
	mkdirSync(TEST_SOURCE, { recursive: true });
	mkdirSync(TEST_OUTPUT, { recursive: true });
});

afterEach(() => {
	for (const d of [TEST_SOURCE, TEST_OUTPUT]) {
		if (existsSync(d)) rmSync(d, { recursive: true });
	}
});

describe('generate', () => {
	it('generates a .ts file from a .prompt.md', () => {
		writeFileSync(
			join(TEST_SOURCE, 'hello.prompt.md'),
			'---\nmodel: "test-model"\ninputs:\n  name: string\noutputs:\n  greeting: string\n---\nHello {{ name }}!',
		);

		const result = generate(config);

		expect(result.generated).toBe(1);
		expect(existsSync(join(TEST_OUTPUT, 'hello.ts'))).toBe(true);
	});

	it('generates barrel index.ts', () => {
		writeFileSync(join(TEST_SOURCE, 'a.prompt.md'), '---\nmodel: test\n---\nA');

		generate(config);

		const barrel = readFileSync(join(TEST_OUTPUT, 'index.ts'), 'utf-8');
		expect(barrel).toContain('export * as a from "./a.js"');
	});

	it('writes manifest after generation', () => {
		writeFileSync(join(TEST_SOURCE, 'b.prompt.md'), '---\nmodel: test\n---\nB');

		generate(config);

		expect(existsSync(join(TEST_OUTPUT, '.prompt-opm.manifest.json'))).toBe(
			true,
		);
	});

	it('skips unchanged files on second run', () => {
		writeFileSync(
			join(TEST_SOURCE, 'stable.prompt.md'),
			'---\nmodel: test\nversion: "1.0.0"\n---\nStable',
		);

		const first = generate(config);
		const second = generate(config);

		expect(first.generated).toBe(1);
		expect(second.skipped).toBe(1);
		expect(second.generated).toBe(0);
	});

	it('bumps patch when body changes but inputs same', () => {
		writeFileSync(
			join(TEST_SOURCE, 'bump.prompt.md'),
			'---\nmodel: test\nversion: "1.0.0"\ninputs:\n  x: string\n---\nOld body {{ x }}',
		);
		generate(config);

		writeFileSync(
			join(TEST_SOURCE, 'bump.prompt.md'),
			'---\nmodel: test\nversion: "1.0.0"\ninputs:\n  x: string\n---\nNew body {{ x }}',
		);
		const result = generate(config);

		expect(result.generated).toBe(1);
		const source = readFileSync(join(TEST_SOURCE, 'bump.prompt.md'), 'utf-8');
		expect(source).toContain('version: "1.0.1"');
	});

	it('bumps minor when inputs change', () => {
		writeFileSync(
			join(TEST_SOURCE, 'minor.prompt.md'),
			'---\nmodel: test\nversion: "1.0.0"\ninputs:\n  x: string\n---\nBody {{ x }}',
		);
		generate(config);

		writeFileSync(
			join(TEST_SOURCE, 'minor.prompt.md'),
			'---\nmodel: test\nversion: "1.0.0"\ninputs:\n  x: string\n  y: number\n---\nBody {{ x }} {{ y }}',
		);
		const result = generate(config);

		expect(result.generated).toBe(1);
		const source = readFileSync(join(TEST_SOURCE, 'minor.prompt.md'), 'utf-8');
		expect(source).toContain('version: "1.1.0"');
	});

	it('does not emit files marked as snippet: true', () => {
		writeFileSync(
			join(TEST_SOURCE, 'shared.prompt.md'),
			'---\nmodel: test\nsnippet: true\n---\nShared content.',
		);
		writeFileSync(
			join(TEST_SOURCE, 'main.prompt.md'),
			'---\nmodel: test\n---\n{{ @shared }}\nMain body.',
		);

		const result = generate(config);

		expect(result.generated).toBe(1);
		expect(existsSync(join(TEST_OUTPUT, 'main.ts'))).toBe(true);
		expect(existsSync(join(TEST_OUTPUT, 'shared.ts'))).toBe(false);

		const barrel = readFileSync(join(TEST_OUTPUT, 'index.ts'), 'utf-8');
		expect(barrel).not.toContain('shared');
		expect(barrel).toContain('main');
	});

	it('uses custom manifest directory when configured', () => {
		const manifestDir = join(import.meta.dirname, '../../.test-manifest-custom');
		mkdirSync(manifestDir, { recursive: true });

		writeFileSync(
			join(TEST_SOURCE, 'test.prompt.md'),
			'---\nmodel: test\n---\nTest',
		);

		const customConfig: OpmConfig = { ...config, manifest: manifestDir };
		generate(customConfig);

		expect(existsSync(join(manifestDir, '.prompt-opm.manifest.json'))).toBe(true);
		expect(existsSync(join(TEST_OUTPUT, '.prompt-opm.manifest.json'))).toBe(false);

		rmSync(manifestDir, { recursive: true });
	});

	it('includes tokenEstimate and inputTokenEstimate in generated meta', () => {
		writeFileSync(
			join(TEST_SOURCE, 'tokens.prompt.md'),
			'---\nmodel: "test-model"\ninputs:\n  name: string\n---\nHello {{ name }}, welcome to our platform!',
		);

		generate(config);

		const output = readFileSync(join(TEST_OUTPUT, 'tokens.ts'), 'utf-8');
		expect(output).toContain('tokenEstimate:');
		expect(output).toContain('inputTokenEstimate:');

		// tokenEstimate should be a positive integer
		const tokenMatch = output.match(/tokenEstimate:\s*(\d+)/);
		expect(tokenMatch).not.toBeNull();
		expect(Number(tokenMatch![1])).toBeGreaterThan(0);

		// inputTokenEstimate should be <= tokenEstimate
		const inputTokenMatch = output.match(/inputTokenEstimate:\s*(\d+)/);
		expect(inputTokenMatch).not.toBeNull();
		expect(Number(inputTokenMatch![1])).toBeLessThanOrEqual(Number(tokenMatch![1]));
	});

	it('stores token estimates in manifest', () => {
		writeFileSync(
			join(TEST_SOURCE, 'manifest-tokens.prompt.md'),
			'---\nmodel: "test-model"\nversion: "1.0.0"\n---\nA simple prompt with some text.',
		);

		generate(config);

		const manifestPath = join(TEST_OUTPUT, '.prompt-opm.manifest.json');
		const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
		const entry = manifest.files['manifest-tokens.prompt.md'];
		expect(entry.tokenEstimate).toBeGreaterThan(0);
		expect(entry.inputTokenEstimate).toBeGreaterThan(0);
	});

	it('collects errors across files but continues', () => {
		writeFileSync(
			join(TEST_SOURCE, 'good.prompt.md'),
			'---\nmodel: test\n---\nGood',
		);
		writeFileSync(join(TEST_SOURCE, 'bad.prompt.md'), 'no frontmatter at all');

		const result = generate(config);

		expect(result.generated).toBe(1);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0].filePath).toContain('bad.prompt.md');
	});
});
