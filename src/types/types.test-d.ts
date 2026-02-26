import { describe, expectTypeOf, it } from 'vitest';
import type {
	Config,
	DependencyNode,
	DiagnosticError,
	FrontMatter,
	ManifestEntry,
	OpmConfig,
	PromptFile,
} from './index.js';

describe('Shared Types', () => {
	it('PromptFile has required fields', () => {
		expectTypeOf<PromptFile>().toHaveProperty('filePath');
		expectTypeOf<PromptFile>().toHaveProperty('frontmatter');
		expectTypeOf<PromptFile>().toHaveProperty('body');
		expectTypeOf<PromptFile>().toHaveProperty('variables');
		expectTypeOf<PromptFile>().toHaveProperty('snippets');
	});

	it('FrontMatter model is required, rest optional', () => {
		expectTypeOf<FrontMatter>().toHaveProperty('model');
		expectTypeOf<FrontMatter['version']>().toEqualTypeOf<string | undefined>();
		expectTypeOf<FrontMatter['config']>().toEqualTypeOf<Config | undefined>();
	});

	it('Config has known optional fields and allows extras', () => {
		const config: Config = { temperature: 0.7, customField: 'ok' };
		expectTypeOf(config).toMatchTypeOf<Config>();
	});

	it('DependencyNode has bidirectional edges', () => {
		expectTypeOf<DependencyNode>().toHaveProperty('dependsOn');
		expectTypeOf<DependencyNode>().toHaveProperty('dependedBy');
		expectTypeOf<DependencyNode>().toHaveProperty('contentHash');
	});

	it('ManifestEntry has version and hashes', () => {
		expectTypeOf<ManifestEntry>().toHaveProperty('version');
		expectTypeOf<ManifestEntry>().toHaveProperty('contentHash');
		expectTypeOf<ManifestEntry>().toHaveProperty('inputsHash');
		expectTypeOf<ManifestEntry>().toHaveProperty('outputsHash');
		expectTypeOf<ManifestEntry>().toHaveProperty('dependencies');
	});

	it('OpmConfig has source and output', () => {
		expectTypeOf<OpmConfig>().toHaveProperty('source');
		expectTypeOf<OpmConfig>().toHaveProperty('output');
	});

	it('DiagnosticError has file, message, and type', () => {
		expectTypeOf<DiagnosticError>().toHaveProperty('filePath');
		expectTypeOf<DiagnosticError>().toHaveProperty('message');
		expectTypeOf<DiagnosticError>().toHaveProperty('type');
	});
});
