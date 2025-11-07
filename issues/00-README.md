# How to Create Issues from These Files

This directory contains issue files generated from ESLint analysis. It deliberately does not create tracker issues via API.

## Option 1: Create Manually
Copy each .md into your tracker as a new issue, edit, then submit.

## Option 2: GitHub CLI (Bulk)
```bash
for file in issues/*.md; do
  if [ "$file" = "issues/00-README.md" ]; then continue; fi
  title=$(head -n1 "$file" | sed "s/^# //")
  gh issue create --title "$title" --body-file "$file" --label "lint,tech-debt,dogfood"
done
```
