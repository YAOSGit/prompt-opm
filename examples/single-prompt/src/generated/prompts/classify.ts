import { z } from 'zod';

export const model = 'gpt-4o' as const;

export const configs = {
	temperature: 0,
	maxTokens: 64,
} as const;

export const meta = {
	version: '1.0.0',
	lastUpdated: '2026-02-26T21:11:30.860Z',
	sourceFile: 'classify.prompt.md',
	contentHash:
		'e407828694f918298bb4a665666aba25cab513c4bd422f55e7ecca00ba26db83',
} as const;

export const inputSchema = z.object({
	text: z.string(),
	categories: z.array(z.string()),
});

export type InputType = z.infer<typeof inputSchema>;

export const outputSchema = z.object({
	category: z.string(),
	confidence: z.number(),
});

export type OutputType = z.infer<typeof outputSchema>;

export const template = `Classify the following text into exactly one of the given categories.
Respond with JSON containing "category" and "confidence" (0-1).

Categories: {{ categories }}

Text: {{ text }}`;

export const prompt = (inputs: InputType): string => {
	const validated = inputSchema.parse(inputs);
	let result = template;
	for (const [key, value] of Object.entries(validated)) {
		const serialized = Array.isArray(value) ? value.join(', ') : String(value);
		result = result.replaceAll(`{{ ${key} }}`, () => serialized);
	}
	return result;
};
