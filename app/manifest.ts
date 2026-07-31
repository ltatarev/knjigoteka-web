import type { MetadataRoute } from "next"

// Required by output: "export" — metadata routes are route handlers, and
// static export needs them pinned to static.
export const dynamic = "force-static"

// Replaces gatsby-plugin-manifest. Same name, colours and start_url.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Knjigoteka Bilje",
    short_name: "Knjigoteka",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFCF8",
    theme_color: "#E98C00",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
