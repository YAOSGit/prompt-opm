import { readFileSync } from 'node:fs';
import { basename, relative } from 'node:path';
import { formatError } from '@yaos-git/toolkit/cli';
import type {
	AnalyzeResult,
	DiagnosticError,
	OpmConfig,
	PromptAnalysis,
} from '../../types/index.js';
import { parsePromptFile } from '../Parser/index.js';
import { classifyDiagnosticError } from '../patterns.js';
import { scanPromptFiles } from '../Scanner/index.js';
import { resolveSnippets } from '../SnippetResolver/index.js';
import {
	estimateFixedTokens,
	estimateTemplateTokens,
} from '../TokenEstimator/index.js';

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
			const message = formatError(err);
			errors.push({
				filePath,
				message,
				type: classifyDiagnosticError(message),
			});
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
