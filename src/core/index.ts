export { analyze } from './Analyzer/index.js';
export { generateFileContent, generateBarrelContent } from './Emitter/index.js';
export type { GenerateResult } from './Generate/index.js';
export { generate } from './Generate/index.js';
export { parsePromptFile } from './Parser/index.js';
export { scanPromptFiles } from './Scanner/index.js';
export { mapTypeToZod, mapSchemaToZodObjectString } from './SchemaMapper/index.js';
export type { ResolvedPrompt } from './SnippetResolver/index.js';
export { resolveSnippets } from './SnippetResolver/index.js';
export { estimateTemplateTokens, estimateFixedTokens } from './TokenEstimator/index.js';
export type { BumpType } from './VersionManager/index.js';
export { bumpVersion, determineVersionBump } from './VersionManager/index.js';
export {
	SNIPPET_RE,
	VARIABLE_RE,
	VARIABLE_RE_SIMPLE,
	classifyDiagnosticError,
} from './patterns.js';
