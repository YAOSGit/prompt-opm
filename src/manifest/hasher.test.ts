import { describe, expect, it } from 'vitest';
import { hashContent, hashInputsOutputs } from './hasher.js';

describe('hashContent', () => {
	it('returns a hex string', () => {
		const result = hashContent('hello world');
		expect(result).toMatch(/^[a-f0-9]+$/);
	});

	it('returns same hash for same content', () => {
		expect(hashContent('test')).toBe(hashContent('test'));
	});

	it('returns different hash for different content', () => {
		expect(hashContent('a')).not.toBe(hashContent('b'));
	});
});

describe('hashInputsOutputs', () => {
	it('hashes inputs and outputs together', () => {
		const inputs = { name: 'string', age: 'number' };
		const outputs = { bio: 'string' };
		const result = hashInputsOutputs(inputs, outputs);
		expect(result).toMatch(/^[a-f0-9]+$/);
	});

	it('same schema produces same hash regardless of key order', () => {
		const a = hashInputsOutputs({ b: 'string', a: 'number' }, {});
		const b = hashInputsOutputs({ a: 'number', b: 'string' }, {});
		expect(a).toBe(b);
	});

	it('different schemas produce different hashes', () => {
		const a = hashInputsOutputs({ name: 'string' }, {});
		const b = hashInputsOutputs({ name: 'number' }, {});
		expect(a).not.toBe(b);
	});
});
