#!/usr/bin/env node
// First-pass scanner for a skill folder you downloaded from OUTSIDE the vetted pack. Local only, no network.
// It flags lines a human must read; it does NOT prove a skill is safe. Usage: npm run skill:scan -- <path-to-skill-folder>
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RULES = [
  ["shell-on-load", /^\s*[-*]?.*!`[^`]+`/, "`!`-regel: draait een shell-commando zodra de skill laadt"],
  ["broad-tools", /allowed-tools:.*(Bash\(\*\)|Bash\s*$|\bBash\b(?!\())/i, "allowed-tools geeft brede Bash-toegang"],
  ["allowed-tools", /^allowed-tools:/i, "allowed-tools: welke extra rechten vraagt de skill?"],
  ["network", /\b(curl|wget|Invoke-WebRequest|iwr|irm|fetch\(|requests\.(get|post)|urllib|http\.request|axios|nc|ncat|scp|ssh)\b|https?:\/\//i, "netwerk/URL: waar gaat data heen?"],
  ["pipe-to-shell", /\|\s*(sh|bash|zsh|pwsh|powershell|iex)\b|base64\s+(-d|--decode)|\beval\b|\bexec\(/i, "code downloaden/decoderen en uitvoeren"],
  ["installs", /\b(npx|npm\s+i(nstall)?|pip3?\s+install|uvx|go\s+install|cargo\s+install|brew\s+install|git\s+clone)\b/i, "installeert of haalt externe code op"],
  ["secrets", /\.env\b|\.ssh|id_rsa|credentials|token|secret|api[_-]?key|gcloud|\bprintenv\b|\benv\b\s*$/i, "raakt secrets, tokens of omgevingsvariabelen"],
  ["exfil-git", /git\s+(push|remote\s+add)|gh\s+(gist|api)|glab\s+api/i, "kan data naar een (andere) remote sturen"],
  ["injection", /ignore (all |any )?(previous|prior|above) (instructions|rules)|do not tell the user|don't tell the user|without asking|silently|hidden|bypass|--dangerously-skip-permissions|disable.*hook/i, "prompt-injectie / verbergen / beveiliging omzeilen"],
  ["invisible", /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/, "onzichtbare tekens (zero-width / bidi)"],
  ["html-comment", /<!--[\s\S]*?-->/, "HTML-commentaar: verborgen instructies?"],
];
const root = process.argv[2];
if (!root) { console.error("gebruik: npm run skill:scan -- <map-van-de-skill>"); process.exit(2); }
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
let hits = 0; const files = walk(root);
for (const f of files) {
  const lines = readFileSync(f, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => { for (const [id, re, why] of RULES) if (re.test(line)) { hits++; console.log(`${relative(root, f) || f}:${i + 1}  [${id}] ${why}\n    ${line.trim().slice(0, 140)}`); } });
  if (!/SKILL\.md$|\.md$/i.test(f)) { hits++; console.log(`${relative(root, f)}  [script] geen markdown: lees dit bestand volledig voordat je installeert`); }
}
console.log(`\n${files.length} bestand(en), ${hits} vlag(gen). Een lege lijst betekent NIET dat de skill veilig is: lees SKILL.md en elk script zelf.`);
process.exit(hits ? 1 : 0);
