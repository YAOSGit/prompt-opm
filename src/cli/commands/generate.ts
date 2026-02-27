import chalk from 'chalk';
import { generate } from '../../core/generate.js';
import { loadConfig } from '../load-config.js';

export function runGenerate(cwd: string): void {
	const config = loadConfig(cwd);
	const result = generate(config);

	for (const warn of result.warnings) {
		console.warn(chalk.yellow(`WARN: ${warn}`));
	}

	for (const err of result.errors) {
		console.error(chalk.red(`ERROR [${err.filePath}]: ${err.message}`));
	}

	console.log(
		`Generated ${chalk.green(result.generated)} file(s), skipped ${chalk.dim(String(result.skipped))} unchanged.`,
	);

	if (result.errors.length > 0) {
		process.exitCode = 1;
	}
}
