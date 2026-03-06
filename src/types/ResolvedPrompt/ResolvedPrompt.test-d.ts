import { describe, expectTypeOf, it } from 'vitest';
import type { ResolvedPrompt } from './index.js';

describe('ResolvedPrompt', () => {
	it('has required fields', () => {
		expectTypeOf<ResolvedPrompt>().toHaveProperty('body');
		expectTypeOf<ResolvedPrompt>().toHaveProperty('mergedInputs');
		expectTypeOf<ResolvedPrompt>().toHaveProperty('warnings');
		expectTypeOf<ResolvedPrompt>().toHaveProperty('resolvedDependencies');
	});

	it('body is a string', () => {
		expectTypeOf<ResolvedPrompt['body']>().toEqualTypeOf<string>();
	});

	it('warnings is a string array', () => {
		expectTypeOf<ResolvedPrompt['warnings']>().toEqualTypeOf<string[]>();
	});
});
