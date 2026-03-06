import type { DiagnosticError } from '../types/index.js';

/** Matches `{{ @snippetRef }}` with capture group for the reference. */
export const SNIPPET_RE = /\{\{\s*(@\.?[\w/.:-][\w/.:=-]*)\s*\}\}/g;

/** Matches `{{ variable }}` and `{{ variable | "default" }}` with capture groups. */
export const VARIABLE_RE =
	/\{\{\s*([a-zA-Z_]\w*)(?:\s*\|\s*"([^"]*)")?\s*\}\}/g;

/** Matches variable placeholders without capture groups (for stripping). */
export const VARIABLE_RE_SIMPLE =
	/\{\{\s*[a-zA-Z_]\w*(?:\s*\|\s*"[^"]*")?\s*\}\}/g;

/**
 * Classifies an error message into a DiagnosticError type.
 */
export function classifyDiagnosticError(
	message: string,
): DiagnosticError['type'] {
	if (message.includes('Circular dependency')) {
		return 'circular';
	}
	if (message.includes('Snippet')) {
		return 'snippet';
	}
	if (message.includes('Conflict')) {
		return 'conflict';
	}
	if (message.includes('Unsupported type')) {
		return 'schema';
	}
	return 'parse';
}
