import type { DiagnosticError } from '../Diagnostics/index.js';

export type GenerateResult = {
	generated: number;
	skipped: number;
	errors: DiagnosticError[];
	warnings: string[];
};
