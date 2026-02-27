<h1 align="center">Yet another Open Source prompt-opm</h1>

<p align="center">
  <strong>A local-first "Object Prompt Mapper" for type-safe LLM prompts</strong>
</p>

<div align="center">

![Node Version](https://img.shields.io/badge/NODE-22+-16161D?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=%235FA04E)
![TypeScript Version](https://img.shields.io/badge/TYPESCRIPT-5.9-16161D?style=for-the-badge&logo=typescript&logoColor=white&labelColor=%233178C6)
![Zod](https://img.shields.io/badge/ZOD-16161D?style=for-the-badge&logo=zod&logoColor=white&labelColor=%233E67B1)

![Uses Vitest](https://img.shields.io/badge/VITEST-16161D?style=for-the-badge&logo=vitest&logoColor=white&labelColor=%236E9F18)
![Uses Biome](https://img.shields.io/badge/BIOME-16161D?style=for-the-badge&logo=biome&logoColor=white&labelColor=%2360A5FA)

</div>

---

## Table of Contents

### Getting Started

- [Overview](#overview)
- [Key Features](#key-features)
- [Quick Start](#quick-start)

### Prompt Files

- [Prompt File Format](#prompt-file-format)
- [Snippets](#snippets)

### Usage

- [CLI Commands](#cli-commands)
- [Generated Output](#generated-output)
- [Versioning](#versioning)
- [Configuration](#configuration)

### API

- [Library API](#library-api)

---

## Overview

**prompt-opm** compiles `.prompt.md` files into type-safe TypeScript modules with Zod validation. Write prompts in Markdown with YAML frontmatter, and the compiler generates importable objects with validated input/output schemas, model configs, and a ready-to-use `prompt()` function.

---

## Key Features

- **Compile-Time Safety**: Generates Zod schemas and TypeScript types from your prompt definitions.
- **Git-Centric**: Your `.prompts/` directory lives in your repository. No external database.
- **Modular Snippets**: Compose prompts from reusable fragments with `{{ @snippet }}` syntax.
- **Incremental Builds**: Content-hash manifest skips unchanged files. Only dirty files recompile.
- **Auto-Versioning**: The CLI detects changes and bumps versions automatically (patch for body changes, minor for schema changes).
- **Lightweight**: Two runtime dependencies (`yaml`, `chokidar`). Zod is a peer dependency.

---

## Quick Start

```bash
# Install
npm install -D @yaos-git/prompt-opm
npm install zod

# Scaffold project
npx prompt-opm init

# Compile prompts to TypeScript
npx prompt-opm generate
```

---

## Prompt File Format

Create `.prompt.md` files in your `.prompts/` directory:

```markdown
---
model: "gemini-1.5-pro"
version: "1.0.0"
config:
  temperature: 0.7
  maxTokens: 1024
inputs:
  name: string
  traits: string[]
outputs:
  bio: string
---
{{ @persona_expert }}
Write a bio for {{ name }} with these traits: {{ traits }}.
```

### Supported Types

| Frontmatter syntax     | Generated Zod schema             |
|-------------------------|----------------------------------|
| `string`                | `z.string()`                     |
| `number`                | `z.number()`                     |
| `boolean`               | `z.boolean()`                    |
| `string[]`              | `z.array(z.string())`            |
| `number[]`              | `z.array(z.number())`            |
| `enum(a, b, c)`         | `z.enum(["a", "b", "c"])`       |

### Config Fields

Known optional fields (extras allowed):

- `temperature: number`
- `topK: number`
- `topP: number`
- `maxTokens: number`

---

## Snippets

Compose prompts from reusable fragments.

**Root snippet** (resolves from `.prompts/` root):
```
{{ @persona_expert }}
```

**Relative snippet** (resolves from current file's directory):
```
{{ @.local_helper }}
```

Snippets are resolved recursively. Circular dependencies are detected and reported. Input variables from snippets are merged with the root prompt's inputs (same name + same type = ok, different type = error).

Snippets cannot declare `outputs` — only the root prompt defines the response schema.

### Snippet-Only Files

Mark a prompt as `snippet: true` to prevent it from being compiled into its own module:

```yaml
---
model: "gemini-1.5-pro"
snippet: true
---
You are an expert copywriter.
```

Snippet-only files are still available for `{{ @name }}` references but won't appear in the generated output or barrel `index.ts`.

---

## CLI Commands

```bash
prompt-opm init        # Scaffold .prompts/ directory and config
prompt-opm generate    # Compile .prompt.md files to TypeScript
prompt-opm watch       # Watch for changes and regenerate
prompt-opm validate    # Check for errors without emitting files
prompt-opm diff        # Preview what would change
```

---

## Generated Output

Each `.prompt.md` compiles to a `.ts` file:

```typescript
import { z } from "zod";

export const model = "gemini-1.5-pro" as const;
export const configs = { temperature: 0.7, maxTokens: 1024 } as const;
export const meta = { version: "1.0.0", ... } as const;

export const inputSchema = z.object({
  name: z.string(),
  traits: z.array(z.string()),
});
export type InputType = z.infer<typeof inputSchema>;

export const outputSchema = z.object({ bio: z.string() });
export type OutputType = z.infer<typeof outputSchema>;

export const template = `...`;  // Snippets resolved, variables intact
export const prompt = (inputs: InputType): string => { ... };
```

### Usage in Application Code

```typescript
import * as bioPrompt from "./generated/prompts/generateBio";

// 1. Validate input
const variables = bioPrompt.inputSchema.parse({
  name: "Alice",
  traits: ["witty", "coder"],
});

// 2. Build the prompt string
const promptText = bioPrompt.prompt(variables);

// 3. Call your LLM
const llmResult = await myLLMClient({
  model: bioPrompt.model,
  prompt: promptText,
  ...bioPrompt.configs,
});

// 4. Validate output
const data = bioPrompt.outputSchema.parse(llmResult);
```

A barrel `index.ts` is generated for convenient imports:

```typescript
import { generateBio, translateEmail } from "@prompts";
```

---

## Versioning

Versions are declared in frontmatter and auto-bumped by `prompt-opm generate`:

- **Patch bump** (`1.0.0` -> `1.0.1`): Body or config changed, but inputs/outputs schema is the same.
- **Minor bump** (`1.0.0` -> `1.1.0`): Inputs or outputs schema changed (potential breaking change for consumers).

The CLI writes the bumped version back into the source `.prompt.md` file, so the change appears in your git diff.

---

## Configuration

`.prompt-opm.config.json`:

```json
{
  "source": "./.prompts",
  "output": "./src/generated/prompts",
  "manifest": "./.prompt-opm"
}
```

| Field | Required | Default | Description |
|---|---|---|---|
| `source` | yes | — | Directory containing `.prompt.md` files |
| `output` | yes | — | Directory for generated `.ts` files |
| `manifest` | no | same as `output` | Directory for the `.prompt-opm.manifest.json` cache file |

---

## Library API

Use `prompt-opm` programmatically by importing from `@yaos-git/prompt-opm`:

```typescript
import { generate, parsePromptFile, analyze } from "@yaos-git/prompt-opm";
```

### Core Pipeline

| Function | Signature | Description |
|----------|-----------|-------------|
| `generate` | `(config: OpmConfig) => GenerateResult` | Run the full compilation pipeline |
| `analyze` | `(config: OpmConfig) => AnalyzeResult` | Analyze prompts without emitting files |
| `parsePromptFile` | `(content: string, filePath: string) => PromptFile` | Parse a single `.prompt.md` file |
| `scanPromptFiles` | `(sourceDir: string) => string[]` | Recursively find all `.prompt.md` files |
| `resolveSnippets` | `(file: PromptFile, sourceRoot: string) => ResolvedPrompt` | Resolve `{{ @snippet }}` references |

### Schema & Emitter

| Function | Signature | Description |
|----------|-----------|-------------|
| `mapTypeToZod` | `(type: SchemaValue) => string` | Convert a type string to Zod code |
| `mapSchemaToZodObjectString` | `(schema: Record<string, SchemaValue>) => string` | Convert a full schema to `z.object(...)` string |
| `generateFileContent` | `(input: EmitInput) => string` | Generate a TypeScript module string |
| `generateBarrelContent` | `(moduleNames: string[]) => string` | Generate barrel `index.ts` content |

### Versioning & Hashing

| Function | Signature | Description |
|----------|-----------|-------------|
| `bumpVersion` | `(version: string, type: BumpType) => string` | Bump a semver string |
| `determineVersionBump` | `(prev: ManifestEntry, ...) => BumpType \| null` | Decide if a version bump is needed |
| `hashContent` | `(content: string) => string` | SHA256 hash of file content |
| `hashInputsOutputs` | `(inputs?, outputs?) => string` | Deterministic hash of schema fields |

### Manifest

| Function | Signature | Description |
|----------|-----------|-------------|
| `loadManifest` | `(dir: string) => ManifestData` | Load `.prompt-opm.manifest.json` |
| `saveManifest` | `(dir: string, data: ManifestData) => void` | Save manifest to disk |

### Types

All types are exported for library consumers:

```typescript
import type {
  OpmConfig,
  PromptFile,
  FrontMatter,
  Config,
  SchemaValue,
  ManifestEntry,
  ManifestData,
  DiagnosticError,
  PromptAnalysis,
  AnalyzeResult,
  GenerateResult,
  ResolvedPrompt,
  EmitInput,
  BumpType,
  DependencyGraph,
  DependencyNode,
} from "@yaos-git/prompt-opm";
```

---

## License

ISC
