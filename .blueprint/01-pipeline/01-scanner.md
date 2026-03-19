---
title: Scanner
teleport:
  file: src/core/Scanner/index.ts
  line: 4
  highlight: scanPromptFiles
actions:
  - label: Run tests
    command: npx vitest run src/core/Scanner/index.test.ts
validate:
  command: npx vitest run src/core/Scanner/index.test.ts --reporter=silent 2>&1 | grep -q "pass"
  hint: Scanner tests should pass before moving on
required: true
---

# Scanner

## How it works
The `scanPromptFiles` function is the first stage of the compilation pipeline. It takes a source directory path, resolves it to an absolute path, and recursively walks the file tree looking for files ending in `.prompt.md`. The implementation uses a simple recursive `walk` function (line 8) with `readdirSync` and `withFileTypes` for efficient directory traversal.

## Data flow
It returns an array of absolute file paths that feed into the parser stage. This is the entry point for both `generate` and `watch` commands.

## Key details
- The scanner is intentionally simple and synchronous -- it runs once at the start of a generate or watch cycle, and the file count is typically small enough that async I/O would add complexity without meaningful performance gain.
- Only files ending in `.prompt.md` are matched; other Markdown files are ignored.
