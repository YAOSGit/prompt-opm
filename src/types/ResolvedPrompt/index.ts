import type { SchemaValue } from '../FrontMatter/index.js';

export type ResolvedPrompt = {
	body: string;
	mergedInputs: Record<string, SchemaValue>;
	warnings: string[];
	resolvedDependencies: string[];
};
