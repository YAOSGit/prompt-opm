---
title: Emitter
teleport:
  file: src/core/Emitter/index.ts
  line: 43
  highlight: generateFileContent
actions:
  - label: Run tests
    command: npx vitest run src/core/Emitter/index.test.ts
validate:
  command: npx vitest run src/core/Emitter/index.test.ts --reporter=silent 2>&1 | grep -q "pass"
  hint: Emitter tests should pass before moving on
required: true
---

# Emitter

## How it works
The `generateFileContent` function is the final pipeline stage. It takes an `EmitInput` object and produces a complete TypeScript file as a string. The output includes: the `model` constant, `configs` object, `meta` data, Zod `inputSchema` and `outputSchema`, inferred `InputType` and `OutputType` types, the raw `template` string, and a `prompt()` function.

## Template interpolation
The generated `prompt()` function validates inputs with `inputSchema.parse()`, then interpolates variables into the template. It handles both simple `{{ key }}` variables and variables with defaults `{{ key | "fallback" }}`.

## Key details
- `generateBarrelContent` (line 97) creates an `index.ts` barrel file that re-exports all generated prompt modules as named namespaces, giving consumers a single import point.
- Each generated file is self-contained with all its imports, schemas, and the prompt function.
