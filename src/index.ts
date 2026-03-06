// Core pipeline

export { analyze } from './core/Analyzer/index.js';
export {
	generateBarrelContent,
	generateFileContent,
} from './core/Emitter/index.js';
export { generate } from './core/Generate/index.js';
export { parsePromptFile } from './core/Parser/index.js';
export { scanPromptFiles } from './core/Scanner/index.js';
export {
	mapSchemaToZodObjectString,
	mapTypeToZod,
} from './core/SchemaMapper/index.js';
export { resolveSnippets } from './core/SnippetResolver/index.js';
export {
	estimateFixedTokens,
	estimateTemplateTokens,
} from './core/TokenEstimator/index.js';
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
	BumpType,
	Config,
	DependencyGraph,
	DependencyNode,
	DiagnosticError,
	EmitInput,
	FrontMatter,
	GenerateResult,
	ManifestData,
	ManifestEntry,
	OpmConfig,
	PromptAnalysis,
	PromptFile,
	ResolvedPrompt,
} from './types/index.js';
