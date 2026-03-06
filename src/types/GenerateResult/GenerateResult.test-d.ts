import { describe, expectTypeOf, it } from 'vitest';
import type { GenerateResult } from './index.js';

describe('GenerateResult', () => {
	it('has required fields', () => {
		expectTypeOf<GenerateResult>().toHaveProperty('generated');
		expectTypeOf<GenerateResult>().toHaveProperty('skipped');
		expectTypeOf<GenerateResult>().toHaveProperty('errors');
		expectTypeOf<GenerateResult>().toHaveProperty('warnings');
	});

	it('generated and skipped are numbers', () => {
		expectTypeOf<GenerateResult['generated']>().toEqualTypeOf<number>();
		expectTypeOf<GenerateResult['skipped']>().toEqualTypeOf<number>();
	});
});
