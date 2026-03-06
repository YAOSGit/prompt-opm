import type { SchemaValue } from '../FrontMatter/index.js';

export type EmitInput = {
	model: string;
	configs: Record<string, unknown>;
	meta: {
		version: string;
		lastUpdated: string;
		sourceFile: string;
		contentHash: string;
		tokenEstimate: number;
		inputTokenEstimate: number;
	};
	inputs: Record<string, SchemaValue>;
	outputs: Record<string, SchemaValue>;
	template: string;
};
