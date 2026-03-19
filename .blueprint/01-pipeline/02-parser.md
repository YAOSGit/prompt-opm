---
title: Parser
teleport:
  file: src/core/Parser/index.ts
  line: 32
  highlight: parsePromptFile
actions:
  - label: Run tests
    command: npx vitest run src/core/Parser/index.test.ts
validate:
  command: npx vitest run src/core/Parser/index.test.ts --reporter=silent 2>&1 | grep -q "pass"
  hint: Parser tests should pass before moving on
required: true
---

# Parser

## How it works
The `parsePromptFile` function takes raw file content and a file path, then splits it into structured data. It uses the toolkit's `parseFrontmatter` with a Zod schema (`FrontMatterSchema`, line 16) to validate the YAML frontmatter block.

## Schema structure
The frontmatter schema requires a `model` field (unless `snippet: true`), and supports optional `version`, `config`, `inputs`, and `outputs` fields. The inputs/outputs use a recursive `SchemaValueSchema` (line 6) that allows nested objects and arrays.

## Key details
- After parsing the frontmatter, it extracts `variables` (e.g., `{{ name }}`) and `snippets` (e.g., `{{ @shared }}`) from the body using regex patterns.
- The result is a `PromptFile` object ready for snippet resolution and schema mapping.
- Invalid frontmatter triggers a Zod validation error with a clear message pointing to the offending field.
