import { createHash } from 'node:crypto';

export function hashContent(content: string): string {
	return createHash('sha256').update(content).digest('hex');
}

export function hashInputsOutputs(
	inputs: Record<string, string> | undefined,
	outputs: Record<string, string> | undefined,
): string {
	const sortedInputs = Object.entries(inputs ?? {}).sort(([a], [b]) =>
		a.localeCompare(b),
	);
	const sortedOutputs = Object.entries(outputs ?? {}).sort(([a], [b]) =>
		a.localeCompare(b),
	);
	const canonical = JSON.stringify({
		inputs: sortedInputs,
		outputs: sortedOutputs,
	});
	return hashContent(canonical);
}
