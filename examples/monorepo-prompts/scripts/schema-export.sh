#!/usr/bin/env bash
set -euo pipefail
mkdir -p schemas
echo "Exporting schemas..."
prompt-opm schema > schemas/all-schemas.json
echo "Schemas exported to schemas/"
