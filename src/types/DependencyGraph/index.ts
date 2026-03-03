export interface DependencyNode {
	filePath: string;
	dependsOn: string[];
	dependedBy: string[];
	contentHash: string;
}

export type DependencyGraph = Map<string, DependencyNode>;
