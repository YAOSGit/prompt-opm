import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_DIR = join(import.meta.dirname, '../../../.test-watch-cmd');

const mockWatcherCallbacks: Record<string, (...args: unknown[]) => void> = {};
const mockWatcher = {
	on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
		mockWatcherCallbacks[event] = callback;
		return mockWatcher;
	}),
	close: vi.fn(),
};

vi.mock('chokidar', () => ({
	watch: vi.fn(() => mockWatcher),
}));

vi.mock('../../core/generate.js', () => ({
	generate: vi.fn(() => ({
		generated: 1,
		skipped: 0,
		errors: [],
		warnings: [],
	})),
}));

import { watch } from 'chokidar';
import { generate } from '../../core/generate.js';
import { runWatch } from './watch.js';

beforeEach(() => {
	mkdirSync(TEST_DIR, { recursive: true });
	mkdirSync(join(TEST_DIR, '.prompts'), { recursive: true });

	writeFileSync(
		join(TEST_DIR, '.prompt-opm.config.json'),
		JSON.stringify({
			source: './.prompts',
			output: './src/generated/prompts',
		}),
	);

	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});

	vi.useFakeTimers();
	vi.clearAllMocks();
});

afterEach(() => {
	if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('runWatch', () => {
	it('runs initial generation on start', () => {
		runWatch(TEST_DIR);

		expect(generate).toHaveBeenCalledTimes(1);
		expect(console.log).toHaveBeenCalledWith('Running initial generation...');
		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('Generated 1 file'),
		);
	});

	it('sets up file watcher with correct options', () => {
		runWatch(TEST_DIR);

		expect(watch).toHaveBeenCalledWith(
			expect.stringContaining('.prompts'),
			expect.objectContaining({
				ignoreInitial: true,
				awaitWriteFinish: { stabilityThreshold: 100 },
			}),
		);
	});

	it('logs watching message after setup', () => {
		runWatch(TEST_DIR);

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('Watching'),
		);
		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('Ctrl+C to stop'),
		);
	});

	it('regenerates on .prompt.md file changes after debounce', () => {
		runWatch(TEST_DIR);
		vi.clearAllMocks();

		mockWatcherCallbacks.all('change', '/path/to/test.prompt.md');
		vi.advanceTimersByTime(300);

		expect(generate).toHaveBeenCalledTimes(1);
		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining('Regenerating'),
		);
	});

	it('ignores non-.prompt.md files', () => {
		runWatch(TEST_DIR);
		vi.clearAllMocks();

		mockWatcherCallbacks.all('change', '/path/to/test.ts');
		vi.advanceTimersByTime(300);

		expect(generate).not.toHaveBeenCalled();
	});

	it('debounces rapid file changes', () => {
		runWatch(TEST_DIR);
		vi.clearAllMocks();

		mockWatcherCallbacks.all('change', '/path/to/test.prompt.md');
		vi.advanceTimersByTime(100);
		mockWatcherCallbacks.all('change', '/path/to/test.prompt.md');
		vi.advanceTimersByTime(100);
		mockWatcherCallbacks.all('change', '/path/to/test.prompt.md');
		vi.advanceTimersByTime(300);

		expect(generate).toHaveBeenCalledTimes(1);
	});

	it('logs errors from generation', () => {
		vi.mocked(generate).mockReturnValueOnce({
			generated: 0,
			skipped: 0,
			errors: [
				{ filePath: 'test.prompt.md', message: 'Parse error', type: 'parse' },
			],
			warnings: [],
		});

		runWatch(TEST_DIR);
		vi.clearAllMocks();

		vi.mocked(generate).mockReturnValueOnce({
			generated: 0,
			skipped: 0,
			errors: [
				{ filePath: 'bad.prompt.md', message: 'Syntax error', type: 'parse' },
			],
			warnings: [],
		});

		mockWatcherCallbacks.all('change', '/path/to/bad.prompt.md');
		vi.advanceTimersByTime(300);

		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('ERROR'),
		);
	});

	it('handles add, change, and unlink events', () => {
		runWatch(TEST_DIR);

		for (const event of ['add', 'change', 'unlink']) {
			vi.clearAllMocks();
			mockWatcherCallbacks.all(event, `/path/to/${event}.prompt.md`);
			vi.advanceTimersByTime(300);

			expect(generate).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining(`File ${event}`),
			);
		}
	});
});
