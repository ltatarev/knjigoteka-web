/**
 * Phase 2 verification.
 *
 * Prints every post the content layer can see, checks the cover images and
 * in-post images actually exist under public/, and compiles every body as MDX
 * so a parse error surfaces here rather than mid-build.
 *
 *   node --experimental-strip-types scripts/list-posts.mts
 */
import fs from "node:fs"
import path from "node:path"
import { getAllPosts } from "../lib/posts.ts"

const posts = getAllPosts()

console.log(`${posts.length} posts\n`)
console.log("date        slug                                    title")
console.log("-".repeat(110))
for (const p of posts) {
  console.log(`${p.date}  ${p.slug.padEnd(38)}  ${p.title}`)
}

// --- referenced images exist -------------------------------------------------
const missing: string[] = []
for (const p of posts) {
  for (const img of [p.coverImage, ...p.images]) {
    if (!fs.existsSync(path.join(process.cwd(), "public", img.src))) {
      missing.push(`${p.slug}: ${img.src}`)
    }
  }
  for (const m of p.content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    const src = m[1]
    if (src.startsWith("/") && !fs.existsSync(path.join(process.cwd(), "public", src))) {
      missing.push(`${p.slug} (body): ${src}`)
    }
  }
}

// --- every body compiles as MDX ---------------------------------------------
const { compile } = await import("@mdx-js/mdx")
const failed: string[] = []
for (const p of posts) {
  try {
    await compile(p.content)
  } catch (err) {
    failed.push(`${p.slug}: ${(err as Error).message}`)
  }
}

console.log()
console.log(`slugs unique:       ${new Set(posts.map((p) => p.slug)).size === posts.length}`)
console.log(`sorted date desc:   ${posts.every((p, i) => i === 0 || posts[i - 1].date >= p.date)}`)
console.log(`images resolved:    ${missing.length === 0 ? "all" : `${missing.length} MISSING`}`)
missing.forEach((m) => console.log(`   ! ${m}`))
console.log(`bodies compile:     ${failed.length === 0 ? "all" : `${failed.length} FAILED`}`)
failed.forEach((f) => console.log(`   ! ${f}`))

if (missing.length || failed.length) process.exit(1)
