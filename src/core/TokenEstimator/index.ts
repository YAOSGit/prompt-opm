import { estimateTokenCount } from 'tokenx';

const VARIABLE_RE = /\{\{\s*[a-zA-Z_]\w*(?:\s*\|\s*"[^"]*")?\s*\}\}/g;

export function estimateTemplateTokens(text: string): number {
	if (!text) return 0;
	return estimateTokenCount(text);
}

export function estimateFixedTokens(template: string): number {
	if (!template) return 0;
	const stripped = template.replace(VARIABLE_RE, '');
	return estimateTokenCount(stripped);
}
