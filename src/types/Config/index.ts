export type Config = Record<string, unknown> & {
	temperature?: number;
	topK?: number;
	topP?: number;
	maxTokens?: number;
};
