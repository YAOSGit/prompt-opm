---
title: Incremental Builds
teleport:
  file: src/manifest/manifest.ts
  line: 7
  highlight: loadManifest
actions:
  - label: View hasher
    command: cat src/manifest/hasher.ts
validate:
  command: test -f src/manifest/manifest.ts
  hint: Ensure you are in the prompt-opm project root
required: false
---

# Incremental Builds

## The problem
Re-compiling every prompt file on each run is wasteful when only a few files have changed. This becomes noticeable as the number of prompt files grows.

## The solution
The manifest system enables incremental builds by tracking content hashes. `loadManifest` reads a `.prompt-opm.manifest.json` file from the output directory that stores a `generatedAt` timestamp and a `files` map of per-file metadata. On subsequent runs, the generate command compares current hashes against the manifest to skip files that have not changed.

## How it works
- The `hashContent` function in `hasher.ts` computes SHA256 hashes of file content. `hashInputsOutputs` creates a canonical JSON representation of the input/output schemas (with sorted keys for determinism) and hashes that too.
- `saveManifest` writes the updated manifest back after generation completes, ensuring the next run can pick up where it left off.
- This makes `watch` mode efficient even with many prompt files.
