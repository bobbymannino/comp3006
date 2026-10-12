#!/usr/bin/env bash
# Build REPORT.md into REPORT.pdf with pandoc + XeLaTeX.
set -euo pipefail

cd "$(dirname "$0")"

INPUT="${1:-REPORT.md}"
OUTPUT="${2:-${INPUT%.md}.pdf}"

pandoc "$INPUT" \
  --from markdown+alerts \
  --lua-filter=pdf/alerts.lua \
  --lua-filter=pdf/linebreaks.lua \
  --lua-filter=pdf/table-widths.lua \
  --pdf-engine=xelatex \
  --include-in-header=pdf/header.tex \
  --shift-heading-level-by=-1 \
  --toc \
  --toc-depth=3 \
  -V lof=true \
  -V lot=true \
  -V classoption=table \
  -V papersize=a4 \
  -V geometry:margin=1in \
  -V linestretch=1.5 \
  -V fontsize=12pt \
  -V mainfont="Palatino" \
  -V colorlinks=true \
  -V linkcolor=black \
  -V toccolor=black \
  -o "$OUTPUT"

echo "Wrote $OUTPUT"
