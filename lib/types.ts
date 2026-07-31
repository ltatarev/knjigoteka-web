/**
 * Shapes of the migrated content in `content/data/*.json` and the frontmatter of
 * `content/posts/*.mdx`. These mirror the old Contentful content types — the
 * `type` discriminator on each block is the former Contentful content type id.
 */

export type SiteImage = {
  src: string
  alt: string
  width: number
  height: number
}

/**
 * Post frontmatter carries no intrinsic dimensions — unlike the structural
 * content in content/data/*.json, which the migration stamped with width and
 * height. Post pages read the dimensions off disk at build time instead.
 */
export type PostImage = {
  src: string
  alt: string
}

export type Post = {
  /** Filename without extension. This is the live URL path — never derived. */
  slug: string
  title: string
  listingTitle: string
  /** Normalised to YYYY-MM-DD. */
  date: string
  kicker: string
  description: string
  excerpt: string
  coverImage: PostImage
  images: PostImage[]
  /** Raw markdown body, unrendered. */
  content: string
}

export type SiteLink = {
  type: "homepageLink"
  text: string
  href: string
}

export type NavItem = {
  type: "navItem"
  text: string
  href: string
}

export type SocialService = "INSTAGRAM" | "FACEBOOK"

export type SocialLink = {
  type: "socialLink"
  service: SocialService
  username: string
}

export type LayoutData = {
  name: string
  header: {
    type: "layoutHeader"
    name: string
    navItems: NavItem[]
    cta?: SiteLink
  }
  footer: {
    type: "layoutFooter"
    name: string
    links: SiteLink[]
    meta?: SiteLink[]
    socialLinks: SocialLink[]
    copyright: string
  }
}
