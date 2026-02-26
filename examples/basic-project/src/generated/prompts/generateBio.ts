import { z } from 'zod';

export const model = 'gemini-1.5-pro' as const;

export const configs = {
	temperature: 0.7,
	maxTokens: 512,
} as const;

export const meta = {
	version: '1.0.2',
	lastUpdated: '2026-02-26T22:53:24.913Z',
	sourceFile: 'generateBio.prompt.md',
	contentHash:
		'bfd0c18d3b6297d38f1c940a018787ea2647b84fa4f2542fc14434a9d51b53e5',
	tokenEstimate: 50,
	inputTokenEstimate: 46,
} as const;

export const inputSchema = z.object({
	name: z.string(),
	traits: z.array(z.string()),
});

export type InputType = z.infer<typeof inputSchema>;

export const outputSchema = z.object({
	bio: z.string(),
});

export type OutputType = z.infer<typeof outputSchema>;

export const template = `You are an expert copywriter with decades of experience crafting compelling narratives for professionals across industries.
Write a short professional bio for {{ name }}.
Highlight these traits: {{ traits }}.
Keep it under 100 words.`;

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
