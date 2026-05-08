import { z } from 'zod';

export const model = 'gemini-1.5-pro' as const;

export const configs = {
	temperature: 0.5,
	maxTokens: 1024,
} as const;

export const meta = {
	version: '1.0.2',
	lastUpdated: '2026-02-26T22:53:24.911Z',
	sourceFile: 'email/welcomeEmail.prompt.md',
	contentHash:
		'4418c517e7894fd46d1321027ecdea93c00febf12b97d62bef51f85485cb79b3',
	tokenEstimate: 78,
	inputTokenEstimate: 68,
} as const;

export const inputSchema = z.object({
	userName: z.string(),
	productName: z.string(),
	tone: z.enum(['formal', 'casual', 'friendly']),
});

export type InputType = z.infer<typeof inputSchema>;

export const outputSchema = z.object({
	subject: z.string(),
	body: z.string(),
});

export type OutputType = z.infer<typeof outputSchema>;

export const template = `You are an expert copywriter with decades of experience crafting compelling narratives for professionals across industries.
Always end the email with a warm signoff and the company name "Acme Corp".
Write a welcome email for {{ userName }} who just signed up for {{ productName }}.
Use a {{ tone }} tone.
Return JSON with "subject" and "body" fields.`;

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
