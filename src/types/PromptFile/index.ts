import type { FrontMatter } from '../FrontMatter/index.js';

export type PromptFile = {
	filePath: string;
	frontmatter: FrontMatter;
	body: string;
	variables: string[];
	snippets: string[];
};
