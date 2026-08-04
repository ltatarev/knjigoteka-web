#!/usr/bin/env node
/**
 * Turns a notion-sync run report into a pull request title and body.
 *
 *   node .github/scripts/pr-body.mjs sync-report.json pr-body.md pr-title.txt
 *
 * Both are written to files rather than returned through a step output. The
 * title contains a Notion page title, which is writer-controlled text: routed
 * through `${{ }}` interpolation it would be pasted straight into a shell
 * command, and a title carrying a newline would corrupt $GITHUB_OUTPUT.
 *
 * The audience is the one technical person who merges these, but the text is
 * Croatian throughout: a writer who gets linked to the PR to check their own
 * post should be able to read it. Nothing here uses git vocabulary.
 */

import fs from 'node:fs/promises';

const [reportPath, bodyPath, titlePath] = process.argv.slice(2);
if (!reportPath || !bodyPath || !titlePath) {
  console.error('usage: pr-body.mjs <report.json> <body.md> <title.txt>');
  process.exit(1);
}

const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
const posts = report.posts ?? [];
const unpublished = report.unpublished ?? [];
const failures = report.failures ?? [];

// "Nova objava: {naslov}" is the agreed shape. A run that gathered several
// pages still gets one PR, so the extras are counted rather than listed —
// a title long enough to be truncated by GitHub tells nobody anything.
//
// A run that only revises already-published posts says so instead. Calling a
// correction a new post trains the reviewer to stop reading the title.
const noun = posts.length && posts.every((p) => !p.isNew) ? 'Izmjena objave' : 'Nova objava';

// A run that only takes posts down must say so in the title. The whole review
// turns on it: "Nova objava" over a pull request that deletes a live post is
// the one mislabelling that could get a removal merged unnoticed.
const headline = posts.length
  ? { noun, items: posts }
  : { noun: 'Skrivanje objave', items: unpublished };

// A removed post can have lost its title along the way — the slug is the one
// thing it is guaranteed to still have, and it is what the reviewer sees in
// the diff anyway.
const name = (item) => item.title ?? item.slug;

// The empty case should be unreachable — the job only builds a PR when the
// sync actually changed something — but a crash here would lose a real post to
// a formatting bug, so fall back instead of throwing.
const title =
  headline.items.length === 0
    ? 'Sinkronizacija iz Notiona'
    : headline.items.length === 1
      ? `${headline.noun}: ${name(headline.items[0])}`
      : `${headline.noun}: ${name(headline.items[0])} (+${headline.items.length - 1})`;

const lines = [];

lines.push('Ovo je automatski pripremljeno iz Notiona.');
lines.push('');
if (posts.length && unpublished.length) {
  lines.push('Kad se ovaj zahtjev spoji, objave niže odlaze na stranicu — a one');
  lines.push('označene kao skrivene nestaju s nje.');
} else if (unpublished.length) {
  lines.push('**Kad se ovaj zahtjev spoji, objave niže nestaju sa stranice.**');
} else {
  lines.push('Kad se ovaj zahtjev spoji, objave odlaze na stranicu.');
}
lines.push('');
// The branch is rebuilt from Notion on every run, so anything typed into it
// here disappears at the next sync. Say so where the person tempted to do it
// will be standing.
lines.push('Ispravke piši u Notionu, ne ovdje — sve što se ovdje upiše');
lines.push('bit će prebrisano pri sljedećoj sinkronizaciji.');
lines.push('');

for (const post of posts) {
  lines.push(`### ${post.title}`);
  lines.push('');
  lines.push(`- Rubrika: **${post.category}**`);
  lines.push(`- Adresa: \`/${post.slug}/\``);
  lines.push(`- Slike: ${post.images}`);
  lines.push(post.isNew ? '- Nova objava' : '- Izmjena postojeće objave');
  if (post.url) lines.push(`- [Otvori u Notionu](${post.url})`);
  lines.push('');

  if (post.warnings.length) {
    // Surfaced per post rather than in one pile at the bottom: "a table was
    // skipped" is only actionable next to the name of the post it came from.
    lines.push('<details><summary>Nešto nije prebačeno na stranicu</summary>');
    lines.push('');
    for (const w of post.warnings) lines.push(`- ${w}`);
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }
}

if (unpublished.length) {
  lines.push('---');
  lines.push('');
  lines.push('### Nestaje sa stranice');
  lines.push('');
  lines.push('U Notionu je status ovih objava prebačen na `Skriveno`, pa se brišu.');
  lines.push('Tekst i slike ostaju u Notionu — objava se vraća tako da se status');
  lines.push('vrati na `Za objavu`, i to na istu adresu kao prije.');
  lines.push('');

  for (const post of unpublished) {
    const notion = post.url ? ` — [otvori u Notionu](${post.url})` : '';
    // "slike: 2" rather than "2 slike": Croatian declines the noun by the count
    // (1 slika, 2 slike, 5 slika), so the label goes first and sidesteps it —
    // the same trick the post blocks above use.
    lines.push(`- **${name(post)}** — adresa \`/${post.slug}/\`, slike: ${post.images}${notion}`);
  }
  lines.push('');
}

if (failures.length) {
  lines.push('---');
  lines.push('');
  lines.push('### Nije objavljeno');
  lines.push('');
  // The status to leave it on depends on what the page was trying to do, so it
  // is not named here — a removal that failed must not be told to go back to
  // `Za objavu`. The writer's own Notion comment names the right one.
  lines.push('Ove stranice nisu prebačene. Popravi ih u Notionu i sinkronizacija');
  lines.push('će ih pokupiti sama u sljedećem krugu — status ostavi kakav je sad.');
  lines.push('');
  for (const f of failures) lines.push(`- **${f.title ?? 'Bez naslova'}** — ${f.message}`);
  lines.push('');
}

await fs.writeFile(bodyPath, `${lines.join('\n')}\n`, 'utf8');
// Collapse whitespace: a pasted title can carry a newline, and a commit
// subject or a PR title is a single line by definition.
await fs.writeFile(titlePath, `${title.replace(/\s+/g, ' ').trim()}\n`, 'utf8');
