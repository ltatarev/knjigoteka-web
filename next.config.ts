import type { NextConfig } from "next"
import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin"

const withVanillaExtract = createVanillaExtractPlugin()

const nextConfig: NextConfig = {
  // Gatsby emitted directory-style URLs (/about/). Every inbound link and social
  // share on the live site depends on them, so this is not optional.
  trailingSlash: true,

  // The Gatsby app still lives in src/ until phase 7. Without this, Next would
  // treat src/pages/*.js as Pages Router routes and try to compile `gatsby`
  // imports. Restricting extensions makes it ignore them entirely.
  pageExtensions: ["ts", "tsx"],
}

export default withVanillaExtract(nextConfig)
