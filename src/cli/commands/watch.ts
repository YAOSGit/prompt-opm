import { watch } from 'chokidar';
import chalk from 'chalk';
import { generate } from '../../core/generate.js';
import { loadConfig } from '../load-config.js';

export function runWatch(cwd: string): void {
	const config = loadConfig(cwd);

	// Initial generate
	console.log(chalk.dim('Running initial generation...'));
	const result = generate(config);
	console.log(
		`Generated ${chalk.green(result.generated)} file(s), skipped ${chalk.dim(String(result.skipped))} unchanged.`,
	);

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const watcher = watch(config.source, {
		ignoreInitial: true,
		awaitWriteFinish: { stabilityThreshold: 100 },
	});

	watcher.on('all', (event, path) => {
		if (!path.endsWith('.prompt.md')) return;

		if (debounceTimer) clearTimeout(debounceTimer);

		debounceTimer = setTimeout(() => {
			console.log(`\nFile ${chalk.cyan(event)}: ${chalk.dim(path)}`);
			console.log(chalk.dim('Regenerating...'));

			const result = generate(config);

			for (const err of result.errors) {
				console.error(chalk.red(`ERROR [${err.filePath}]: ${err.message}`));
			}

			console.log(
				`Generated ${chalk.green(result.generated)} file(s), skipped ${chalk.dim(String(result.skipped))} unchanged.`,
			);
		}, 300);
	});

	console.log(
		`\nWatching ${chalk.cyan(config.source)} for changes... ${chalk.dim('(Ctrl+C to stop)')}`,
	);
}
