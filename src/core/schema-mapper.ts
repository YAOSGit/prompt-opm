import type { SchemaValue } from '../types/index.js';

const ENUM_RE = /^enum\((.+)\)$/;
const ARRAY_RE = /^(\w+)\[\]$/;

export function mapTypeToZod(type: SchemaValue): string {
	if (typeof type === 'object' && type !== null) {
		return mapSchemaToZodObjectString(type);
	}

	const trimmed = String(type).trim();

	const arrayMatch = trimmed.match(ARRAY_RE);
	if (arrayMatch) {
		return `z.array(${mapTypeToZod(arrayMatch[1])})`;
	}

	const enumMatch = trimmed.match(ENUM_RE);
	if (enumMatch) {
		const values = enumMatch[1].split(',').map((v) => `"${v.trim()}"`);
		return `z.enum([${values.join(', ')}])`;
	}

	switch (trimmed) {
		case 'string':
			return 'z.string()';
		case 'number':
			return 'z.number()';
		case 'boolean':
			return 'z.boolean()';
		default:
			throw new Error(`Unsupported type: "${trimmed}"`);
	}
}

export function mapSchemaToZodObjectString(
	schema: Record<string, SchemaValue>,
): string {
	const entries = Object.entries(schema);
	if (entries.length === 0) {
		return 'z.object({})';
	}

	const fields = entries
		.map(([key, type]) => {
			const isOptional = key.endsWith('?');
			const cleanKey = isOptional ? key.slice(0, -1) : key;
			let zodType = mapTypeToZod(type);
			if (isOptional) {
				zodType = `${zodType}.optional()`;
			}
			return `\t${cleanKey}: ${zodType},`;
		})
		.join('\n');
	return `z.object({\n${fields}\n})`;
}
