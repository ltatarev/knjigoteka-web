import type { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/posts"

const SITE = "https://knjigoteka.club"

// trailingSlash is on, so every URL here ends in a slash — otherwise the
// sitemap advertises URLs that 308 to their canonical form.
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  const newest = posts[0]?.date

  return [
    { url: `${SITE}/`, lastModified: newest, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/news/`, lastModified: newest, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/about/`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE}/contact/`, changeFrequency: "yearly", priority: 0.5 },
    ...posts.map((post) => ({
      url: `${SITE}/${post.slug}/`,
      lastModified: post.date,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ]
}
