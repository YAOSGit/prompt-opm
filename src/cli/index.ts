#!/usr/bin/env node

import { Option } from 'commander';
import { createCLI, fatalError, formatError, getExitCode, runIfMain } from '@yaos-git/toolkit/cli';
import { runDiff } from './commands/diff.js';
import { runGenerate } from './commands/generate.js';
import { runInit } from './commands/init.js';
import { runValidate } from './commands/validate.js';
import { runWatch } from './commands/watch.js';

declare const __CLI_VERSION__: string;

export async function runCLI(args: string[] = process.argv.slice(2)): Promise<void> {
	const cwd = process.cwd();
	const { program } = createCLI({
		name: 'prompt-opm',
		description: 'A local-first Object Prompt Mapper for type-safe LLM prompts',
		version: __CLI_VERSION__,
	});

	program.command('init').description('Scaffold .prompts/ directory and config file').action(() => runInit(cwd));
	program.command('generate').description('Compile .prompt.md files to TypeScript').action(() => runGenerate(cwd));
	program.command('watch').description('Watch for changes and regenerate').action(() => runWatch(cwd));
	program.command('validate').description('Check for errors without emitting files').action(() => runValidate(cwd));
	program.command('diff').description('Preview what would change').action(() => runDiff(cwd));

	program
		.command('analyze')
		.description('Show prompt metrics and dependency graph')
		.option('--json', 'Output results as JSON')
		.action(async (options) => {
			const { runAnalyze } = await import('./commands/analyze.js');
			runAnalyze(cwd, { json: options.json ?? false });
		});

	program
		.command('schema')
		.description('Export prompt schemas')
		.addOption(new Option('--format <format>', 'Output format').default('jsonschema').choices(['jsonschema']))
		.action(async (options) => {
			const { runSchema } = await import('./commands/schema.js');
			runSchema(cwd, { format: options.format });
		});

	try {
		await program.parseAsync(args, { from: 'user' });
	} catch (err) {
		if (err instanceof Error && 'exitCode' in err) {
			process.exitCode = getExitCode(err);
		} else {
			fatalError(formatError(err));
		}
	}
}

runIfMain(import.meta.url, () => runCLI());
