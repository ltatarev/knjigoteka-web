# Content

Everything here was migrated out of Contentful by `scripts/migrate-contentful.mjs`.
The Gatsby site still reads from Contentful — this directory is the portable
content layer for the upcoming Astro/Next + Keystatic setup.

```
content/
  posts/<slug>.mdx     38 book-club posts
  data/*.json          homepage / about / layout structural content
  images/posts/        post covers + in-post images
  images/site/         homepage, about and layout imagery
  README.md
```

## Posts

One `.mdx` per post, filename = URL slug. Frontmatter:

| field | notes |
| --- | --- |
| `title` | full title, e.g. `Book club: Fredrik Backman - Čovjek zvan Ove` |
| `listingTitle` | short form used in listings, e.g. `Fredrik Backman, Čovjek zvan Ove` |
| `date` | Contentful `createdAt`. There was no date field, so this is the best available signal — many posts were bulk-imported and share a date. |
| `kicker` | listing label, always `Book club` |
| `description` | SEO meta |
| `excerpt` | listing summary |
| `coverImage` | `{ src, alt }` |
| `images` | optional `[{ src, alt }]`, in-post images |

Bodies came from three separate Contentful rich-text fields (`body`, `body1`,
`body2`) with an image slotted between the last two. They're concatenated in that
original render order into a single markdown body. The source used only
paragraphs, blockquotes and bold, so the conversion is lossless — verified
character-for-character against the API for all 38 posts.

`<` and `{` are escaped, since both are active characters in MDX.

## Listings are derived, not stored

Contentful had a `newsPage` holding 38 hand-maintained "feature" blocks, one per
post, plus 3 more on the homepage. Those were pure duplication of post data, so
they are **not** carried over as content. Build both listings by reading the
posts collection instead — otherwise a post added in Keystatic never shows up.

- **News page** — all posts, newest first (`listingTitle`, `excerpt`, `kicker`, `coverImage`).
- **Homepage "Novosti"** — the 3 newest posts, same fields.

`data/posts-index.json` is a convenience index (slug/title/date, newest first).

## Structural content

`data/homepage.json`, `data/about.json` and `data/layout.json` hold the hero,
product list, benefit lists, CTA, stats, nav and footer. Each block keeps a
`type` matching its old Contentful content type, so it lines up with the existing
components in `src/components/sections.js`.

These are intentionally *not* modelled in Keystatic — the decision was to hardcode
structural content and keep only posts editable.

Three bare assets sat in the homepage `content` array with no block type. They
rendered as nothing, so they were dropped.

## Images

Downloaded and re-encoded at max 1600px wide (JPEG q82 / PNG compressed):
**189.1 MB → 13.2 MB** across 61 files. Paths are public-root relative
(`/images/...`), so on migration point the static dir at `content/images`, or move
it to `public/images`. `keystatic.config.ts` is already set up for the former.

## Re-running

```bash
set -a; . ./.env; set +a
node scripts/migrate-contentful.mjs
```

Overwrites `content/` from Contentful. Once the Contentful space is retired, the
script stops working — that's expected, it's a one-off.
