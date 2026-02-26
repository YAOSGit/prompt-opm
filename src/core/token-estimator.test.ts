import { describe, expect, it } from 'vitest';
import { estimateFixedTokens, estimateTemplateTokens } from './token-estimator.js';

describe('estimateTemplateTokens', () => {
	it('returns a positive number for non-empty text', () => {
		const result = estimateTemplateTokens('Hello world, this is a test prompt.');
		expect(result).toBeGreaterThan(0);
		expect(Number.isInteger(result)).toBe(true);
	});

	it('returns 0 for empty string', () => {
		expect(estimateTemplateTokens('')).toBe(0);
	});

	it('returns consistent results for same input', () => {
		const text = 'Write a bio for {{ name }} highlighting {{ traits }}.';
		expect(estimateTemplateTokens(text)).toBe(estimateTemplateTokens(text));
	});
});

describe('estimateFixedTokens', () => {
	it('returns fewer tokens than full template when variables present', () => {
		const template = 'Write a bio for {{ name }} highlighting {{ traits }}.';
		const full = estimateTemplateTokens(template);
		const fixed = estimateFixedTokens(template);
		expect(fixed).toBeLessThanOrEqual(full);
	});

	it('returns same as full estimate when no variables', () => {
		const template = 'This prompt has no variables at all.';
		const full = estimateTemplateTokens(template);
		const fixed = estimateFixedTokens(template);
		expect(fixed).toBe(full);
	});

	it('strips variables with defaults too', () => {
		const template = 'Hello {{ name | "World" }}!';
		const fixed = estimateFixedTokens(template);
		const noVars = estimateTemplateTokens('Hello !');
		expect(fixed).toBe(noVars);
	});

	it('returns 0 for empty string', () => {
		expect(estimateFixedTokens('')).toBe(0);
	});
});
