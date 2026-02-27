import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';

const DEFAULT_CONFIG = {
	source: './.prompts',
	output: './src/generated/prompts',
};

const EXAMPLE_PROMPT = `---
model: "gemini-1.5-pro"
version: "0.1.0"
config:
  temperature: 0.7
  maxTokens: 256
inputs:
  name: string
outputs:
  greeting: string
---
Write a friendly greeting for {{ name }}.
`;

function writeIfMissing(filePath: string, content: string): boolean {
	if (existsSync(filePath)) {
		return false;
	}
	writeFileSync(filePath, content, 'utf-8');
	return true;
}

export function runInit(cwd: string): void {
	const promptsDir = join(cwd, '.prompts');
	mkdirSync(promptsDir, { recursive: true });

	const configPath = join(cwd, '.prompt-opm.config.json');
	const configCreated = writeIfMissing(
		configPath,
		`${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`,
	);

	const examplePath = join(promptsDir, 'hello.prompt.md');
	const exampleCreated = writeIfMissing(examplePath, EXAMPLE_PROMPT);

	if (configCreated || exampleCreated) {
		console.log(chalk.green('Initialized prompt-opm project:'));
		if (configCreated) console.log(`  ${chalk.dim('→')} ${configPath}`);
		if (exampleCreated) console.log(`  ${chalk.dim('→')} ${examplePath}`);
	} else {
		console.log(chalk.dim('Already initialized — no files created.'));
	}
}
