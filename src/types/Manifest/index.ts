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
