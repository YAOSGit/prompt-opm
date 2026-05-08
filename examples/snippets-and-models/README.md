# Custom Example

This example demonstrates advanced prompt-opm features including custom snippets, multiple models, and complex schemas.

## Features

- **Reusable snippets** — `persona` and `format-rules` snippets are composed into prompts using the `{{ @snippet }}` syntax
- **Multiple LLM models** — Prompts target different models: `gpt-4o`, `claude-3-opus`, and `gpt-4o-mini`
- **Complex input types** — Uses `object`, `boolean`, and `number` inputs alongside `string`
- **Enum output types** — The sentiment prompt defines an enum output for classification (`positive`, `negative`, `neutral`, `mixed`)

## Prompts

| Prompt       | Model          | Description                          |
|--------------|----------------|--------------------------------------|
| summarize    | gpt-4o         | Summarizes content with style control |
| translate    | claude-3-opus  | Translates text with glossary support |
| sentiment    | gpt-4o-mini    | Classifies text sentiment             |

## Usage

Generate the TypeScript modules:

```bash
prompt-opm generate
```

Then import and use the generated modules in your code. See `usage.ts` for examples.
