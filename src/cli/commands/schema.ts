import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePromptFile } from '../../core/parser.js';
import { scanPromptFiles } from '../../core/scanner.js';
import { resolveSnippets } from '../../core/snippet-resolver.js';
import { loadConfig } from '../load-config.js';

export function runSchema(cwd: string, options: { format: string }): void {
    const config = loadConfig(cwd);
    const files = scanPromptFiles(config.source);
    const schemas: Record<string, any> = {};

    for (const filePath of files) {
        try {
            const content = readFileSync(filePath, 'utf-8');
            const parsed = parsePromptFile(content, filePath);

            if (parsed.frontmatter.snippet) continue;

            const resolved = resolveSnippets(parsed, config.source);
            const moduleName = filePath.split('/').pop()?.replace('.prompt.md', '');

            if (moduleName) {
                schemas[moduleName] = {
                    inputs: convertToJSONSchema(resolved.mergedInputs),
                    outputs: convertToJSONSchema(parsed.frontmatter.outputs ?? {}),
                };
            }
        } catch (err) {
            console.error(`Error processing ${filePath}:`, err);
        }
    }

    const output = JSON.stringify(schemas, null, 2);
    if (options.format === 'jsonschema') {
        console.log(output);
    } else {
        console.error(`Unsupported format: ${options.format}`);
        process.exit(1);
    }
}

function convertToJSONSchema(schema: Record<string, any>): any {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, type] of Object.entries(schema)) {
        const isOptional = key.endsWith('?');
        const cleanKey = isOptional ? key.slice(0, -1) : key;

        if (!isOptional) {
            required.push(cleanKey);
        }

        properties[cleanKey] = mapTypeToJsonSchema(type);
    }

    return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
        additionalProperties: false,
    };
}

function mapTypeToJsonSchema(type: any): any {
    if (typeof type === 'object' && type !== null) {
        return convertToJSONSchema(type);
    }

    const trimmed = String(type).trim();

    // Array
    if (trimmed.endsWith('[]')) {
        const baseType = trimmed.slice(0, -2);
        return {
            type: 'array',
            items: mapTypeToJsonSchema(baseType),
        };
    }

    // Enum
    if (trimmed.startsWith('enum(') && trimmed.endsWith(')')) {
        const values = trimmed
            .slice(5, -1)
            .split(',')
            .map((v) => v.trim());
        return {
            type: 'string',
            enum: values,
        };
    }

    switch (trimmed) {
        case 'string':
            return { type: 'string' };
        case 'number':
            return { type: 'number' };
        case 'boolean':
            return { type: 'boolean' };
        default:
            return { type: 'string' }; // Fallback
    }
}
