export interface ManifestEntry {
	version: string;
	contentHash: string;
	inputsHash: string;
	outputsHash: string;
	dependencies: string[];
	tokenEstimate: number;
	inputTokenEstimate: number;
}

export interface ManifestData {
	generatedAt: string;
	files: Record<string, ManifestEntry>;
}
