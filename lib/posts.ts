import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import type { Post, PostImage } from "./types"

const POSTS_DIR = path.join(process.cwd(), "content", "posts")

/**
 * YAML parses an unquoted `2024-08-10` into a Date at UTC midnight. Formatting
 * that with local-time getters shifts the day backwards anywhere west of UTC,
 * so read it back in UTC and keep it as a plain string from here on.
 */
function toISODate(value: unknown, slug: string): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`${slug}: unparseable date in frontmatter`)
    }
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }
  throw new Error(`${slug}: missing or malformed \`date\` in frontmatter`)
}

function toPostImage(value: unknown): PostImage | undefined {
  if (!value || typeof value !== "object") return undefined
  const { src, alt } = value as Record<string, unknown>
  if (typeof src !== "string" || !src) return undefined
  return { src, alt: typeof alt === "string" ? alt : "" }
}

function parsePost(slug: string, raw: string): Post {
  const { data, content } = matter(raw)

  const title = data.title
  if (typeof title !== "string" || !title) {
    throw new Error(`${slug}: missing \`title\` in frontmatter`)
  }

  const coverImage = toPostImage(data.coverImage)
  if (!coverImage) {
    throw new Error(`${slug}: missing or malformed \`coverImage\` in frontmatter`)
  }

  const images = Array.isArray(data.images)
    ? data.images.map(toPostImage).filter((i): i is PostImage => Boolean(i))
    : []

  const str = (v: unknown) => (typeof v === "string" ? v : "")

  return {
    slug,
    title,
    // Listings fall back to the full title rather than rendering an empty card.
    listingTitle: str(data.listingTitle) || title,
    date: toISODate(data.date, slug),
    kicker: str(data.kicker),
    description: str(data.description),
    excerpt: str(data.excerpt),
    coverImage,
    images,
    content,
  }
}

let cache: Post[] | null = null

function loadAll(): Post[] {
  if (cache) return cache

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "")
    return parsePost(slug, fs.readFileSync(path.join(POSTS_DIR, file), "utf8"))
  })

  // Newest first. Many posts share a date (the migration used Contentful's
  // createdAt), so slug breaks ties to keep the order stable across machines —
  // readdir order is not guaranteed. The /news/ and homepage listings override
  // this with the pinned live ordering; see lib/news-order.ts.
  posts.sort((a, b) =>
    a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)
  )

  cache = posts
  return posts
}

export function getAllPosts(): Post[] {
  return loadAll()
}

export function getAllPostSlugs(): string[] {
  return loadAll().map((p) => p.slug)
}

export function getPostBySlug(slug: string): Post | undefined {
  return loadAll().find((p) => p.slug === slug)
}
