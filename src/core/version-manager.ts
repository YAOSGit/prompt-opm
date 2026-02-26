import type { ManifestEntry } from '../types/index.js';

export type BumpType = 'patch' | 'minor';

export function bumpVersion(version: string, type: BumpType): string {
	const parts = version.split('.').map(Number);
	const [major, minor, patch] = parts;

	if (type === 'minor') {
		return `${major}.${minor + 1}.0`;
	}
	return `${major}.${minor}.${patch + 1}`;
}

export function determineVersionBump(
	prev: ManifestEntry,
	currentContentHash: string,
	currentInputsHash: string,
	hasDirtyDependency: boolean,
): BumpType | null {
	const contentChanged = prev.contentHash !== currentContentHash;

	if (!contentChanged && !hasDirtyDependency) {
		return null;
	}

	if (contentChanged && prev.inputsHash !== currentInputsHash) {
		return 'minor';
	}

	return 'patch';
}
