import * as esbuild from 'esbuild';
import { createEsbuildConfig } from '@yaos-git/toolkit/build';

const baseConfig = createEsbuildConfig({ entry: 'src/cli/index.ts' });
const external = ['zod', ...baseConfig.external];

// Build CLI binary
await esbuild.build({
	...baseConfig,
	outfile: 'dist/cli.js',
	external,
});

// Build library export
await esbuild.build({
	...createEsbuildConfig({ entry: 'src/lib.ts' }),
	outfile: 'dist/lib.js',
	external,
});
