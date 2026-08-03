#!/usr/bin/env node
/**
 * Renders the maintainer-facing issue body from a sync or publish report.
 *
 *   node .github/scripts/issue-body.mjs sync-report.json <run-url> > body.md
 *
 * The writer gets a comment on their own Notion page; this is the other half of
 * "failure must be loud" — the half aimed at the one person who can fix a
 * problem the writer cannot. It is deliberately a single issue kept up to date
 * rather than one per run: a new issue every 20 minutes is a mute button.
 */

import fs from 'node:fs/promises';

const [reportPath, runUrl] = process.argv.slice(2);
if (!reportPath) {
  console.error('usage: issue-body.mjs <report.json> [run-url]');
  process.exit(1);
}

let report;
try {
  report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
} catch {
  // No report at all means the sync died before it reached Notion, which is
  // itself the thing worth reporting.
  report = { failures: [{ title: null, message: 'Sinkronizacija se srušila prije nego što je došla do Notiona.' }] };
}

const failures = report.failures ?? [];
const lines = [];

lines.push(`Sinkronizacija iz Notiona prijavila je ${failures.length} problem(a).`);
lines.push('');
lines.push('Autorice su o ovome obaviještene komentarom na svojoj Notion stranici.');
lines.push('Ovaj se opis osvježava svaki put — zatvara se sam kad sve prođe.');
lines.push('');

for (const f of failures) {
  lines.push(`- **${f.title ?? 'Bez naslova'}** — ${f.message}`);
}

if (runUrl) {
  lines.push('');
  lines.push(`[Log zadnjeg pokretanja](${runUrl})`);
}

process.stdout.write(`${lines.join('\n')}\n`);
