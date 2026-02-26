// Core pipeline

export { analyze } from './core/analyzer.js';
export type { EmitInput } from './core/emitter.js';
export { generateBarrelContent, generateFileContent } from './core/emitter.js';
export type { GenerateResult } from './core/generate.js';
export { generate } from './core/generate.js';
export { parsePromptFile } from './core/parser.js';
export { scanPromptFiles } from './core/scanner.js';
export {
	mapSchemaToZodObjectString,
	mapTypeToZod,
} from './core/schema-mapper.js';
export type { ResolvedPrompt } from './core/snippet-resolver.js';
export { resolveSnippets } from './core/snippet-resolver.js';
export {
	estimateFixedTokens,
	estimateTemplateTokens,
} from './core/token-estimator.js';
export type { BumpType } from './core/version-manager.js';
export { bumpVersion, determineVersionBump } from './core/version-manager.js';
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
