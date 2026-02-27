import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		projects: [
			'./vitest.unit.config.ts',
			'./vitest.type.config.ts',
			'./vitest.e2e.config.ts',
		],
		coverage: {
			include: ['src/**/*.ts'],
			exclude: [
				'e2e/**',
				'src/cli/**',
				'node_modules/**',
				'**/*.test.ts',
				'**/*.test-d.ts',
			],
		},
	},
});
