/** `scheme:` prefix (http:, https:, mailto:, tel:) or protocol-relative `//`. */
const ABSOLUTE = /^([a-z][a-z\d+\-.]*:|\/\/)/i

export function isAbsoluteUrl(url: string): boolean {
  return ABSOLUTE.test(url)
}

/**
 * The site is built with `trailingSlash: true`, but the migrated link data is
 * inconsistent (`/about` vs `/plemeniti-gospodin-u-moskvi/`). Normalising at
 * read time avoids a 308 redirect on every internal navigation without editing
 * anything under content/.
 */
export function withTrailingSlash(href: string): string {
  if (!href || isAbsoluteUrl(href) || href.startsWith("#")) return href

  const match = /^([^?#]*)(.*)$/.exec(href)
  if (!match) return href
  const [, path, suffix] = match

  if (path.endsWith("/")) return href
  // Leave file-like paths (/foo.pdf) alone.
  if (/\.[a-z\d]+$/i.test(path)) return href

  return `${path}/${suffix}`
}
