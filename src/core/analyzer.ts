import { readFileSync } from 'node:fs';
import { basename, relative } from 'node:path';
import type {
	AnalyzeResult,
	DiagnosticError,
	OpmConfig,
	PromptAnalysis,
} from '../types/index.js';
import { parsePromptFile } from './parser.js';
import { scanPromptFiles } from './scanner.js';
import { resolveSnippets } from './snippet-resolver.js';
import {
	estimateFixedTokens,
	estimateTemplateTokens,
} from './token-estimator.js';

export function analyze(config: OpmConfig): AnalyzeResult {
	const { source } = config;
	const filePaths = scanPromptFiles(source);
	const prompts: PromptAnalysis[] = [];
	const dependencyGraph: Record<string, string[]> = {};
	const errors: DiagnosticError[] = [];

	for (const filePath of filePaths) {
		try {
			const content = readFileSync(filePath, 'utf-8');
			const parsed = parsePromptFile(content, filePath);

			if (parsed.frontmatter.snippet) continue;

			const resolved = resolveSnippets(parsed, source);
			const relPath = relative(source, filePath);
			const moduleName = basename(relPath, '.prompt.md');

			const tokenEstimate = estimateTemplateTokens(resolved.body);
			const inputTokenEstimate = estimateFixedTokens(resolved.body);

			const dependencies = resolved.resolvedDependencies.map((dep) =>
				relative(source, dep),
			);

			prompts.push({
				file: relPath,
				model: parsed.frontmatter.model,
				version: parsed.frontmatter.version ?? '0.1.0',
				tokenEstimate,
				inputTokenEstimate,
				variables: parsed.variables,
				snippets: parsed.snippets,
				dependencies,
			});

			dependencyGraph[moduleName] = dependencies;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			let errorType: DiagnosticError['type'] = 'parse';
			if (message.includes('Circular dependency')) {
				errorType = 'circular';
			} else if (message.includes('Snippet')) {
				errorType = 'snippet';
			} else if (message.includes('Conflict')) {
				errorType = 'conflict';
			} else if (message.includes('Unsupported type')) {
				errorType = 'schema';
			}
			errors.push({ filePath, message, type: errorType });
		}
	}

	const totalTokens = prompts.reduce((sum, p) => sum + p.tokenEstimate, 0);

	return {
		prompts,
		summary: {
			totalPrompts: prompts.length,
			totalTokens,
		},
		dependencyGraph,
		errors,
	};
}
