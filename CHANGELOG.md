# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
