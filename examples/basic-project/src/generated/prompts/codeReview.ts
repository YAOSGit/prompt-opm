import { z } from 'zod';

export const model = 'claude-sonnet-4-20250514' as const;

export const configs = {
	temperature: 0.3,
	maxTokens: 2048,
} as const;

export const meta = {
	version: '1.0.2',
	lastUpdated: '2026-02-26T22:53:24.915Z',
	sourceFile: 'shared/codeReview.prompt.md',
	contentHash:
		'c2958c310d89655b5476012e650dece08e0526f66bdfab126b6c2704160862a3',
	tokenEstimate: 93,
	inputTokenEstimate: 78,
} as const;

export const inputSchema = z.object({
	code: z.string(),
	language: z.string(),
	focusAreas: z.array(z.string()),
});

export type InputType = z.infer<typeof inputSchema>;

export const outputSchema = z.object({
	issues: z.string(),
	suggestions: z.string(),
	rating: z.number(),
});

export type OutputType = z.infer<typeof outputSchema>;

export const template = `You are an expert copywriter with decades of experience crafting compelling narratives for professionals across industries.
Review the following {{ language }} code.
Focus on these areas: {{ focusAreas }}.

Return JSON with:
- "issues": a list of problems found
- "suggestions": actionable improvements
- "rating": overall quality score from 1-10

Code:
\`\`\`{{ language }}
{{ code }}
\`\`\``;

export const prompt = (inputs: InputType): string => {
	const validated = inputSchema.parse(inputs);
	let result = template;

	// Handle variables with defaults: {{ key | "default" }}
	const VARIABLE_WITH_DEFAULT_RE =
		/\{\{\s*([a-zA-Z_]\w*)\s*\|\s*"([^"]*)"\s*\}\}/g;
	result = result.replace(VARIABLE_WITH_DEFAULT_RE, (_, key, defaultValue) => {
		const value = (validated as Record<string, unknown>)[key];
		if (value === undefined || value === null) return defaultValue;
		return Array.isArray(value) ? value.join(', ') : String(value);
	});

	for (const [key, value] of Object.entries(validated)) {
		const serialized = Array.isArray(value) ? value.join(', ') : String(value);
		result = result.replaceAll(`{{ ${key} }}`, () => serialized);
	}
	return result;
};
