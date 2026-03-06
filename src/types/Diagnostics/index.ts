export type DiagnosticError = {
	filePath: string;
	message: string;
	type: 'parse' | 'snippet' | 'schema' | 'conflict' | 'circular';
};

export type PromptAnalysis = {
	file: string;
	model: string;
	version: string;
	tokenEstimate: number;
	inputTokenEstimate: number;
	variables: string[];
	snippets: string[];
	dependencies: string[];
};

export type AnalyzeResult = {
	prompts: PromptAnalysis[];
	summary: { totalPrompts: number; totalTokens: number };
	dependencyGraph: Record<string, string[]>;
	errors: DiagnosticError[];
};
