---
title: Try It Out
teleport:
  file: src/cli/index.ts
  line: 21
  highlight: runInit
actions:
  - label: Initialize project
    command: node dist/cli.js init
  - label: Generate TypeScript
    command: node dist/cli.js generate
validate:
  command: test -f dist/cli.js
  hint: Run npm run build first to produce the dist output
required: false
---

# Try It Out

## What to do
Start by running `node dist/cli.js init` to scaffold a `.prompts/` directory with an example `.prompt.md` file and a config file. Then run `node dist/cli.js generate` to compile the prompts into TypeScript. Use the actions above to try both commands.

## What to expect
The `init` command creates the directory structure and a starter prompt. The `generate` command runs the full pipeline: scan for `.prompt.md` files, parse frontmatter and body, resolve snippets, map schemas to Zod, and emit TypeScript output files. After generating, check the output directory for the compiled `.ts` files with their exported `prompt()` functions.
