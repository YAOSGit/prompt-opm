import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { PromptFile, SchemaValue } from '../types/index.js';
import { parsePromptFile } from './parser.js';

export type ResolvedPrompt = {
	body: string;
	mergedInputs: Record<string, SchemaValue>;
	warnings: string[];
	resolvedDependencies: string[];
};

const SNIPPET_RE = /\{\{\s*(@\.?[\w/.:-][\w/.:=-]*)\s*\}\}/g;

export function resolveSnippets(
	file: PromptFile,
	sourceRoot: string,
	visited: Set<string> = new Set(),
): ResolvedPrompt {
	const absolutePath = resolve(file.filePath);
	if (visited.has(absolutePath)) {
		const cycle = [...visited, absolutePath].join(' -> ');
		throw new Error(`Circular dependency detected: ${cycle}`);
	}

	visited.add(absolutePath);

	const warnings: string[] = [];
	const mergedInputs: Record<string, SchemaValue> = {
		...(file.frontmatter.inputs ?? {}),
	};
	const resolvedDependencies: string[] = [];
	let body = file.body;

	body = body.replace(SNIPPET_RE, (_match, snippetRef: string) => {
		const snippetPath = resolveSnippetPath(
			snippetRef,
			file.filePath,
			sourceRoot,
		);
		resolvedDependencies.push(snippetPath);

		const content = readFileSync(snippetPath, 'utf-8');
		const snippetFile = parsePromptFile(content, snippetPath);

		if (
			snippetFile.frontmatter.outputs &&
			Object.keys(snippetFile.frontmatter.outputs).length > 0
		) {
			warnings.push(
				`Snippet "${snippetRef}" in ${snippetPath} declares outputs — ignored (only root prompts can define outputs)`,
			);
		}

		const resolved = resolveSnippets(snippetFile, sourceRoot, new Set(visited));
		warnings.push(...resolved.warnings);
		resolvedDependencies.push(...resolved.resolvedDependencies);

		for (const [key, type] of Object.entries(resolved.mergedInputs)) {
			if (mergedInputs[key] && !isEqual(mergedInputs[key], type)) {
				throw new Error(
					`Conflict: variable "${key}" declared as "${JSON.stringify(mergedInputs[key])}" in ${file.filePath} and "${JSON.stringify(type)}" in ${snippetPath}`,
				);
			}
			mergedInputs[key] = type;
		}

		return resolved.body;
	});

	return { body, mergedInputs, warnings, resolvedDependencies };
}

function resolveSnippetPath(
	ref: string,
	importerPath: string,
	sourceRoot: string,
): string {
	const isRelative = ref.startsWith('@.');
	const name = isRelative ? ref.slice(2) : ref.slice(1);
	const fileName = `${name}.prompt.md`;

	const baseDir = isRelative
		? dirname(resolve(importerPath))
		: resolve(sourceRoot);
	const fullPath = join(baseDir, fileName);

	try {
		readFileSync(fullPath);
		return fullPath;
	} catch {
		throw new Error(`Snippet not found: {{ ${ref} }} — looked for ${fullPath}`);
	}
}

function isEqual(a: SchemaValue, b: SchemaValue): boolean {
	if (typeof a === 'string' && typeof b === 'string') {
		return a === b;
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((item, i) => isEqual(item, b[i]));
	}
	if (
		typeof a === 'object' &&
		typeof b === 'object' &&
		a !== null &&
		b !== null &&
		!Array.isArray(a) &&
		!Array.isArray(b)
	) {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		if (keysA.length !== keysB.length) return false;
		return keysA.every((key) => isEqual(a[key], b[key]));
	}
	return false;
}
