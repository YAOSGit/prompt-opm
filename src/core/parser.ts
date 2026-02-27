import { parse as parseYaml } from 'yaml';
import type { FrontMatter, PromptFile } from '../types/index.js';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
const VARIABLE_RE = /\{\{\s*([a-zA-Z_]\w*)(?:\s*\|\s*"([^"]*)")?\s*\}\}/g;
const SNIPPET_RE = /\{\{\s*(@\.?[\w/.:-][\w/.:=-]*)\s*\}\}/g;

export function parsePromptFile(content: string, filePath: string): PromptFile {
	const match = content.match(FRONTMATTER_RE);
	if (!match) {
		throw new Error(`[${filePath}] Invalid prompt file: missing frontmatter`);
	}

	const [, yamlStr, body] = match;
	const raw = parseYaml(yamlStr) as Record<string, unknown>;

	const isSnippet = raw.snippet === true;

	if (!isSnippet && (!raw.model || typeof raw.model !== 'string')) {
		throw new Error(`[${filePath}] Missing required field: model`);
	}

	const frontmatter: FrontMatter = {
		model: typeof raw.model === 'string' ? raw.model : '',
		version: typeof raw.version === 'string' ? raw.version : undefined,
		snippet: isSnippet ? true : undefined,
		config: raw.config as FrontMatter['config'],
		inputs: raw.inputs as Record<string, string> | undefined,
		outputs: raw.outputs as Record<string, string> | undefined,
	};

	const variables: string[] = [];
	for (const m of body.matchAll(VARIABLE_RE)) {
		if (!m[1].startsWith('@') && !variables.includes(m[1])) {
			variables.push(m[1]);
		}
	}

	const snippets: string[] = [];
	for (const m of body.matchAll(SNIPPET_RE)) {
		if (!snippets.includes(m[1])) {
			snippets.push(m[1]);
		}
	}

	return {
		filePath,
		frontmatter,
		body: body.trim(),
		variables,
		snippets,
	};
}
