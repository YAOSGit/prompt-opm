import { describe, expectTypeOf, it } from 'vitest';
import type { BumpType } from './index.js';

describe('BumpType', () => {
	it('is a union of patch and minor', () => {
		expectTypeOf<BumpType>().toEqualTypeOf<'patch' | 'minor'>();
	});

	it('accepts valid values', () => {
		expectTypeOf<'patch'>().toMatchTypeOf<BumpType>();
		expectTypeOf<'minor'>().toMatchTypeOf<BumpType>();
	});
});
