---
title: What is prompt-opm?
teleport:
  file: src/cli/index.ts
  line: 13
  highlight: runCLI
actions:
  - label: View help
    command: node dist/cli.js --help
validate:
  command: test -f src/cli/index.ts
  hint: Make sure you are in the prompt-opm project root
required: true
---

# What is prompt-opm?

## What it does
prompt-opm is a local-first Object Prompt Mapper that compiles `.prompt.md` files into type-safe TypeScript modules with Zod schemas. Each prompt file declares its model, input/output schemas, and template body in a single Markdown file with YAML frontmatter.

## How it works
The `runCLI` function registers seven subcommands: `init` (scaffold project), `generate` (compile to TS), `watch` (incremental rebuild), `validate` (check without emitting), `diff` (preview changes), `analyze` (metrics and dependency graph), and `schema` (export JSON Schema).

## Key concepts
- The generated TypeScript exports a `prompt()` function that validates inputs against the Zod schema at runtime and interpolates variables into the template body.
- Each `.prompt.md` file is self-contained: model config, schemas, and template in one place.
- The compilation pipeline is: scan, parse, resolve snippets, map schemas, emit TypeScript.
