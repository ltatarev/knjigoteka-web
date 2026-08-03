#!/usr/bin/env node
/**
 * Notion → MDX sync (local, manual)
 *
 *   export NOTION_TOKEN=ntn_xxx
 *   export NOTION_DATABASE_ID=xxxxxxxxxxxx
 *
 *   node notion-sync.mjs --list           # what's ready to publish
 *   node notion-sync.mjs --dry-run        # convert, print, write nothing
 *   node notion-sync.mjs                  # write MDX + images
 *   node notion-sync.mjs --page <id|url>  # one specific page
 *   node notion-sync.mjs --report r.json  # also write a machine-readable run report
 *   node notion-sync.mjs --publish a.mdx  # mark merged posts published in Notion
 *
 * Setup:
 *   1. notion.so/my-integrations → new internal integration → copy token
 *   2. Open your database → ••• → Connections → add the integration
 *   3. Copy the database ID from the URL:
 *      notion.so/<workspace>/<DATABASE_ID>?v=<view_id>
 *
 * Requires sharp (a devDependency) for the 1600px WebP image pipeline.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API = process.env.NOTION_API_BASE ?? 'https://api.notion.com/v1';
const TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

/** Notion API version. 2025-09-03 introduced data sources; see resolveDataSource(). */
const NOTION_VERSION = '2025-09-03';

const OUT_POSTS = 'content/posts';
const OUT_IMAGES = 'public/images/posts';

/** Notion property names → what we do with them. Rename here, not in Notion. */
const PROP = {
  title: 'Naslov',
  author: 'Autor',
  category: 'Kategorija',
  excerpt: 'Sažetak',
  cover: 'Naslovna slika',
  status: 'Status',
  slug: 'Slug',
  publishedDate: 'Datum objave',
  publishedUrl: 'Objavljeno na',
};

/** Only pages with this status are synced. */
const STATUS_READY = 'Za objavu';

/** What a page becomes once its post is merged and live. */
const STATUS_PUBLISHED = 'Objavljeno';

/**
 * Where a merged post ends up. Must match app/sitemap.ts: trailingSlash is on,
 * so a URL without the trailing slash 308s to the canonical one, and the link
 * written into Notion is the one a writer clicks to check their own work.
 */
const SITE_URL = (process.env.SITE_URL ?? 'https://knjigoteka.club').replace(/\/+$/, '');

const IMAGE_MAX_WIDTH = 1600;
const IMAGE_QUALITY = 78;

/**
 * Resolved once at startup. Without sharp we keep the original format, and the
 * extension used in markdown must match what actually lands on disk — getting
 * this wrong produces frontmatter pointing at files that don't exist.
 */
let SHARP = null;
let IMG_EXT = 'webp';

// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const flagValue = (f) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : null;
};

const LIST = has('--list');
const DRY_RUN = has('--dry-run');
const ONE_PAGE = flagValue('--page');

/**
 * Where to write the run report. The CI job builds a pull request title and
 * body out of it, so it must describe the run completely — including a run
 * where nothing was ready and a run where every page was rejected. Scraping
 * that back out of the console output would break the moment a log line moved.
 */
const REPORT = flagValue('--report');

/**
 * Write-back mode. Takes the .mdx files a merge put live and marks their Notion
 * pages published. This is the only code in the project that writes to Notion,
 * and it touches exactly two properties — never the page body.
 */
const PUBLISH = has('--publish');
const PUBLISH_FILES = argv.filter((a) => a.endsWith('.mdx'));

/**
 * Wait for each URL to actually resolve before writing it into Notion. The
 * write-back fires on merge, but the site is a static export that takes a
 * couple of minutes to deploy — so without this a writer gets told "objavljeno"
 * and clicks straight through to a 404. Off by default because the post only
 * goes live from the branch the site deploys from.
 */
const VERIFY_LIVE = has('--verify-live');

const warn = (...a) => console.warn('  ⚠ ', ...a);

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Notion allows roughly 3 requests/second. fetchBlocks() recurses through
 * nested blocks and a long post bursts well past that, so every call is queued
 * behind a shared minimum interval rather than fired as fast as it is reached.
 */
const MIN_REQUEST_INTERVAL_MS = 350;
let requestChain = Promise.resolve();
let lastRequestAt = 0;

function throttle() {
  requestChain = requestChain.then(async () => {
    const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
  });
  return requestChain;
}

async function notion(endpoint, { method = 'GET', body } = {}, attempt = 0) {
  await throttle();

  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Notion sends Retry-After on 429. Honour it rather than hammering; a sync
  // that gives up halfway leaves a half-written post behind.
  if (res.status === 429 && attempt < 5) {
    const retryAfter = Number(res.headers.get('retry-after')) || 1;
    warn(`rate limited by Notion — retrying in ${retryAfter}s`);
    await sleep(retryAfter * 1000);
    return notion(endpoint, { method, body }, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) {
      throw new Error(
        `404 from Notion on ${endpoint}\n` +
          `Almost always means the integration hasn't been added to the page/database.\n` +
          `Open it in Notion → ••• → Connections → add your integration.\n\n${text}`
      );
    }
    if (res.status === 401) throw new Error(`401 — check NOTION_TOKEN.\n${text}`);
    throw new Error(`${res.status} from Notion on ${endpoint}\n${text}`);
  }
  return res.json();
}

/**
 * As of API version 2025-09-03 a database is a container holding one or more
 * "data sources", and queries hit /data_sources/:id/query rather than
 * /databases/:id/query. Database IDs and data source IDs are NOT
 * interchangeable, so we look the ID up rather than assuming.
 */
async function resolveDataSource(databaseId) {
  const db = await notion(`/databases/${databaseId}`);
  const sources = db.data_sources ?? [];
  if (!sources.length) {
    throw new Error(`Database ${databaseId} reports no data sources.`);
  }
  if (sources.length > 1) {
    warn(`database has ${sources.length} data sources; using "${sources[0].name}"`);
  }
  return sources[0].id;
}

async function queryReady(dataSourceId) {
  const pages = [];
  let cursor;
  do {
    const res = await notion(`/data_sources/${dataSourceId}/query`, {
      method: 'POST',
      body: {
        filter: { property: PROP.status, status: { equals: STATUS_READY } },
        start_cursor: cursor,
        page_size: 100,
      },
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

/** Notion paginates blocks at 100, and nests them arbitrarily deep. */
async function fetchBlocks(blockId) {
  const blocks = [];
  let cursor;
  do {
    const res = await notion(
      `/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`
    );
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  for (const b of blocks) {
    if (b.has_children) b.children = await fetchBlocks(b.id);
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

function plain(rich = []) {
  return rich.map((t) => t.plain_text).join('');
}

function readProp(page, name) {
  const p = page.properties?.[name];
  if (!p) return undefined;
  switch (p.type) {
    case 'title': return plain(p.title);
    case 'rich_text': return plain(p.rich_text);
    case 'select': return p.select?.name;
    case 'status': return p.status?.name;
    case 'multi_select': return p.multi_select.map((s) => s.name);
    case 'date': return p.date?.start;
    case 'url': return p.url;
    case 'checkbox': return p.checkbox;
    case 'number': return p.number;
    case 'people': return p.people.map((u) => u.name).filter(Boolean).join(', ');
    case 'files': {
      const f = p.files?.[0];
      if (!f) return undefined;
      return f.type === 'external' ? f.external.url : f.file?.url;
    }
    default: return undefined;
  }
}

// ---------------------------------------------------------------------------
// Blocks → Markdown
// ---------------------------------------------------------------------------

function annotate(t) {
  let s = escapeMd(t.plain_text);
  if (!s.trim()) return t.plain_text;
  const a = t.annotations ?? {};
  if (a.code) s = `\`${t.plain_text}\``;
  if (a.bold) s = `**${s}**`;
  if (a.italic) s = `_${s}_`;
  // Strikethrough is gfm-only. Without remark-gfm "~~x~~" prints the tildes,
  // so drop the annotation and keep the words.
  if (t.href) s = `[${s}](${t.href})`;
  return s;
}

function rich(arr = []) {
  return arr.map(annotate).join('');
}

function escapeMd(s) {
  return String(s).replace(/([\\`*_[\]<>])/g, '\\$1');
}

/** Block types whose children indent under them. Everything else unwraps flat. */
const NESTS = new Set(['bulleted_list_item', 'numbered_list_item', 'to_do']);

/**
 * Block types that are dropped, with a warning, rather than converted.
 *
 * The site renders plain MDX with no remark-gfm and has no styling for any of
 * these, and the writers have confirmed they don't use them. Emitting them
 * anyway produced literal pipe characters and stray markup on the page, which
 * is worse than their absence. Every drop is still reported so it shows up in
 * the sync log and the PR body.
 */
const DROPPED = new Set([
  'table', 'table_row',            // no gfm: renders as literal | characters
  'child_page', 'child_database',  // no page to link to on a static site
  'synced_block', 'table_of_contents', 'breadcrumb', // navigation chrome
  'equation',                      // no math rendering on the site
]);

/** ctx collects images to download so conversion stays synchronous. */
async function blocksToMarkdown(blocks, ctx, depth = 0) {
  const out = [];
  let numbered = 0;

  for (const b of blocks) {
    const pad = '  '.repeat(depth);
    // Only list items nest in markdown. Indenting a toggle's or a column's
    // children instead pushes them to 4 spaces, which markdown reads as a code
    // block — the writer's paragraph would render as source code.
    const kids = b.children
      ? await blocksToMarkdown(b.children, ctx, NESTS.has(b.type) ? depth + 1 : 0)
      : '';

    if (b.type !== 'numbered_list_item') numbered = 0;

    switch (b.type) {
      case 'paragraph': {
        const t = rich(b.paragraph.rich_text);
        out.push(t ? pad + t : '');
        if (kids) out.push(kids);
        break;
      }
      case 'heading_1': out.push(`# ${rich(b.heading_1.rich_text)}`); break;
      case 'heading_2': out.push(`## ${rich(b.heading_2.rich_text)}`); break;
      case 'heading_3': out.push(`### ${rich(b.heading_3.rich_text)}`); break;
      // Notion offers H4 in the ordinary heading menu, so writers reach for it
      // without thinking. Without this case the whole heading disappeared.
      case 'heading_4': out.push(`#### ${rich(b.heading_4.rich_text)}`); break;

      case 'bulleted_list_item':
        out.push(`${pad}- ${rich(b.bulleted_list_item.rich_text)}${kids ? '\n' + kids : ''}`);
        break;

      case 'numbered_list_item':
        out.push(`${pad}${++numbered}. ${rich(b.numbered_list_item.rich_text)}${kids ? '\n' + kids : ''}`);
        break;

      case 'to_do':
        // A GFM task list needs remark-gfm; without it "- [x] foo" renders the
        // brackets literally. A plain bullet is the honest degradation.
        out.push(`${pad}- ${rich(b.to_do.rich_text)}`);
        break;

      case 'quote':
        out.push(rich(b.quote.rich_text).split('\n').map((l) => `> ${l}`).join('\n'));
        break;

      case 'callout': {
        const icon = b.callout.icon?.emoji ?? '';
        out.push(`> ${icon} ${rich(b.callout.rich_text)}`.trim());
        break;
      }

      case 'code':
        out.push('```' + (b.code.language ?? '') + '\n' + plain(b.code.rich_text) + '\n```');
        break;

      case 'divider': out.push('---'); break;

      case 'image': {
        const src = b.image.type === 'external' ? b.image.external.url : b.image.file?.url;
        if (!src) break;
        const alt = rich(b.image.caption) || '';
        const name = `${ctx.slug}-${++ctx.imageIndex}.${IMG_EXT}`;
        ctx.images.push({ url: src, out: name });
        out.push(`![${alt}](/images/posts/${name})`);
        break;
      }

      case 'video':
      case 'embed':
      case 'bookmark': {
        const url = b[b.type].url ?? b[b.type].external?.url;
        if (url) out.push(`[${url}](${url})`);
        break;
      }

      case 'toggle':
        // No markdown equivalent — flatten to heading + body so nothing is lost.
        out.push(`**${rich(b.toggle.rich_text)}**`);
        if (kids) out.push(kids);
        break;

      case 'column_list':
      case 'column':
        if (kids) out.push(kids);
        break;

      default:
        // table_row warns once per row otherwise, which buries the real signal.
        if (b.type !== 'table_row') {
          ctx.warnings.push(
            DROPPED.has(b.type)
              ? `blok "${b.type}" preskočen (nije podržan na stranici)`
              : `nepoznat blok "${b.type}" preskočen`
          );
        }
    }
  }

  return out
    .filter((l) => l !== undefined)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    // Blocks are separated by a blank line, but a blank line between two list
    // items makes markdown treat the list as "loose" and wrap every item in a
    // <p>. Writers use bullets constantly, so tighten consecutive items back up.
    // Matched per marker type: collapsing the gap between a bullet and a
    // following numbered item would weld two separate lists together.
    .replace(/^([ \t]*- .*)\n\n(?=[ \t]*- )/gm, '$1\n')
    .replace(/^([ \t]*\d+\. .*)\n\n(?=[ \t]*\d+\. )/gm, '$1\n');
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/**
 * Notion's S3 URLs for uploaded files expire in roughly an hour. They MUST be
 * downloaded at sync time — hotlinking appears to work and then every image on
 * the site breaks overnight.
 */
async function downloadImage(url, outName) {
  const outPath = path.join(OUT_IMAGES, outName);

  // Some hosts (Wikimedia among them) reject requests with no User-Agent
  // outright. Writers paste external image URLs as often as they upload files,
  // so identify ourselves rather than 400 on them.
  const res = await fetch(url, {
    headers: { 'User-Agent': 'knjigoteka-notion-sync/1.0 (+https://knjigoteka.club)' },
  });
  if (!res.ok) {
    warn(`image fetch failed (${res.status}): ${url.slice(0, 80)}…`);
    if (res.status === 403) warn('403 — the Notion file URL expired, re-run the sync');
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());

  if (!SHARP) {
    await fs.writeFile(outPath, buf);
    return outPath;
  }

  await SHARP(buf)
    .resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: IMAGE_QUALITY })
    .toFile(outPath);
  return outPath;
}

/** Pick the output extension before any markdown references it. */
async function initImages() {
  try {
    ({ default: SHARP } = await import('sharp'));
    IMG_EXT = 'webp';
  } catch {
    // sharp is a declared devDependency now, so a missing one means a broken
    // install rather than a choice. Falling back to full-size .jpg would bloat
    // the repo and quietly break the WebP contract the site is built around —
    // exactly the kind of silent degradation this pipeline must not have.
    die('sharp is not installed. Run `npm ci` (or `npm i`) and try again.');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (PUBLISH) {
    if (!TOKEN) die('NOTION_TOKEN is not set.');
    return publish(PUBLISH_FILES);
  }

  await initImages();

  if (!TOKEN) die('NOTION_TOKEN is not set.');
  if (!DATABASE_ID && !ONE_PAGE) die('NOTION_DATABASE_ID is not set.');

  let pages;

  if (ONE_PAGE) {
    pages = [await notion(`/pages/${extractId(ONE_PAGE)}`)];
  } else {
    const dsId = await resolveDataSource(DATABASE_ID);
    pages = await queryReady(dsId);
  }

  if (!pages.length) {
    console.log(`\nNothing with Status = "${STATUS_READY}".\n`);
    await writeReport([], []);
    return;
  }

  if (LIST) {
    console.log(`\n${pages.length} ready to publish:\n`);
    for (const p of pages) {
      const t = readProp(p, PROP.title);
      // An untitled page would otherwise print two blank lines and look like
      // nothing is wrong, which is exactly the silent failure to avoid.
      if (!t) {
        console.log(`  ⚠  (bez naslova — bit će odbijena)`);
        console.log(`    ${p.url ?? p.id}`);
        continue;
      }
      console.log(`  ${t}`);
      console.log(`    slug: ${slugFor(p)}   edited: ${p.last_edited_time.slice(0, 10)}`);
    }
    console.log();
    return;
  }

  if (!DRY_RUN) {
    await fs.mkdir(OUT_POSTS, { recursive: true });
    await fs.mkdir(OUT_IMAGES, { recursive: true });
  }

  const existingByNotionId = await indexExistingPosts();
  /** Pages we refused to write. Reported at the end and reflected in the exit code. */
  const failures = [];
  /** Pages we did write. Becomes the body of the pull request. */
  const synced = [];

  for (const page of pages) {
    const title = readProp(page, PROP.title);
    if (!title) {
      failures.push(`${page.url ?? page.id} — nema naslova (Naslov je prazan)`);
      warn(`page ${page.id} has no title — REJECTED`);
      continue;
    }

    // A post's slug freezes the first time it is written. After that the
    // derived slug is ignored, so retitling in Notion updates the same file at
    // the same URL instead of publishing a duplicate.
    const derivedSlug = slugFor(page);
    const frozenSlug = existingByNotionId.get(normalizeId(page.id));
    const slug = frozenSlug ?? derivedSlug;

    const ctx = { slug, images: [], imageIndex: 0, warnings: [] };

    console.log(`\n${title}  →  ${slug}.mdx`);
    if (frozenSlug && frozenSlug !== derivedSlug) {
      console.log(`  slug frozen at "${frozenSlug}" (title now derives "${derivedSlug}") — live URL preserved`);
    }

    const blocks = await fetchBlocks(page.id);
    const body = await blocksToMarkdown(blocks, ctx);

    // Report conversion warnings before any rejection below, or rejecting a
    // page throws away the very diagnostics that explain how to fix it.
    for (const w of ctx.warnings) warn(w);

    // Frontmatter is a contract with lib/posts.ts:parsePost(). It throws on a
    // missing `date` or a `coverImage` that isn't {src, alt}, and the throw
    // happens during `next build` — so a wrong shape here breaks the deploy,
    // not just the post. Keep these keys in step with lib/types.ts:Post.
    const category = readProp(page, PROP.category) ?? 'Book club';
    const summary = readProp(page, PROP.excerpt) ?? '';

    const front = {
      // The 38 migrated posts pair a prefixed heading with a bare listing
      // title. Writers type only the bare form; the prefix is derived so
      // there's one less field on a form aimed at non-technical volunteers.
      title: `${category}: ${title}`,
      listingTitle: title,
      date: (readProp(page, PROP.publishedDate) ?? page.created_time).slice(0, 10),
      kicker: category,
      // Both exist on every migrated post and hold the same text: `description`
      // feeds og/meta tags, `excerpt` the listing cards.
      description: summary,
      excerpt: summary,
      author: readProp(page, PROP.author),
      // Identity key: lets a writer retitle freely without renaming the file
      // or breaking the live URL. Never derive the slug from the title again
      // once a post exists — see resolveSlug().
      notionId: page.id,
    };

    // Cover: the Notion page cover, else a files property.
    const coverUrl =
      (page.cover?.type === 'external' ? page.cover.external.url : page.cover?.file?.url) ??
      readProp(page, PROP.cover);

    if (coverUrl) {
      // `-cover` matches the migrated posts' naming and keeps the cover out of
      // the body images' numbering.
      const name = `${slug}-cover.${IMG_EXT}`;
      ctx.images.unshift({ url: coverUrl, out: name });
      front.coverImage = { src: `/images/posts/${name}`, alt: title };
    } else {
      // parsePost() throws without a cover, so this is fatal rather than a
      // warning — better to say so here than to fail the build later.
      failures.push(`${title} — nema naslovne slike (dodaj naslovnicu stranice ili ispuni "Naslovna slika")`);
      warn(`${slug}: no cover image — REJECTED (the site requires one)`);
      continue;
    }

    const entry = {
      title,
      slug,
      notionId: page.id,
      url: page.url ?? null,
      category,
      isNew: !frozenSlug,
      images: ctx.images.length,
      warnings: ctx.warnings,
    };

    if (DRY_RUN) {
      console.log('─'.repeat(60));
      console.log(`---\n${toYaml(front)}---\n\n${body}`);
      console.log('─'.repeat(60));
      console.log(`  ${ctx.images.length} images would download`);
      synced.push(entry);
      continue;
    }

    const target = path.join(OUT_POSTS, `${slug}.mdx`);
    // Only claim a path this page already owns. Anything else on that path is
    // either another writer's post or one of the 38 migrated posts, and
    // overwriting either would destroy content the repo owns.
    if (!frozenSlug && existsSync(target)) {
      failures.push(`${title} — "${slug}.mdx" već postoji i pripada drugoj objavi (upiši drugi Slug)`);
      warn(`${slug}.mdx exists and belongs to a different post — REJECTED`);
      continue;
    }

    // Images first, and the .mdx only if every one landed. Writing the post
    // regardless leaves it pointing at files that don't exist, which throws in
    // lib/image-size.ts at build time — a green sync run and a broken site.
    const written = [];
    let imagesOk = true;
    for (const img of ctx.images) {
      process.stdout.write(`  ↓ ${img.out}\n`);
      if (await downloadImage(img.url, img.out)) {
        written.push(path.join(OUT_IMAGES, img.out));
      } else {
        imagesOk = false;
      }
    }

    if (!imagesOk) {
      // Don't leave half a post's images behind for the next run to commit.
      for (const f of written) await fs.rm(f, { force: true });
      failures.push(`${title} — slike se nisu preuzele, objava nije zapisana (pokušaj ponovno)`);
      warn(`${slug}: image download failed — REJECTED, nothing written`);
      continue;
    }

    await fs.writeFile(target, `---\n${toYaml(front)}---\n\n${body}\n`, 'utf8');
    synced.push(entry);
    console.log(`  ✓ written`);
  }

  await writeReport(synced, failures);

  console.log(
    DRY_RUN
      ? '\nDry run — nothing written.'
      : `\nDone. Review with: git diff && git status`
  );

  // A writer who flips a status and sees nothing happen stops using the system,
  // so a rejected page must never look like a clean run. Step 5 turns this list
  // into a Notion comment; until then a non-zero exit is what makes CI notice.
  if (failures.length) {
    console.error(`\n${failures.length} page(s) rejected:`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error('');
    process.exitCode = 1;
    return;
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Write-back
// ---------------------------------------------------------------------------

/**
 * Marks merged posts published in Notion: Status → "Objavljeno" and the live
 * URL into "Objavljeno na".
 *
 * This runs after the merge, so the post is already live no matter what
 * happens here. That asymmetry decides the error handling: a page we cannot
 * reach must fail the job loudly, because the writer's only signal that
 * anything worked is the status changing in front of them. A status stuck on
 * "Za objavu" over a post that is live on the site is precisely the silent
 * failure that makes people abandon the system.
 */
async function publish(files) {
  if (!files.length) {
    console.log('\nNo .mdx files given — nothing to publish.\n');
    await writeReport([], []);
    return;
  }

  const published = [];
  const failures = [];

  for (const file of files) {
    const slug = path.basename(file, '.mdx');
    let raw;
    try {
      raw = await fs.readFile(file, 'utf8');
    } catch {
      // The file was deleted in the same merge that brought it in. Nothing is
      // live, so there is nothing to announce.
      warn(`${file}: not on disk — skipped`);
      continue;
    }

    const front = raw.match(/^---\n([\s\S]*?)\n---/);
    const id = front?.[1].match(/^notionId:\s*"?([0-9a-f-]{32,36})"?\s*$/m)?.[1];
    if (!id) {
      // One of the 38 migrated posts, or a hand-written one. It has no Notion
      // page behind it and never did.
      console.log(`${slug}: no notionId — not a Notion post, skipped`);
      continue;
    }

    const url = `${SITE_URL}/${slug}/`;
    console.log(`\n${slug}  →  ${url}`);

    if (VERIFY_LIVE && !(await waitForLive(url))) {
      failures.push(`${slug} — stranica se nije pojavila na ${url} (objavljivanje nije dovršeno)`);
      warn(`${slug}: ${url} never came up — not marking published`);
      continue;
    }

    let page;
    try {
      page = await notion(`/pages/${id}`);
    } catch (e) {
      failures.push(`${slug} — Notion stranica nije dostupna (${id})`);
      warn(`${slug}: could not read page ${id} — ${e.message}`);
      continue;
    }

    // A writer who moved the page back to "Skica" while the pull request sat in
    // review is saying they want to keep working on it. The post is live either
    // way, so record the URL — but leave their status alone rather than
    // overruling a deliberate choice.
    const current = readProp(page, PROP.status);
    const properties = { [PROP.publishedUrl]: { url } };
    if (current === STATUS_READY) {
      properties[PROP.status] = { status: { name: STATUS_PUBLISHED } };
    } else {
      console.log(`  status is "${current}", not "${STATUS_READY}" — leaving it alone`);
    }

    try {
      await notion(`/pages/${id}`, { method: 'PATCH', body: { properties } });
    } catch (e) {
      failures.push(`${slug} — objava je na stranici, ali status u Notionu nije ažuriran`);
      warn(`${slug}: write-back failed — ${e.message}`);
      continue;
    }

    published.push({ title: readProp(page, PROP.title) ?? slug, slug, notionId: id, url });
    console.log(`  ✓ ${properties[PROP.status] ? `${STATUS_PUBLISHED}, ` : ''}link zapisan`);
  }

  await writeReport(published, failures);

  console.log(`\n${published.length} page(s) marked published.`);
  if (failures.length) {
    console.error(`\n${failures.length} page(s) not updated:`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error('');
    process.exitCode = 1;
  }
}

/** How long to give the deploy before calling a post lost. */
const LIVE_TIMEOUT_MS = 6 * 60 * 1000;
const LIVE_POLL_MS = 15 * 1000;

/**
 * Polls a URL until it resolves. The Pages deploy runs on the same merge that
 * triggers the write-back, so on the first attempt the post reliably is not
 * there yet — a single request would fail every time.
 */
async function waitForLive(url) {
  const deadline = Date.now() + LIVE_TIMEOUT_MS;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (res.ok) {
        console.log(`  live after ${attempt} check(s)`);
        return true;
      }
    } catch {
      // DNS or connection error — indistinguishable from "not deployed yet".
    }
    if (Date.now() + LIVE_POLL_MS >= deadline) return false;
    if (attempt === 1) console.log(`  waiting for the deploy…`);
    await sleep(LIVE_POLL_MS);
  }
}

/**
 * Machine-readable summary of the run, for CI. Written on every path that
 * reaches the database — including "nothing was ready" — so the job can always
 * tell an empty run from a crashed one. No file means the sync died before it
 * got that far, which the job must treat as a failure rather than as silence.
 */
async function writeReport(posts, failures) {
  if (!REPORT) return;
  const report = { dryRun: DRY_RUN, posts, failures };
  await fs.writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function slugFor(page) {
  const explicit = readProp(page, PROP.slug);
  if (explicit) return slugify(explicit);
  return slugify(readProp(page, PROP.title) ?? page.id);
}

/** Notion returns dashed ids; frontmatter may hold either form. */
const normalizeId = (id) => String(id).replace(/-/g, '').toLowerCase();

/**
 * Maps notionId → existing slug for everything already in content/posts.
 *
 * The filename *is* the live URL, so it has to survive a retitle. Deriving the
 * slug from the title on every run would instead publish a second post at a new
 * address and orphan the old one — the identity key exists precisely to stop
 * that. Read the whole directory once rather than probing the derived path,
 * because after a retitle the derived path is exactly where the file isn't.
 */
async function indexExistingPosts() {
  const byNotionId = new Map();
  let files;
  try {
    files = await fs.readdir(OUT_POSTS);
  } catch {
    return byNotionId; // first run, nothing to collide with
  }
  for (const file of files) {
    if (!file.endsWith('.mdx')) continue;
    const raw = await fs.readFile(path.join(OUT_POSTS, file), 'utf8');
    // Match inside the frontmatter block only; a bare id in the body is not
    // a claim of ownership.
    const front = raw.match(/^---\n([\s\S]*?)\n---/);
    const id = front?.[1].match(/^notionId:\s*"?([0-9a-f-]{32,36})"?\s*$/m);
    if (id) byNotionId.set(normalizeId(id[1]), file.replace(/\.mdx$/, ''));
  }
  return byNotionId;
}

function slugify(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractId(input) {
  const m = String(input).match(/([0-9a-f]{32}|[0-9a-f-]{36})/i);
  if (!m) die(`Could not find a page ID in "${input}"`);
  return m[1];
}

function toYaml(obj) {
  let out = '';
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      out += `${k}:\n${v.map((i) => `  - ${JSON.stringify(String(i))}`).join('\n')}\n`;
    } else if (typeof v === 'object') {
      // One level of nesting is enough for coverImage: { src, alt }.
      const kids = Object.entries(v).filter(([, x]) => x !== undefined && x !== '');
      out += `${k}:\n${kids.map(([ck, cv]) => `  ${ck}: ${JSON.stringify(String(cv))}`).join('\n')}\n`;
    } else {
      out += `${k}: ${JSON.stringify(String(v))}\n`;
    }
  }
  return out;
}

function die(msg) {
  console.error(`\n${msg}\n`);
  process.exit(1);
}

main().catch((e) => {
  console.error(`\n${e.message}\n`);
  process.exit(1);
});
