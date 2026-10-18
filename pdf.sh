#!/usr/bin/env bash
# Render every .mmd diagram and rebuild the PDF for every .md file (except
# README) that git sees as changed: modified, staged, or untracked. Diagrams
# render first (in parallel) so PDFs pick up the new PNGs, then PDFs build in
# parallel.
set -euo pipefail

BUILD_PDF="$HOME/Desktop/pdf/build-pdf.sh"
ROOT="$(git -C "$(dirname "$0")/documents" rev-parse --show-toplevel)"
cd "$ROOT"

changed=()
while IFS= read -r -d '' file; do
  [[ -f "$file" ]] && changed+=("$file") # skip deleted
done < <(
  {
    git diff --name-only -z HEAD
    git ls-files -z --others --exclude-standard
  } | sort -zu
)

# Wait for every pid in "$@" and set $failed to how many exited non-zero.
wait_all() {
  local pid
  failed=0
  for pid in "$@"; do
    wait "$pid" || failed=$((failed + 1))
  done
}

pids=()
diagrams=()
for file in ${changed[@]+"${changed[@]}"}; do
  [[ "$file" == *.mmd ]] || continue
  # mmdc -i "$file" -s 3 -o "${file%.mmd}.png" &
  mmdr -i "$file" -o "${file%.mmd}.png" &
  pids+=($!)
  diagrams+=("$file")
done

wait_all ${pids[@]+"${pids[@]}"}
echo "Rendered $((${#diagrams[@]} - failed)) diagram(s)"
((failed)) && { echo "$failed diagram(s) failed" >&2; exit 1; }

pids=()
built=()
for file in ${changed[@]+"${changed[@]}"}; do
  [[ "$file" == *.md ]] || continue
  name="$(basename "$file" | tr '[:upper:]' '[:lower:]')"
  [[ "$name" == "readme.md" ]] && continue

  "$BUILD_PDF" "$ROOT/$file" &
  pids+=($!)
  built+=("$ROOT/${file%.md}.pdf")
done

wait_all ${pids[@]+"${pids[@]}"}
echo "Built $((${#built[@]} - failed)) PDF(s)"
((failed)) && { echo "$failed build(s) failed" >&2; exit 1; }

if ((${#built[@]})); then
  open "${built[@]}"
fi
