import type { MetadataRoute } from "next"

// Required by output: "export" — metadata routes are route handlers, and
// static export needs them pinned to static.
export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://knjigoteka.club/sitemap.xml",
  }
}
