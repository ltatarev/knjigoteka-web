/**
 * One-off migration: pull everything out of Contentful into local, portable content.
 *
 *   node scripts/migrate-contentful.mjs
 *
 * Outputs:
 *   content/posts/<slug>.mdx      38 book-club posts, Keystatic-friendly frontmatter + markdown
 *   content/data/*.json           homepage / about / layout structural content
 *   content/images/**             every referenced asset, resized and re-encoded
 *
 * The existing Gatsby site is left untouched; this builds the content layer that a
 * future Astro/Next + Keystatic setup reads from.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "content");
const IMG_DIR = path.join(OUT, "images");
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 82;

const SPACE = process.env.CONTENTFUL_SPACE_ID;
const TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const ENV = process.env.CONTENTFUL_ENVIRONMENT || "master";
if (!SPACE || !TOKEN) {
  console.error("Missing CONTENTFUL_SPACE_ID / CONTENTFUL_ACCESS_TOKEN.");
  process.exit(1);
}

const api = async (resource, params = {}) => {
  const qs = new URLSearchParams({ access_token: TOKEN, limit: "1000", ...params });
  const url = `https://cdn.contentful.com/spaces/${SPACE}/environments/${ENV}/${resource}?${qs}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${resource} -> HTTP ${res.status} ${await res.text()}`);
  return res.json();
};

/* ------------------------------------------------------------------ helpers */

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Contentful slugs are inconsistent: some have leading/trailing slashes.
const normSlug = (s) => String(s || "").trim().replace(/^\/+|\/+$/g, "");

// `<` and `{` are active characters in MDX; escape so bodies stay plain prose.
const escapeMdx = (t) => t.replace(/([<{])/g, "\\$1");

const yamlStr = (v) => {
  const s = String(v ?? "");
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
};

/* ------------------------------------------- Contentful rich text -> markdown */

function renderInline(node) {
  if (node.nodeType === "text") {
    let t = escapeMdx(node.value ?? "");
    // Applying marks to whitespace-only runs produces broken markdown (`** **`).
    if (!t.trim()) return t;
    const marks = new Set((node.marks || []).map((m) => m.type));
    const [lead] = t.match(/^\s*/);
    const [tail] = t.match(/\s*$/);
    let core = t.slice(lead.length, t.length - tail.length);
    if (marks.has("code")) core = `\`${core}\``;
    if (marks.has("bold")) core = `**${core}**`;
    if (marks.has("italic")) core = `_${core}_`;
    if (marks.has("underline")) core = `<u>${core}</u>`;
    return lead + core + tail;
  }
  const inner = (node.content || []).map(renderInline).join("");
  if (node.nodeType === "hyperlink") return `[${inner}](${node.data?.uri ?? ""})`;
  return inner;
}

function renderBlocks(nodes, assetPath) {
  const out = [];
  for (const node of nodes || []) {
    switch (node.nodeType) {
      case "paragraph": {
        const text = renderInline(node).trim();
        if (text) out.push(text);
        break;
      }
      case "heading-1":
      case "heading-2":
      case "heading-3":
      case "heading-4":
      case "heading-5":
      case "heading-6": {
        const level = Number(node.nodeType.split("-")[1]);
        const text = renderInline(node).trim();
        if (text) out.push(`${"#".repeat(level)} ${text}`);
        break;
      }
      case "blockquote": {
        const inner = renderBlocks(node.content, assetPath);
        if (inner.trim()) {
          out.push(
            inner
              .split("\n")
              .map((l) => (l ? `> ${l}` : ">"))
              .join("\n")
          );
        }
        break;
      }
      case "unordered-list":
      case "ordered-list": {
        const ordered = node.nodeType === "ordered-list";
        const items = (node.content || []).map((li, i) => {
          const body = renderBlocks(li.content, assetPath).trim();
          const bullet = ordered ? `${i + 1}. ` : "- ";
          return body
            .split("\n")
            .map((l, j) => (j === 0 ? bullet + l : "  " + l))
            .join("\n");
        });
        out.push(items.join("\n"));
        break;
      }
      case "hr":
        out.push("---");
        break;
      case "embedded-asset-block": {
        const p = assetPath(node.data?.target?.sys?.id);
        if (p) out.push(`![](${p})`);
        break;
      }
      default: {
        if (node.content) {
          const inner = renderBlocks(node.content, assetPath);
          if (inner.trim()) out.push(inner);
        }
      }
    }
  }
  return out.join("\n\n");
}

const richTextToMarkdown = (doc, assetPath) => {
  if (!doc) return "";
  const parsed = typeof doc === "string" ? JSON.parse(doc) : doc;
  return renderBlocks(parsed.content, assetPath).trim();
};

/* ------------------------------------------------------------------- images */

const usedNames = new Map();
function uniqueName(base, ext) {
  const key = `${base}${ext}`;
  const n = usedNames.get(key) || 0;
  usedNames.set(key, n + 1);
  return n === 0 ? key : `${base}-${n + 1}${ext}`;
}

async function processAsset(asset, subdir, baseName) {
  const file = asset?.fields?.file;
  if (!file?.url) return null;

  const contentType = file.contentType || "";
  if (!contentType.startsWith("image/")) return null;

  const src = file.url.startsWith("//") ? `https:${file.url}` : file.url;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`asset ${src} -> HTTP ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());

  const isPng = contentType === "image/png";
  const ext = isPng ? ".png" : ".jpg";
  const name = uniqueName(baseName, ext);
  const rel = path.join(subdir, name);
  const dest = path.join(IMG_DIR, rel);
  await fs.mkdir(path.dirname(dest), { recursive: true });

  let pipeline = sharp(input).rotate().resize({
    width: MAX_WIDTH,
    withoutEnlargement: true,
  });
  pipeline = isPng
    ? pipeline.png({ compressionLevel: 9, palette: true })
    : pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });

  const info = await pipeline.toFile(dest);
  return {
    src: `/images/${rel.split(path.sep).join("/")}`,
    alt: asset.fields.title || "",
    width: info.width,
    height: info.height,
    bytesBefore: file.details?.size ?? 0,
    bytesAfter: info.size,
  };
}

/* --------------------------------------------------------------------- main */

const main = async () => {
  console.log("Fetching from Contentful...");
  const [entriesRes, assetsRes] = await Promise.all([
    api("entries", { include: "0" }),
    api("assets"),
  ]);

  const entries = new Map(entriesRes.items.map((e) => [e.sys.id, e]));
  const assets = new Map(assetsRes.items.map((a) => [a.sys.id, a]));
  const typeOf = (e) => e.sys.contentType.sys.id;
  const byType = (t) => entriesRes.items.filter((e) => typeOf(e) === t);
  console.log(`  ${entries.size} entries, ${assets.size} assets`);

  const posts = byType("page").map((p) => ({ ...p, slug: normSlug(p.fields.slug) }));
  const newsPage = byType("newsPage")[0];

  // The newsPage features carry each post's listing title + excerpt. Map them
  // back onto the posts by the slug their "read more" link points at.
  const featureBySlug = new Map();
  for (const ref of newsPage?.fields?.content ?? []) {
    const feature = entries.get(ref.sys.id);
    if (!feature || typeOf(feature) !== "homepageFeature") continue;
    const linkRef = (feature.fields.links || [])[0];
    const href = linkRef ? entries.get(linkRef.sys.id)?.fields?.href : null;
    if (href) featureBySlug.set(normSlug(href), feature);
  }

  /* ---- images ------------------------------------------------------------ */

  console.log("Downloading + optimizing images...");
  const assetPathById = new Map();
  let before = 0;
  let after = 0;

  const register = async (id, subdir, base) => {
    if (!id) return null;
    if (assetPathById.has(id)) return assetPathById.get(id);
    const asset = assets.get(id);
    if (!asset) return null;
    const out = await processAsset(asset, subdir, base);
    if (out) {
      before += out.bytesBefore;
      after += out.bytesAfter;
      assetPathById.set(id, out);
    }
    return out;
  };

  for (const post of posts) {
    await register(post.fields.image?.sys?.id, "posts", `${post.slug}-cover`);
    const extra = post.fields.blogImages || [];
    for (let i = 0; i < extra.length; i++) {
      await register(extra[i].sys.id, "posts", `${post.slug}-${i + 1}`);
    }
  }

  // Everything else referenced anywhere (homepage, about, layout, benefits...).
  for (const entry of entriesRes.items) {
    for (const value of Object.values(entry.fields)) {
      const refs = Array.isArray(value) ? value : [value];
      for (const r of refs) {
        if (r?.sys?.linkType !== "Asset") continue;
        const asset = assets.get(r.sys.id);
        if (!asset) continue;
        const base = slugify(
          (asset.fields.title || asset.fields.file?.fileName || r.sys.id).replace(
            /\.[a-z0-9]+$/i,
            ""
          )
        );
        await register(r.sys.id, "site", base || r.sys.id);
      }
    }
  }
  console.log(
    `  ${assetPathById.size} images: ${(before / 1e6).toFixed(1)} MB -> ${(
      after / 1e6
    ).toFixed(1)} MB`
  );

  const assetPath = (id) => assetPathById.get(id)?.src ?? null;

  /* ---- posts -> mdx ------------------------------------------------------ */

  console.log("Writing posts...");
  await fs.mkdir(path.join(OUT, "posts"), { recursive: true });

  const index = [];
  for (const post of posts) {
    const f = post.fields;
    const feature = featureBySlug.get(post.slug);
    const cover = assetPathById.get(f.image?.sys?.id);
    const extra = (f.blogImages || [])
      .map((r) => assetPathById.get(r.sys.id))
      .filter(Boolean);

    const date = post.sys.createdAt.slice(0, 10);
    const body = richTextToMarkdown(f.body, assetPath);
    const body1 = richTextToMarkdown(f.body1, assetPath);
    const body2 = richTextToMarkdown(f.body2, assetPath);

    // Original template order: body, body1, blogImages[0], body2.
    const parts = [body, body1];
    if (extra[0]) parts.push(`![${extra[0].alt}](${extra[0].src})`);
    parts.push(body2);
    const markdown = parts.filter((p) => p && p.trim()).join("\n\n");

    const fm = [
      "---",
      `title: ${yamlStr(f.title)}`,
      `listingTitle: ${yamlStr(feature?.fields?.heading ?? f.title)}`,
      `date: ${date}`,
      `kicker: ${yamlStr(feature?.fields?.kicker ?? "Book club")}`,
      `description: ${yamlStr(f.description ?? feature?.fields?.text ?? "")}`,
      `excerpt: ${yamlStr(feature?.fields?.text ?? f.description ?? "")}`,
    ];
    if (cover) {
      fm.push("coverImage:", `  src: ${yamlStr(cover.src)}`, `  alt: ${yamlStr(cover.alt)}`);
    }
    if (extra.length) {
      fm.push("images:");
      for (const im of extra) fm.push(`  - src: ${yamlStr(im.src)}`, `    alt: ${yamlStr(im.alt)}`);
    }
    fm.push("---");

    await fs.writeFile(
      path.join(OUT, "posts", `${post.slug}.mdx`),
      `${fm.join("\n")}\n\n${markdown}\n`,
      "utf8"
    );
    index.push({ slug: post.slug, title: f.title, date });
  }
  index.sort((a, b) => (a.date < b.date ? 1 : -1));
  console.log(`  ${index.length} posts`);

  /* ---- structural content -> json ---------------------------------------- */

  console.log("Writing structural content...");
  const resolve = (node, depth = 0) => {
    if (depth > 12) return null;
    const out = {};
    for (const [key, value] of Object.entries(node.fields)) {
      const one = (v) => {
        if (v?.sys?.linkType === "Asset") return assetPathById.get(v.sys.id) ?? null;
        if (v?.sys?.linkType === "Entry") {
          const child = entries.get(v.sys.id);
          return child ? { type: typeOf(child), ...resolve(child, depth + 1) } : null;
        }
        if (v?.nodeType === "document") return richTextToMarkdown(v, assetPath);
        return v;
      };
      out[key] = Array.isArray(value) ? value.map(one).filter((x) => x !== null) : one(value);
    }
    return out;
  };

  const dataDir = path.join(OUT, "data");
  await fs.mkdir(dataDir, { recursive: true });

  const write = async (name, value) =>
    fs.writeFile(path.join(dataDir, `${name}.json`), JSON.stringify(value, null, 2) + "\n", "utf8");

  const homepage = byType("homepage")[0];
  const about = byType("aboutPage")[0];
  const layout = byType("layout")[0];

  if (homepage) {
    const resolved = resolve(homepage);
    // Three bare assets sit in the homepage content array with no block type;
    // they render as nothing today, so drop them from the block list.
    resolved.content = (resolved.content || []).filter((b) => b && b.type);
    await write("homepage", resolved);
  }
  if (about) await write("about", resolve(about));
  if (layout) await write("layout", resolve(layout));
  await write("posts-index", index);

  const bare = (homepage?.fields?.content ?? []).filter(
    (r) => r.sys.linkType === "Asset"
  ).length;

  console.log("\nDone.");
  console.log(`  content/posts/       ${index.length} .mdx`);
  console.log(`  content/images/      ${assetPathById.size} files`);
  console.log(`  content/data/        homepage, about, layout, posts-index`);
  if (bare) console.log(`  note: dropped ${bare} bare asset(s) from homepage blocks (rendered nothing)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
