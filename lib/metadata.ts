import type { Metadata } from "next"

/**
 * Mirrors the Gatsby Head component (gatsby-legacy/components/head.js) tag for
 * tag, so social previews are unchanged:
 *
 *   <title>                          always
 *   description + og:description     only when the page has one
 *   og:title, twitter:title          always
 *   og:image, twitter:image          only when the page has one
 *   twitter:card = summary           always
 *
 * Pages that passed no description emitted none, so there is deliberately no
 * site-wide default — a fallback here would add descriptions where the live
 * site has none.
 */
export function pageMetadata({
  title,
  description,
  image,
}: {
  title: string
  description?: string
  image?: string
}): Metadata {
  const images = image ? [image] : undefined
  return {
    title,
    ...(description ? { description } : null),
    openGraph: {
      title,
      ...(description ? { description } : null),
      ...(images ? { images } : null),
    },
    twitter: {
      card: "summary",
      title,
      ...(description ? { description } : null),
      ...(images ? { images } : null),
    },
  }
}
