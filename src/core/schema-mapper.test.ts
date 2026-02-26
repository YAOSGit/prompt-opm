import { describe, expect, it } from 'vitest';
import { mapSchemaToZodObjectString, mapTypeToZod } from './schema-mapper.js';

describe('mapTypeToZod', () => {
	it('maps string', () => {
		expect(mapTypeToZod('string')).toBe('z.string()');
	});

	it('maps number', () => {
		expect(mapTypeToZod('number')).toBe('z.number()');
	});

	it('maps boolean', () => {
		expect(mapTypeToZod('boolean')).toBe('z.boolean()');
	});

	it('maps string[]', () => {
		expect(mapTypeToZod('string[]')).toBe('z.array(z.string())');
	});

	it('maps number[]', () => {
		expect(mapTypeToZod('number[]')).toBe('z.array(z.number())');
	});

	it('maps boolean[]', () => {
		expect(mapTypeToZod('boolean[]')).toBe('z.array(z.boolean())');
	});

	it('maps enum', () => {
		expect(mapTypeToZod('enum(admin, user, guest)')).toBe(
			'z.enum(["admin", "user", "guest"])',
		);
	});

	it('throws on unknown type', () => {
		expect(() => mapTypeToZod('object')).toThrow(/unsupported type/i);
	});
});

describe('mapSchemaToZodObjectString', () => {
	it('generates a z.object string from a schema record', () => {
		const schema = { name: 'string', age: 'number' };
		const result = mapSchemaToZodObjectString(schema);
		expect(result).toContain('z.object({');
		expect(result).toContain('name: z.string()');
		expect(result).toContain('age: z.number()');
		expect(result).toContain('})');
	});

	it('handles empty schema', () => {
		const result = mapSchemaToZodObjectString({});
		expect(result).toBe('z.object({})');
	});

	it('handles nested objects', () => {
		const schema = {
			user: {
				name: 'string',
				age: 'number',
			},
		};
		const result = mapSchemaToZodObjectString(schema);
		expect(result).toContain('user: z.object({');
		expect(result).toContain('name: z.string()');
		expect(result).toContain('age: z.number()');
	});

	it('handles optional fields', () => {
		const schema = {
			'nickname?': 'string',
		};
		const result = mapSchemaToZodObjectString(schema);
		expect(result).toContain('nickname: z.string().optional()');
	});

	it('handles nested optional fields', () => {
		const schema = {
			user: {
				'nickname?': 'string',
			},
		};
		const result = mapSchemaToZodObjectString(schema);
		expect(result).toContain('nickname: z.string().optional()');
	});
});
