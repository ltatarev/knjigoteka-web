# 📖 knjigoteka-web

Landing page for **Knjigoteka Bilje** — „Knjiga za sve", Udruga ljubitelja knjiga Bilje.
<https://knjigoteka.club>

Next.js 15 (App Router) · TypeScript · vanilla-extract · MDX · static export to GitHub Pages.

Previously Gatsby 5 + Contentful; see the migration notes at the bottom.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

| script | what it does |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | static export; writes the whole site to `out/` |
| `npm run preview` | serve `out/` locally the way Pages does |
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
notion-sync.mjs       Notion → MDX converter — see "Publishing from Notion"
docs/                 how the Notion side is set up
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

### Adding a post

Normally you don't — posts are written in Notion and synced (see below). To add
one by hand, drop a new `.mdx` file into `content/posts/`, add the cover to
`public/images/posts/`, and run `npm run verify:posts`. It appears at the top of
`/news/` automatically.

## Publishing from Notion

Writers work in the **Objave** Notion database and never touch this repository.
A page's `Status` is the entire interface: **`Za objavu`** puts it on the site,
**`Skriveno`** takes it back off. Everything after that is automated.

```
Notion "Za objavu"  →  notion-sync.yml  →  pull request  →  merge
                                                             ↓
                    Notion "Objavljeno" ←  notion-publish.yml
                              +  live URL in "Objavljeno na"

Notion "Skriveno"   →  notion-sync.yml  →  pull request  →  merge
                       (deletes the post)                    ↓
                                              gone from the site
```

| piece | what it is |
| --- | --- |
| `notion-sync.mjs` | the converter — Notion blocks → MDX, covers and inline images → 1600px WebP |
| `.github/workflows/notion-sync.yml` | runs it once a night, opens one pull request |
| `.github/workflows/notion-publish.yml` | on merge, writes status and URL back to Notion |
| `.github/scripts/` | renders the pull request body and the maintainer's issue |
| `docs/notion-predlozak.md` | what the "Nova objava" Notion template contains |

**Merging the pull request is what publishes.** Nothing reaches the site
unreviewed, and the sync is one-way — the page body is never written back, so a
conversion bug can't overwrite a writer's own words.

### When it runs

The sync runs **once a night** (`0 0 * * *`, which GitHub reads as UTC — 01:00
local in winter, 02:00 in summer). A page flipped to `Za objavu` in the morning
is therefore in a pull request the next day, not the same afternoon.

To publish without waiting, run it by hand: **Actions → Notion sync → Run
workflow**. That is the same job, and it opens or updates the same pull request
— dispatching while one is already open never creates a second one.

### Running it locally

```bash
export NOTION_TOKEN=ntn_xxx          # notion.so/my-integrations
export NOTION_DATABASE_ID=xxxxxxxx   # from the database URL

node notion-sync.mjs --list          # what's ready to publish, and what's to be removed
node notion-sync.mjs --dry-run       # convert and print, write and delete nothing
node notion-sync.mjs                 # write MDX + images, delete hidden posts
```

The integration needs the database shared with it (••• → **Connections**) and
the **Read comments** capability, without which failures can't be deduplicated
and so aren't posted at all.

`sharp` is a devDependency and the sync refuses to run without it — CI therefore
installs with a plain `npm ci`, never `--omit=dev`.

### When something fails

A rejected page never fails silently, because a writer who hears nothing
concludes the system is broken:

- the **writer** gets a comment on their own Notion page, in Croatian, naming a
  field they can see — deduplicated, so a page that stays broken is commented on
  once, not once per run;
- the **maintainer** gets a single GitHub issue labelled `notion-sync`, edited in
  place each run and closed automatically once the sync recovers.

Property names are mapped in one place — `PROP` at the top of `notion-sync.mjs`.
Rename a Notion column there, not in Notion.

Slugs are frozen on first publish: the sync maps `notionId` → existing filename,
so retitling a published post in Notion does not move its URL.

### Taking a post down

`Skriveno` has to exist as an option on the `Status` property first — add it in
the **Objave** database (`Status` → **+ Add option**), spelled exactly that way.
The name is matched literally, and the sync renames nothing in Notion; if the
option is missing, no page can ever hold the status and nothing happens.

Setting `Status` to **`Skriveno`** unpublishes it. The next sync deletes the
post's `.mdx` and the images only it uses, so merging that pull request removes
the page, its card on `/news/` and its sitemap entry in one go — a static export
builds nothing it has no file for. Hiding a page that was never published does
nothing, which is not an error.

The pull request says so in its title (`Skrivanje objave: …`) and lists what
disappears. Nothing goes off the site unreviewed, exactly as nothing goes on it
unreviewed.

To put it back, set the status to `Za objavu` again. It returns to **the same
address**, even if it was retitled in the meantime: the `notionId` → filename
map is gone with the file, so the sync falls back to the address recorded in
`Objavljeno na`. That property is therefore deliberately *not* cleared when a
post comes down — while a post is hidden it is the only record of where it
lived, and clearing it would silently move the URL on the way back.

The text and images stay in Notion throughout; only the site's copy is deleted.
Note that git history keeps the removed files, so this hides a post from the
site — it does not erase it from the repository.

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

GitHub Pages, via `.github/workflows/deploy.yml` on push to `main`.

The site is a **static export** (`output: "export"` in `next.config.ts`) — Pages
serves files only, there is no Next server. `npm run build` writes everything to
`out/`, which the workflow uploads as the Pages artifact.

Two files in `public/` matter for this and are copied into `out/` verbatim:

- **`CNAME`** — the custom domain. Without it Pages drops back to the
  `github.io` address on the next deploy.
- **`.nojekyll`** — stops Pages running Jekyll, which would otherwise strip the
  `_next/` directory and take every stylesheet and script with it.

### Images are not optimised

Static hosting means `next/image`'s optimiser cannot run, so
`images.unoptimized` is set and images are served at their source resolution.
Lighthouse reports roughly 800 KiB of avoidable image bytes on a post page and
1.7 MB on the homepage, against a Gatsby build that served responsive srcsets
from Contentful's CDN.

Fixing this needs build-time image generation: pre-render WebP variants at a few
widths and point `next/image` at them with a custom loader.

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
`content/README.md` still refers to a `keystatic.config.ts` that has since been
removed.
