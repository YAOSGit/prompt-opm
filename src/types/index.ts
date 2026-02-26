export type Config = {
	temperature?: number;
	topK?: number;
	topP?: number;
	maxTokens?: number;
} & Record<string, unknown>;

export type FrontMatter = {
	model: string;
	version?: string;
	snippet?: boolean;
	config?: Config;
	inputs?: Record<string, any>;
	outputs?: Record<string, any>;
};

export type PromptFile = {
	filePath: string;
	frontmatter: FrontMatter;
	body: string;
	variables: string[];
	snippets: string[];
};

export type DependencyNode = {
	filePath: string;
	dependsOn: string[];
	dependedBy: string[];
	contentHash: string;
};

export type DependencyGraph = Map<string, DependencyNode>;

export type ManifestEntry = {
	version: string;
	contentHash: string;
	inputsHash: string;
	outputsHash: string;
	dependencies: string[];
	tokenEstimate: number;
	inputTokenEstimate: number;
};

export type ManifestData = {
	generatedAt: string;
	files: Record<string, ManifestEntry>;
};

export type OpmConfig = {
	source: string;
	output: string;
	manifest?: string;
};

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
};
