# Integration Example

This example demonstrates a monorepo-style prompt-opm setup with nested directories, multiple prompt categories, and shell scripts for different workflows.

## Features

- **8 prompts** organized in nested directories (`user/`, `content/`, `analysis/`)
- **2 reusable snippets** (`brand-voice`, `safety`) for consistent voice and guardrails across prompts
- **Multiple models** — `gpt-4o`, `gpt-4o-mini`, and `claude-3-opus` with tuned temperature configs
- **Enum and complex output types** — severity enums, array outputs, numeric ratings
- **Shell scripts** for different workflows (generate, validate, diff, analyze, schema export)

## Directory Structure

```
integration/
├── .prompt-opm.config.json
├── .prompts/
│   ├── snippets/
│   │   ├── brand-voice.prompt.md
│   │   └── safety.prompt.md
│   ├── user/
│   │   ├── onboarding-email.prompt.md
│   │   └── password-reset.prompt.md
│   ├── content/
│   │   ├── blog-outline.prompt.md
│   │   └── social-post.prompt.md
│   └── analysis/
│       ├── code-review.prompt.md
│       └── bug-classify.prompt.md
├── src/generated/prompts/
├── scripts/
│   ├── generate.sh
│   ├── validate.sh
│   ├── diff.sh
│   ├── analyze-json.sh
│   └── schema-export.sh
└── schemas/
```

## Scripts

Run any of the following from the `integration/` directory:

```bash
# Generate TypeScript modules from prompts
./scripts/generate.sh

# Validate all prompt files
./scripts/validate.sh

# Check for changes between prompts and generated output
./scripts/diff.sh

# Analyze prompts and output as JSON
./scripts/analyze-json.sh

# Export all prompt schemas to schemas/
./scripts/schema-export.sh
```
