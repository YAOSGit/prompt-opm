#!/usr/bin/env node

import { runDiff } from './commands/diff.js';
import { runGenerate } from './commands/generate.js';
import { runInit } from './commands/init.js';
import { runValidate } from './commands/validate.js';
import { runWatch } from './commands/watch.js';

declare const __CLI_VERSION__: string;

const args = process.argv.slice(2);
const command = args[0];
const cwd = process.cwd();

switch (command) {
	case 'init':
		runInit(cwd);
		break;

	case 'generate':
		runGenerate(cwd);
		break;

	case 'watch':
		runWatch(cwd);
		break;

	case 'validate':
		runValidate(cwd);
		break;

	case 'diff':
		runDiff(cwd);
		break;

	case 'analyze': {
		const jsonFlag = args.includes('--json');
		import('./commands/analyze.js').then(({ runAnalyze }) => {
			runAnalyze(cwd, { json: jsonFlag });
		});
		break;
	}

	case 'schema': {
		const formatIdx = args.indexOf('--format');
		const format = formatIdx !== -1 ? args[formatIdx + 1] : 'jsonschema';
		import('./commands/schema.js').then(({ runSchema }) => {
			runSchema(cwd, { format });
		});
		break;
	}

	case '--version':
	case '-v':
		console.log(__CLI_VERSION__);
		break;

	case '--help':
	case '-h':
	case undefined:
		console.log(`prompt-opm v${__CLI_VERSION__}

Usage: prompt-opm <command>

Commands:
  init        Scaffold .prompts/ directory and config file
  generate    Compile .prompt.md files to TypeScript
  watch       Watch for changes and regenerate
  validate    Check for errors without emitting files
  diff        Preview what would change
  analyze     Show prompt metrics and dependency graph
  schema      Export prompt schemas (JSON Schema)

Options:
  -v, --version  Show version
  -h, --help     Show help`);
		break;

	default:
		console.error(
			`Unknown command: ${command}\nRun "prompt-opm --help" for usage.`,
		);
		process.exitCode = 1;
}
