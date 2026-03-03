export interface Config extends Record<string, unknown> {
	temperature?: number;
	topK?: number;
	topP?: number;
	maxTokens?: number;
}
