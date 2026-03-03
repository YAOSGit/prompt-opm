#!/usr/bin/env bash
set -euo pipefail
echo "Generating prompt modules..."
prompt-opm generate
echo "Done! Generated files in src/generated/prompts/"
