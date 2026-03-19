import { z } from 'zod';
import { parseFrontmatter } from '@yaos-git/toolkit/cli/frontmatter';
import type { FrontMatter, PromptFile } from '../../types/index.js';
import { SNIPPET_RE, VARIABLE_RE } from '../patterns.js';

const SchemaValueSchema: z.ZodType<
	string | { [key: string]: unknown } | unknown[]
> = z.lazy(() =>
	z.union([
		z.string(),
		z.record(z.string(), SchemaValueSchema),
		z.array(SchemaValueSchema),
	]),
);

const FrontMatterSchema = z
	.object({
		model: z.string().optional().default(''),
		version: z.string().optional(),
		snippet: z.boolean().optional(),
		config: z.record(z.string(), z.unknown()).optional(),
		inputs: z.record(z.string(), SchemaValueSchema).optional(),
		outputs: z.record(z.string(), SchemaValueSchema).optional(),
	})
	.refine(
		(data) =>
			data.snippet === true ||
			(typeof data.model === 'string' && data.model.length > 0),
		{ message: 'Missing required field: model', path: ['model'] },
	);

export function parsePromptFile(content: string, filePath: string): PromptFile {
	let parsed: { frontmatter: z.infer<typeof FrontMatterSchema>; body: string };
	try {
		parsed = parseFrontmatter(content, FrontMatterSchema);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		throw new Error(`[${filePath}] Invalid prompt file: ${msg}`);
	}

	const { frontmatter: raw, body } = parsed;

	const frontmatter: FrontMatter = {
		model: raw.model,
		version: raw.version,
		snippet: raw.snippet ? true : undefined,
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
