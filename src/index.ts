// Core pipeline

export { analyze } from './core/Analyzer/index.js';
export type { EmitInput } from './core/Emitter/index.js';
export {
	generateBarrelContent,
	generateFileContent,
} from './core/Emitter/index.js';
export type { GenerateResult } from './core/Generate/index.js';
export { generate } from './core/Generate/index.js';
export { parsePromptFile } from './core/Parser/index.js';
export { scanPromptFiles } from './core/Scanner/index.js';
export {
	mapSchemaToZodObjectString,
	mapTypeToZod,
} from './core/SchemaMapper/index.js';
export type { ResolvedPrompt } from './core/SnippetResolver/index.js';
export { resolveSnippets } from './core/SnippetResolver/index.js';
export {
	estimateFixedTokens,
	estimateTemplateTokens,
} from './core/TokenEstimator/index.js';
export type { BumpType } from './core/VersionManager/index.js';
export {
	bumpVersion,
	determineVersionBump,
} from './core/VersionManager/index.js';
export { hashContent, hashInputsOutputs } from './manifest/hasher.js';
// Manifest
export { loadManifest, saveManifest } from './manifest/manifest.js';

// Types
export type {
	AnalyzeResult,
	Config,
	DependencyGraph,
	DependencyNode,
	DiagnosticError,
	FrontMatter,
	ManifestData,
	ManifestEntry,
	OpmConfig,
	PromptAnalysis,
	PromptFile,
} from './types/index.js';
