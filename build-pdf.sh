#!/usr/bin/env bash
# Build REPORT.md into REPORT.pdf with pandoc + XeLaTeX. Styling lives in
# pdf/header.tex; markdown extras (alerts, <br>, tables) are pdf/*.lua.
set -euo pipefail

cd "$(dirname "$0")"

INPUT="${1:-REPORT.md}"
OUTPUT="${2:-${INPUT%.md}.pdf}"

pandoc "$INPUT" \
  --from markdown+alerts \
  --lua-filter=pdf/alerts.lua \
  --lua-filter=pdf/linebreaks.lua \
  --lua-filter=pdf/table-widths.lua \
  --lua-filter=pdf/tables.lua \
  --pdf-engine=xelatex \
  --include-in-header=pdf/header.tex \
  --shift-heading-level-by=-1 \
  --number-sections \
  --toc \
  --toc-depth=3 \
  -V documentclass=scrartcl \
  -V papersize=a4 \
  -V geometry:margin=1in \
  -V geometry:includehead \
  -V geometry:includefoot \
  -V linestretch=1.5 \
  -V fontsize=12pt \
  -V mainfont="Palatino" \
  -V colorlinks=true \
  -o "$OUTPUT"

echo "Wrote $OUTPUT"
