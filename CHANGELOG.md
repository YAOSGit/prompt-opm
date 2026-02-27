# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-26

### Added
- Token estimation in generated meta (`tokenEstimate`, `inputTokenEstimate`)
- Token estimates stored in manifest entries for incremental builds
- Error collection in `analyze()` — returns `AnalyzeResult.errors` instead of silently swallowing parse failures
- `analyze` and `schema` CLI commands
- Inline snapshot tests for emitter output
- Malformed YAML edge case tests for parser
- Stress test for 50-file generate pipeline
- Coverage reporting configuration (v8 provider, no threshold)
- Library API reference in README

### Changed
- `ManifestEntry` type now includes `tokenEstimate` and `inputTokenEstimate` fields
- `AnalyzeResult` type now includes `errors: DiagnosticError[]` field
- Complex nested objects supported in `inputs` and `outputs` schema definitions

### Fixed
- 7 type errors in test mocks missing `tokenEstimate` and `inputTokenEstimate` fields
- Possibly-undefined access on `jsonCall` in analyze command test
- Silent `catch {}` in `analyzer.ts` now collects and returns errors

## [0.1.0] - 2026-02-26

### Added
- Initial release of prompt-opm, an Object Prompt Mapper for LLM prompts
- CLI tool with commands:
  - `init` - Scaffold a `.prompts/` directory with example files and configuration
  - `generate` - Compile `.prompt.md` files into type-safe TypeScript modules
  - `validate` - Dry-run validation to check for errors without generating files
  - `diff` - Preview changes before generation
  - `watch` - Watch mode for automatic regeneration on file changes
- Core features:
  - YAML frontmatter parsing for prompt metadata (model, temperature, variables, output schema)
  - Zod schema generation from TypeScript type annotations
  - Snippet support with recursive `{{ @snippet }}` resolution
  - Automatic version management with content-based hashing
  - Incremental builds using manifest-based change detection
  - Barrel file generation for clean imports
- Library exports for programmatic usage:
  - `generate()` - Run the generation pipeline
  - `parsePrompt()` - Parse a single `.prompt.md` file
  - `scanPromptFiles()` - Find all prompt files in a directory
  - `PromptConfig` and `GenerateResult` types
- Comprehensive test suite:
  - Unit tests for core functionality
  - Type tests for TypeScript inference
  - End-to-end tests for CLI commands
- Documentation:
  - Full README with quick start guide, API reference, and examples
  - Example project demonstrating usage patterns

### Technical Details
- Built with TypeScript (ESM modules)
- Requires Node.js 22+
- Uses esbuild for fast builds
- Biome for linting and formatting
- Vitest for testing
- Zod as a peer dependency for runtime validation
