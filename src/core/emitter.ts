import { mapSchemaToZodObjectString } from './schema-mapper.js';

export type EmitInput = {
	model: string;
	configs: Record<string, unknown>;
	meta: {
		version: string;
		lastUpdated: string;
		sourceFile: string;
		contentHash: string;
		tokenEstimate: number;
		inputTokenEstimate: number;
	};
	inputs: Record<string, string>;
	outputs: Record<string, string>;
	template: string;
};

function formatValue(value: unknown, indent: string): string {
	if (value === null || value === undefined) {
		return String(value);
	}
	if (typeof value === 'string') {
		return `"${value}"`;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	if (Array.isArray(value)) {
		const items = value.map((v) => formatValue(v, `${indent}\t`));
		return `[${items.join(', ')}]`;
	}
	if (typeof value === 'object') {
		return formatObjectLiteral(value as Record<string, unknown>, indent);
	}
	return String(value);
}

function formatObjectLiteral(
	obj: Record<string, unknown>,
	indent = '',
): string {
	const entries = Object.entries(obj);
	if (entries.length === 0) {
		return '{}';
	}
	const innerIndent = `${indent}\t`;
	const fields = entries
		.map(
			([key, val]) => `${innerIndent}${key}: ${formatValue(val, innerIndent)},`,
		)
		.join('\n');
	return `{\n${fields}\n${indent}}`;
}

export function generateFileContent(input: EmitInput): string {
	const configStr =
		Object.keys(input.configs).length > 0
			? `${formatObjectLiteral(input.configs)} as const`
			: '{} as const';

	const metaStr = formatObjectLiteral(
		input.meta as unknown as Record<string, unknown>,
	);
	const inputSchemaStr = mapSchemaToZodObjectString(input.inputs);
	const outputSchemaStr = mapSchemaToZodObjectString(input.outputs);
	const escapedTemplate = input.template
		.replace(/`/g, '\\`')
		.replace(/\$/g, '\\$');

	return `import { z } from "zod";

export const model = "${input.model}" as const;

export const configs = ${configStr};

export const meta = ${metaStr} as const;

export const inputSchema = ${inputSchemaStr};

export type InputType = z.infer<typeof inputSchema>;

export const outputSchema = ${outputSchemaStr};

export type OutputType = z.infer<typeof outputSchema>;

export const template = \`${escapedTemplate}\`;

export const prompt = (inputs: InputType): string => {
\tconst validated = inputSchema.parse(inputs);
\tlet result = template;

\t// Handle variables with defaults: {{ key | "default" }}
\tconst VARIABLE_WITH_DEFAULT_RE = /\\{\\{\\s*([a-zA-Z_]\\w*)\\s*\\|\\s*"([^"]*)"\\s*\\}\\}/g;
\tresult = result.replace(VARIABLE_WITH_DEFAULT_RE, (_, key, defaultValue) => {
\t\tconst value = (validated as any)[key];
\t\tif (value === undefined || value === null) return defaultValue;
\t\treturn Array.isArray(value) ? value.join(", ") : String(value);
\t});

\tfor (const [key, value] of Object.entries(validated)) {
\t\tconst serialized = Array.isArray(value) ? value.join(", ") : String(value);
\t\tresult = result.replaceAll(\`{{ \${key} }}\`, () => serialized);
\t}
\treturn result;
};
`;
}

export function generateBarrelContent(moduleNames: string[]): string {
	if (moduleNames.length === 0) {
		return '';
	}

	return `${moduleNames
		.map((name) => `export * as ${name} from "./${name}.js";`)
		.join('\n')}\n`;
}
