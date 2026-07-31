# 📖 knjigoteka-web

Landing page for **Knjigoteka Bilje** — „Knjiga za sve", Udruga ljubitelja knjiga Bilje.
<https://knjigoteka.club>

Next.js 15 (App Router) · TypeScript · vanilla-extract · MDX · deployed on Netlify.

Previously Gatsby 5 + Contentful; see the migration notes at the bottom.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

| script | what it does |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | production build; prerenders every page |
| `npm start` | serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify:posts` | lists all posts, checks images resolve and bodies compile |

## Layout

```
app/                  routes — /, /[slug]/, /about/, /news/, /contact/
                      plus sitemap.ts, robots.ts, manifest.ts, not-found.tsx
components/           UI primitives (ui.tsx) and page sections
styles/               theme tokens and global styles (vanilla-extract)
lib/                  content readers and typed data
content/              posts and structural copy — see content/README.md
public/images/        post covers and site imagery
```

## Content

Everything editable lives in `content/`:

- **`content/posts/*.mdx`** — one file per book review. The **filename is the URL**:
  `content/posts/rebecca.mdx` → `/rebecca/`. Frontmatter is `title`,
  `listingTitle`, `date`, `kicker`, `description`, `excerpt`, `coverImage`
  and optional `images`.
- **`content/data/*.json`** — homepage, about and layout copy. Structural, edited by hand.

Images referenced from content live in `public/images/` and are written as
public-root paths (`/images/posts/rebecca-cover.jpg`).

`keystatic.config.ts` is present but **not wired up** — the schema matches the
MDX files and is ready if a CMS admin is added later.

### Adding a post

Drop a new `.mdx` file into `content/posts/`, add the cover to
`public/images/posts/`, and run `npm run verify:posts`. It appears at the top of
`/news/` automatically.

### Listing order

`/news/` and the homepage "Novosti" block do **not** sort purely by date.

Contentful held a hand-maintained order that the content migration dropped, and
it is not reconstructible: `date` is Contentful's `createdAt`, 15 posts share
`2024-08-10`, and 6 share `2024-07-31`. The live order is therefore recorded
explicitly in **`lib/news-order.ts`**. Any post not in that list sorts by date
descending and goes to the top, so new posts still appear without editing it.

The same file pins `HOMEPAGE_SLUGS` — the three posts shown on the homepage.
These are an editorial pick, not the three newest (`book-club-muza` is the
oldest post on the site). **Changing the homepage selection means editing that
list.**

## URLs

Posts sit at **root-level slugs** (`/rebecca/`, `/book-club-muza/`, …) alongside
`/about/`, `/news/` and `/contact/`. `trailingSlash: true` in `next.config.ts`
keeps Gatsby's directory-style URLs — without it every inbound link and social
share would redirect.

Two posts carry an inconsistent `book-club-` prefix
(`book-club-muza`, `book-club-iza-zakljucanih-vrata`). These are live URLs, not
a style inconsistency — **do not normalise them.**

## Deployment

Netlify, configured by `netlify.toml`. Netlify's Next.js Runtime v5 is applied
automatically for Next 13.5+; do not add `@netlify/plugin-nextjs` manually.

The site runs in **server mode**, not `output: "export"` — but every page is
still prerendered at build time.

> **DNS is a manual step.** The old GitHub Pages `CNAME` file has been removed.
> Point `knjigoteka.club` at Netlify in the Netlify dashboard.

## Notes from the Gatsby → Next migration

Things that look like mistakes but are deliberate:

- **Font weights are pinned to DM Sans 400/500/700 and DM Mono 400/500.** The
  theme defines `extrabold: 800` and every heading uses it, but 800 was never
  loaded, so headings render at 700. Using the variable font would silently make
  every heading heavier.
- **The homepage hero has an empty `<h2>` and the product list three empty
  `<h3>`s.** Those fields are absent from the content and the markup matched
  live; removing them changes the vertical rhythm.
- **Post bodies get no prose styling.** Gatsby had a rich `blog-post.css.ts`,
  but the post template never applied it. Bodies inherit only the global styles.
- Image `max-height` **centre-crops** rather than clipping, matching how
  `GatsbyImage` behaved. See `components/framed-image.css.ts`.

`scripts/migrate-contentful.mjs` is kept as a record of how `content/` was
produced. It is **no longer runnable** — the Contentful space is retired.
