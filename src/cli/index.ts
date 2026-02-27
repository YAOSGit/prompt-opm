#!/usr/bin/env node

import { Command } from 'commander';
import { runDiff } from './commands/diff.js';
import { runGenerate } from './commands/generate.js';
import { runInit } from './commands/init.js';
import { runValidate } from './commands/validate.js';
import { runWatch } from './commands/watch.js';

declare const __CLI_VERSION__: string;

const program = new Command();
const cwd = process.cwd();

program
	.name('prompt-opm')
	.description(
		'A local-first Object Prompt Mapper for type-safe LLM prompts',
	)
	.version(__CLI_VERSION__);

program
	.command('init')
	.description('Scaffold .prompts/ directory and config file')
	.action(() => runInit(cwd));

program
	.command('generate')
	.description('Compile .prompt.md files to TypeScript')
	.action(() => runGenerate(cwd));

program
	.command('watch')
	.description('Watch for changes and regenerate')
	.action(() => runWatch(cwd));

program
	.command('validate')
	.description('Check for errors without emitting files')
	.action(() => runValidate(cwd));

program
	.command('diff')
	.description('Preview what would change')
	.action(() => runDiff(cwd));

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
	.option('--format <format>', 'Output format', 'jsonschema')
	.action(async (options) => {
		const { runSchema } = await import('./commands/schema.js');
		runSchema(cwd, { format: options.format });
	});

program.parse();
