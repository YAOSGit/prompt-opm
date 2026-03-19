import chalk from 'chalk';
import { watch } from 'chokidar';
import { generate } from '../../core/Generate/index.js';
import { loadConfig } from '../loadConfig.js';

const STABILITY_THRESHOLD_MS = 100;
const DEBOUNCE_DELAY_MS = 300;

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
		awaitWriteFinish: { stabilityThreshold: STABILITY_THRESHOLD_MS },
	});

	watcher.on('all', (event, path) => {
		if (!path.endsWith('.prompt.md')) return;

		if (debounceTimer) clearTimeout(debounceTimer);

		debounceTimer = setTimeout(() => {
			console.log(`\nFile ${chalk.cyan(event)}: ${chalk.dim(path)}`);
			console.log(chalk.dim('Regenerating...'));

			try {
				const result = generate(config);

				for (const err of result.errors) {
					console.error(chalk.red(`ERROR [${err.filePath}]: ${err.message}`));
				}

				console.log(
					`Generated ${chalk.green(result.generated)} file(s), skipped ${chalk.dim(String(result.skipped))} unchanged.`,
				);
			} catch (err) {
				console.error(chalk.red(`Watch regeneration failed: ${err instanceof Error ? err.message : String(err)}`));
			}
		}, DEBOUNCE_DELAY_MS);
	});

	process.on('SIGINT', () => {
		watcher.close();
		process.exit(0);
	});

	console.log(
		`\nWatching ${chalk.cyan(config.source)} for changes... ${chalk.dim('(Ctrl+C to stop)')}`,
	);
}
