'use strict';

function usage() {
  console.log(`Usage:
  eslint-plugin-ai-code-snifftest init [--primary=<domain>] [--additional=a,b,c] [--minimumMatch=0.6] [--minimumConfidence=0.7]
  eslint-plugin-ai-code-snifftest learn [--strict|--permissive|--interactive] [--sample=N] [--no-cache] [--apply] [--fingerprint] [--minimumMatch=0.6] [--minimumConfidence=0.7]
  eslint-plugin-ai-code-snifftest scaffold <domain> [--dir=path]

Examples:
  eslint-plugin-ai-code-snifftest init --primary=astronomy --additional=geometry,math,units --minimumMatch=0.65
  eslint-plugin-ai-code-snifftest learn --interactive --sample=300 --minimumConfidence=0.75
  eslint-plugin-ai-code-snifftest scaffold medical --dir=./examples/external/medical
`);
}

module.exports = { usage };
