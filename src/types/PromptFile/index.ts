import type { FrontMatter } from '../FrontMatter/index.js';

export interface PromptFile {
	filePath: string;
	frontmatter: FrontMatter;
	body: string;
	variables: string[];
	snippets: string[];
}
