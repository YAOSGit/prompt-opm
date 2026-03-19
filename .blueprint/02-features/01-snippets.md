---
title: Snippet Resolution
teleport:
  file: src/core/SnippetResolver/index.ts
  line: 13
  highlight: resolveSnippets
actions:
  - label: Run tests
    command: npx vitest run src/core/SnippetResolver/index.test.ts
validate:
  command: npx vitest run src/core/SnippetResolver/index.test.ts --reporter=silent 2>&1 | grep -q "pass"
  hint: SnippetResolver tests should pass before moving on
required: true
---

# Snippet Resolution

## The problem
Prompts often share common instructions or context. Without a reuse mechanism, you end up duplicating text across prompt files, making maintenance painful.

## The solution
The `resolveSnippets` function recursively inlines snippet references (`{{ @name }}`) in prompt bodies. It supports two reference styles: `@name` resolves from the source root, and `@.name` resolves relative to the importing file.

## How it works
- Circular dependency detection uses a `visited` Set of absolute paths (line 19). If a snippet path appears twice in the resolution chain, it throws with the full cycle path for easy debugging. Each recursive call creates a new Set copy to handle diamond dependencies correctly.
- Snippet inputs are merged into the parent's input schema, with conflict detection -- if the same variable is declared with different types in two snippets, it throws a clear error.
- Snippet `outputs` are explicitly ignored with a warning, since only root prompts can define output schemas.
