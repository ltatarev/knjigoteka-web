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
