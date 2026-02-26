import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import * as esbuild from 'esbuild';

// Read version from package.json at build time
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = packageJson.version;

const requireShim = `
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
`;

await esbuild.build({
	entryPoints: ['src/cli/index.ts', 'src/index.ts'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	outdir: 'dist',
	minify: true,
	tsconfig: 'tsconfig.app.json',
	external: [...builtinModules.map((m) => `node:${m}`), 'zod'],
	banner: {
		js: requireShim,
	},
	// Inject version at build time
	define: {
		__CLI_VERSION__: JSON.stringify(version),
	},
	supported: {
		'top-level-await': true,
	},
	plugins: [
		{
			name: 'node-builtins-to-node-prefix',
			setup(build) {
				const filter = new RegExp(`^(${builtinModules.join('|')})$`);
				build.onResolve({ filter }, (args) => ({
					path: `node:${args.path}`,
					external: true,
				}));
			},
		},
	],
	mainFields: ['module', 'main'],
	conditions: ['import', 'node'],
});
