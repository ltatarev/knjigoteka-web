import type { NextConfig } from "next"
import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin"

const withVanillaExtract = createVanillaExtractPlugin()

const nextConfig: NextConfig = {
  // GitHub Pages serves static files only — there is no Next server to run, so
  // the whole site is exported to out/ at build time.
  output: "export",

  // Gatsby emitted directory-style URLs (/about/). Every inbound link and social
  // share on the live site depends on them, so this is not optional. It also
  // makes the export emit out/about/index.html, which is what Pages serves.
  trailingSlash: true,

  images: {
    // next/image's optimiser needs a server. Without it images are served at
    // their source resolution — see README for what that costs.
    unoptimized: true,
  },
}

export default withVanillaExtract(nextConfig)
