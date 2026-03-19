---
title: Schema Mapper
teleport:
  file: src/core/SchemaMapper/index.ts
  line: 6
  highlight: mapTypeToZod
actions:
  - label: Run tests
    command: npx vitest run src/core/SchemaMapper/index.test.ts
validate:
  command: npx vitest run src/core/SchemaMapper/index.test.ts --reporter=silent 2>&1 | grep -q "pass"
  hint: SchemaMapper tests should pass before moving on
required: true
---

# Schema Mapper

## How it works
The `mapTypeToZod` function converts the simple type declarations from frontmatter into Zod schema code strings. It handles primitive types (`string`, `number`, `boolean`), arrays (both `string[]` shorthand and nested `[type]` syntax), enums (`enum(a,b,c)`), and nested objects.

## Key functions
- `mapSchemaToZodObjectString` (line 43) handles the object case, iterating over key-value pairs and supporting optional fields via the `key?` convention (trailing question mark). It produces formatted `z.object({...})` strings with proper indentation.
- This stage is purely a string-to-string transformation -- it produces TypeScript source code that will be written to disk by the Emitter.

## Key details
- Unknown types trigger a clear error message to guide the user.
- Optional fields are detected by the trailing `?` on the key name and wrapped with `.optional()` in the generated Zod code.
- The output is raw TypeScript source, not runtime Zod objects.
