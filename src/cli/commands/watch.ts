import { watch } from 'chokidar';
import { generate } from '../../core/generate.js';
import { loadConfig } from '../load-config.js';

export function runWatch(cwd: string): void {
	const config = loadConfig(cwd);

	// Initial generate
	console.log('Running initial generation...');
	const result = generate(config);
	console.log(
		`Generated ${result.generated} file(s), skipped ${result.skipped} unchanged.`,
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
			console.log(`\nFile ${event}: ${path}`);
			console.log('Regenerating...');

			const result = generate(config);

			for (const err of result.errors) {
				console.error(`ERROR [${err.filePath}]: ${err.message}`);
			}

			console.log(
				`Generated ${result.generated} file(s), skipped ${result.skipped} unchanged.`,
			);
		}, 300);
	});

	console.log(`\nWatching ${config.source} for changes... (Ctrl+C to stop)`);
}
