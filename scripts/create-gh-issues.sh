#!/usr/bin/env bash
set -euo pipefail

DIR="issues-enhanced"
if [[ ! -d "$DIR" ]]; then
  echo "Missing $DIR with enhanced issue markdown files" >&2
  exit 1
fi

ensure_label() { gh label create "$1" --color "$2" >/dev/null 2>&1 || true; }
ensure_label tech-debt 6e5494
ensure_label phase-1 1f883d
ensure_label phase-2 1f883d
ensure_label phase-3 1f883d
ensure_label phase-4 1f883d
ensure_label magic-numbers fbca04
ensure_label auto-fix fbca04
ensure_label domain-terms fbca04
ensure_label complexity fbca04
ensure_label architecture fbca04

create_issue() {
  local file="$1"
  local base
  base="$(basename "$file")"
  local title
  title="$(sed -n '1s/^# //p;1q' "$file")"

  local labels
  case "$base" in
    01-phase1-magic-numbers.md) labels="tech-debt,phase-1,magic-numbers" ;;
    02-phase1-auto-fix.md)      labels="tech-debt,phase-1,auto-fix" ;;
    03-phase2-domain-terms.md)  labels="tech-debt,phase-2,domain-terms" ;;
    04-phase3-complexity.md)    labels="tech-debt,phase-3,complexity" ;;
    05-phase4-architecture.md)  labels="tech-debt,phase-4,architecture" ;;
    *)                          labels="tech-debt" ;;
  esac

  # Skip duplicates by title
  if gh issue list --json title --search "in:title $title" --jq ".[] | select(.title == \"$title\") | .title" | grep -q .; then
    echo "Skipping existing: $title"
  else
    gh issue create \
      --title "$title" \
      --label "$labels" \
      --body-file "$file"
    echo "Created: $title"
  fi
}

for f in "$DIR"/*.md; do
  [[ "$(basename "$f")" == "00-README.md" ]] && continue
  create_issue "$f"
done
