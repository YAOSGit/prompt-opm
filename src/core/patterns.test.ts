import { describe, expect, it } from 'vitest';
import {
	SNIPPET_RE,
	VARIABLE_RE,
	VARIABLE_RE_SIMPLE,
	classifyDiagnosticError,
} from './patterns.js';

describe('SNIPPET_RE', () => {
	it('matches a simple snippet reference', () => {
		const input = '{{ @header }}';
		const matches = [...input.matchAll(SNIPPET_RE)];
		expect(matches).toHaveLength(1);
		expect(matches[0][1]).toBe('@header');
	});

	it('matches a dot-prefixed snippet reference', () => {
		const input = '{{ @.local-snippet }}';
		const matches = [...input.matchAll(SNIPPET_RE)];
		expect(matches).toHaveLength(1);
		expect(matches[0][1]).toBe('@.local-snippet');
	});

	it('matches snippet references with path separators', () => {
		const input = '{{ @shared/utils/helper }}';
		const matches = [...input.matchAll(SNIPPET_RE)];
		expect(matches).toHaveLength(1);
		expect(matches[0][1]).toBe('@shared/utils/helper');
	});

	it('matches snippet references with colons', () => {
		const input = '{{ @scope:name }}';
		const matches = [...input.matchAll(SNIPPET_RE)];
		expect(matches).toHaveLength(1);
		expect(matches[0][1]).toBe('@scope:name');
	});

	it('matches multiple snippet references', () => {
		const input = '{{ @header }} some text {{ @footer }}';
		const matches = [...input.matchAll(SNIPPET_RE)];
		expect(matches).toHaveLength(2);
		expect(matches[0][1]).toBe('@header');
		expect(matches[1][1]).toBe('@footer');
	});

	it('handles extra whitespace inside braces', () => {
		const input = '{{   @spacious   }}';
		const matches = [...input.matchAll(SNIPPET_RE)];
		expect(matches).toHaveLength(1);
		expect(matches[0][1]).toBe('@spacious');
	});

	it('does not match variable references (no @ prefix)', () => {
		const input = '{{ myVariable }}';
		const matches = [...input.matchAll(SNIPPET_RE)];
		expect(matches).toHaveLength(0);
	});
});

describe('VARIABLE_RE', () => {
	it('matches a simple variable', () => {
		const input = '{{ name }}';
		const matches = [...input.matchAll(VARIABLE_RE)];
		expect(matches).toHaveLength(1);
		expect(matches[0][1]).toBe('name');
		expect(matches[0][2]).toBeUndefined();
	});

	it('matches a variable with default value', () => {
		const input = '{{ name | "World" }}';
		const matches = [...input.matchAll(VARIABLE_RE)];
		expect(matches).toHaveLength(1);
		expect(matches[0][1]).toBe('name');
		expect(matches[0][2]).toBe('World');
	});

	it('matches variables starting with underscore', () => {
		const input = '{{ _private }}';
		const matches = [...input.matchAll(VARIABLE_RE)];
		expect(matches).toHaveLength(1);
		expect(matches[0][1]).toBe('_private');
	});

	it('matches multiple variables', () => {
		const input = '{{ first }} and {{ second }}';
		const matches = [...input.matchAll(VARIABLE_RE)];
		expect(matches).toHaveLength(2);
		expect(matches[0][1]).toBe('first');
		expect(matches[1][1]).toBe('second');
	});

	it('does not match snippet references', () => {
		const input = '{{ @snippet }}';
		const matches = [...input.matchAll(VARIABLE_RE)];
		expect(matches).toHaveLength(0);
	});

	it('does not match references starting with a digit', () => {
		const input = '{{ 123abc }}';
		const matches = [...input.matchAll(VARIABLE_RE)];
		expect(matches).toHaveLength(0);
	});

	it('matches variable with empty default', () => {
		const input = '{{ name | "" }}';
		const matches = [...input.matchAll(VARIABLE_RE)];
		expect(matches).toHaveLength(1);
		expect(matches[0][1]).toBe('name');
		expect(matches[0][2]).toBe('');
	});
});

describe('VARIABLE_RE_SIMPLE', () => {
	it('matches variables without capturing groups', () => {
		const input = 'Hello {{ name }}!';
		const stripped = input.replace(VARIABLE_RE_SIMPLE, '');
		expect(stripped).toBe('Hello !');
	});

	it('strips variables with defaults', () => {
		const input = '{{ greeting | "Hi" }} {{ name }}!';
		const stripped = input.replace(VARIABLE_RE_SIMPLE, '');
		expect(stripped).toBe(' !');
	});

	it('strips multiple variables', () => {
		const input = '{{ a }} + {{ b }} = {{ c }}';
		const stripped = input.replace(VARIABLE_RE_SIMPLE, '');
		expect(stripped).toBe(' +  = ');
	});

	it('does not strip snippet references', () => {
		const input = '{{ @snippet }} stays';
		const stripped = input.replace(VARIABLE_RE_SIMPLE, '');
		expect(stripped).toBe('{{ @snippet }} stays');
	});
});

describe('classifyDiagnosticError', () => {
	it('classifies circular dependency errors', () => {
		expect(classifyDiagnosticError('Circular dependency detected between A and B')).toBe('circular');
	});

	it('classifies snippet errors', () => {
		expect(classifyDiagnosticError('Snippet @header not found')).toBe('snippet');
	});

	it('classifies conflict errors', () => {
		expect(classifyDiagnosticError('Conflict in merged inputs for key "name"')).toBe('conflict');
	});

	it('classifies schema errors', () => {
		expect(classifyDiagnosticError('Unsupported type: "complex"')).toBe('schema');
	});

	it('defaults to parse for unrecognized messages', () => {
		expect(classifyDiagnosticError('Something went wrong')).toBe('parse');
	});

	it('defaults to parse for empty messages', () => {
		expect(classifyDiagnosticError('')).toBe('parse');
	});

	it('prioritizes earlier checks for messages with multiple keywords', () => {
		// "Circular dependency" is checked first
		expect(classifyDiagnosticError('Circular dependency in Snippet')).toBe('circular');
	});
});
