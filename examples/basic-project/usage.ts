/**
 * Example usage of prompt-opm generated modules.
 *
 * This file demonstrates how to use the generated TypeScript
 * modules in your application code. It is not meant to be
 * executed — replace `myLLMClient` with your actual LLM SDK.
 */

import * as classifyPrompt from './src/generated/prompts/classify.js';
import * as bioPrompt from './src/generated/prompts/generateBio.js';
import * as emailPrompt from './src/generated/prompts/welcomeEmail.js';

// ─── Example 1: Generate a Bio ──────────────────────────────

// Validate inputs at runtime with Zod
const bioInputs = bioPrompt.inputSchema.parse({
	name: 'Alice Chen',
	traits: ['creative', 'data-driven', 'team leader'],
});

// Build the prompt string (snippets already resolved)
const bioPromptText = bioPrompt.prompt(bioInputs);

console.log('=== Bio Prompt ===');
console.log(`Model: ${bioPrompt.model}`);
console.log(`Version: ${bioPrompt.meta.version}`);
console.log(`Prompt:\n${bioPromptText}\n`);

// In your real app:
// const result = await myLLMClient({
//   model: bioPrompt.model,
//   prompt: bioPromptText,
//   ...bioPrompt.configs,
// });
// const data = bioPrompt.outputSchema.parse(result);

// ─── Example 2: Classify Text ───────────────────────────────

const classifyInputs = classifyPrompt.inputSchema.parse({
	text: 'The new MacBook Pro has an incredible display and battery life.',
	categories: ['technology', 'sports', 'politics', 'entertainment'],
});

const classifyPromptText = classifyPrompt.prompt(classifyInputs);

console.log('=== Classify Prompt ===');
console.log(`Model: ${classifyPrompt.model}`);
console.log(`Temperature: ${classifyPrompt.configs.temperature}`);
console.log(`Prompt:\n${classifyPromptText}\n`);

// ─── Example 3: Welcome Email (uses snippets) ───────────────

const emailInputs = emailPrompt.inputSchema.parse({
	userName: 'Ygor',
	productName: 'Prompt OPM',
	tone: 'friendly', // type-safe enum: 'formal' | 'casual' | 'friendly'
});

const emailPromptText = emailPrompt.prompt(emailInputs);

console.log('=== Welcome Email Prompt ===');
console.log(`Model: ${emailPrompt.model}`);
console.log(`Prompt:\n${emailPromptText}\n`);

// ─── Example 4: Type Safety ─────────────────────────────────

// These would cause TypeScript compile errors:
// bioPrompt.inputSchema.parse({ name: 123 });          // name must be string
// emailPrompt.inputSchema.parse({ tone: 'aggressive' }); // not a valid enum value

// These would cause Zod runtime validation errors:
// bioPrompt.prompt({ name: 123, traits: 'not-array' });

// The output schema validates LLM responses:
// const badResponse = bioPrompt.outputSchema.parse({ bio: 42 }); // throws ZodError
