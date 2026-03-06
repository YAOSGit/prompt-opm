import { describe, expectTypeOf, it } from 'vitest';
import type { EmitInput } from './index.js';

describe('EmitInput', () => {
	it('has required fields', () => {
		expectTypeOf<EmitInput>().toHaveProperty('model');
		expectTypeOf<EmitInput>().toHaveProperty('configs');
		expectTypeOf<EmitInput>().toHaveProperty('meta');
		expectTypeOf<EmitInput>().toHaveProperty('inputs');
		expectTypeOf<EmitInput>().toHaveProperty('outputs');
		expectTypeOf<EmitInput>().toHaveProperty('template');
	});

	it('meta has required fields', () => {
		expectTypeOf<EmitInput['meta']>().toHaveProperty('version');
		expectTypeOf<EmitInput['meta']>().toHaveProperty('lastUpdated');
		expectTypeOf<EmitInput['meta']>().toHaveProperty('sourceFile');
		expectTypeOf<EmitInput['meta']>().toHaveProperty('contentHash');
		expectTypeOf<EmitInput['meta']>().toHaveProperty('tokenEstimate');
		expectTypeOf<EmitInput['meta']>().toHaveProperty('inputTokenEstimate');
	});
});
