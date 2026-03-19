import { describe, expect, it, vi } from 'vitest';

vi.mock('./core/Analyzer/index.js', () => ({
	analyze: vi.fn(() => ({
		prompts: [],
		summary: { totalPrompts: 0, totalTokens: 0 },
		dependencyGraph: {},
		errors: [],
	})),
}));

vi.mock('./core/Emitter/index.js', () => ({
	generateBarrelContent: vi.fn(() => ''),
	generateFileContent: vi.fn(() => ''),
}));

vi.mock('./core/Generate/index.js', () => ({
	generate: vi.fn(() => ({
		generated: 0,
		skipped: 0,
		errors: [],
		warnings: [],
	})),
}));

vi.mock('./core/Parser/index.js', () => ({
	parsePromptFile: vi.fn(() => ({
		filePath: 'test.prompt.md',
		frontmatter: { model: 'test' },
		body: '',
		variables: [],
		snippets: [],
	})),
}));

vi.mock('./core/Scanner/index.js', () => ({
	scanPromptFiles: vi.fn(() => []),
}));

vi.mock('./core/SchemaMapper/index.js', () => ({
	mapSchemaToZodObjectString: vi.fn(() => 'z.object({})'),
	mapTypeToZod: vi.fn(() => 'z.string()'),
}));

vi.mock('./core/SnippetResolver/index.js', () => ({
	resolveSnippets: vi.fn(() => ({
		body: '',
		mergedInputs: {},
		warnings: [],
		resolvedDependencies: [],
	})),
}));

vi.mock('./core/TokenEstimator/index.js', () => ({
	estimateFixedTokens: vi.fn(() => 0),
	estimateTemplateTokens: vi.fn(() => 0),
}));

vi.mock('./core/VersionManager/index.js', () => ({
	bumpVersion: vi.fn(() => '1.0.1'),
	determineVersionBump: vi.fn(() => 'patch'),
}));

vi.mock('./manifest/hasher.js', () => ({
	hashContent: vi.fn(() => 'abc123'),
	hashInputsOutputs: vi.fn(() => 'def456'),
}));

vi.mock('./manifest/manifest.js', () => ({
	loadManifest: vi.fn(() => ({ entries: {} })),
	saveManifest: vi.fn(),
}));

describe('lib re-exports', () => {
	it('exports analyze from Analyzer', async () => {
		const { analyze } = await import('./lib.js');
		expect(analyze).toBeDefined();
		expect(typeof analyze).toBe('function');
	});

	it('exports generateBarrelContent and generateFileContent from Emitter', async () => {
		const { generateBarrelContent, generateFileContent } = await import('./lib.js');
		expect(generateBarrelContent).toBeDefined();
		expect(generateFileContent).toBeDefined();
	});

	it('exports generate from Generate', async () => {
		const { generate } = await import('./lib.js');
		expect(generate).toBeDefined();
		expect(typeof generate).toBe('function');
	});

	it('exports parsePromptFile from Parser', async () => {
		const { parsePromptFile } = await import('./lib.js');
		expect(parsePromptFile).toBeDefined();
		expect(typeof parsePromptFile).toBe('function');
	});

	it('exports scanPromptFiles from Scanner', async () => {
		const { scanPromptFiles } = await import('./lib.js');
		expect(scanPromptFiles).toBeDefined();
		expect(typeof scanPromptFiles).toBe('function');
	});

	it('exports mapSchemaToZodObjectString and mapTypeToZod from SchemaMapper', async () => {
		const { mapSchemaToZodObjectString, mapTypeToZod } = await import('./lib.js');
		expect(mapSchemaToZodObjectString).toBeDefined();
		expect(mapTypeToZod).toBeDefined();
	});

	it('exports resolveSnippets from SnippetResolver', async () => {
		const { resolveSnippets } = await import('./lib.js');
		expect(resolveSnippets).toBeDefined();
		expect(typeof resolveSnippets).toBe('function');
	});

	it('exports estimateFixedTokens and estimateTemplateTokens from TokenEstimator', async () => {
		const { estimateFixedTokens, estimateTemplateTokens } = await import('./lib.js');
		expect(estimateFixedTokens).toBeDefined();
		expect(estimateTemplateTokens).toBeDefined();
	});

	it('exports bumpVersion and determineVersionBump from VersionManager', async () => {
		const { bumpVersion, determineVersionBump } = await import('./lib.js');
		expect(bumpVersion).toBeDefined();
		expect(determineVersionBump).toBeDefined();
	});

	it('exports hashContent and hashInputsOutputs from hasher', async () => {
		const { hashContent, hashInputsOutputs } = await import('./lib.js');
		expect(hashContent).toBeDefined();
		expect(hashInputsOutputs).toBeDefined();
	});

	it('exports loadManifest and saveManifest from manifest', async () => {
		const { loadManifest, saveManifest } = await import('./lib.js');
		expect(loadManifest).toBeDefined();
		expect(saveManifest).toBeDefined();
	});

	it('all exported functions are callable', async () => {
		const lib = await import('./lib.js');

		const functionExports = [
			'analyze',
			'generateBarrelContent',
			'generateFileContent',
			'generate',
			'parsePromptFile',
			'scanPromptFiles',
			'mapSchemaToZodObjectString',
			'mapTypeToZod',
			'resolveSnippets',
			'estimateFixedTokens',
			'estimateTemplateTokens',
			'bumpVersion',
			'determineVersionBump',
			'hashContent',
			'hashInputsOutputs',
			'loadManifest',
			'saveManifest',
		];

		for (const name of functionExports) {
			expect(typeof lib[name as keyof typeof lib]).toBe('function');
		}
	});
});
