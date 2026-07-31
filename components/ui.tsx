import NextLink from "next/link"
import Image from "next/image"
import * as React from "react"
import { isAbsoluteUrl, withTrailingSlash } from "@/lib/links"
import type { SiteImage, SiteLink } from "@/lib/types"
import * as styles from "./ui.css"

// Space tokens are numeric keys, so `gutter && styles.gutter[gutter]` can yield
// 0 — filter(Boolean) drops it, exactly as the untyped original did.
type ClassValue = string | number | false | null | undefined
type ClassList = ClassValue[]

export const cx = (...args: ClassList) => args.filter(Boolean).join(" ")

type BaseProps = {
  as?: React.ElementType
  cx?: ClassList
  className?: string
  // Matches the untyped Gatsby original: every primitive forwards arbitrary DOM
  // props through to the rendered element.
  [key: string]: any
}

export function Base({
  as: Component = "div",
  cx: _cx = [],
  className,
  ...props
}: BaseProps) {
  return <Component className={cx(..._cx, className)} {...props} />
}

export function Container({
  width = "normal",
  ...props
}: { width?: styles.Containers } & BaseProps) {
  return <Base cx={[styles.containers[width]]} {...props} />
}

export function Flex({
  variant,
  gap = 3,
  gutter,
  wrap,
  responsive,
  marginY,
  alignItems,
  cx: _cx = [],
  ...props
}: {
  variant?: styles.FlexVariants
  gap?: keyof typeof styles.flexGap
  gutter?: keyof typeof styles.gutter
  wrap?: boolean
  responsive?: boolean
  marginY?: keyof typeof styles.marginY
  alignItems?: styles.FlexVariants
  cx?: ClassList
} & BaseProps) {
  return (
    <Base
      cx={[
        styles.flex,
        variant && styles.flexVariants[variant],
        responsive && styles.flexVariants.responsive,
        wrap && styles.flexVariants.wrap,
        gutter && styles.gutter[gutter],
        gutter ? styles.flexGap[0] : styles.flexGap[gap],
        marginY && styles.marginY[marginY],
        alignItems && styles.flexVariants[alignItems],
        ..._cx,
      ]}
      {...props}
    />
  )
}

export function Box({
  width = "full",
  background,
  padding,
  paddingY,
  radius,
  center = false,
  order,
  cx: _cx = [],
  ...props
}: {
  width?: styles.Widths
  background?: styles.Backgrounds
  padding?: keyof typeof styles.padding
  paddingY?: keyof typeof styles.paddingY
  radius?: keyof typeof styles.radii
  center?: boolean
  order?: keyof typeof styles.order
  cx?: ClassList
} & BaseProps) {
  return (
    <Base
      cx={[
        styles.widths[width],
        background && styles.backgrounds[background],
        padding && styles.padding[padding],
        paddingY && styles.paddingY[paddingY],
        radius && styles.radii[radius],
        center && styles.box.center,
        order && styles.order[order],
        ..._cx,
      ]}
      {...props}
    />
  )
}

export function FlexList(props: React.ComponentProps<typeof Flex>) {
  return <Flex as="ul" cx={[styles.list]} {...props} />
}

export function Space({
  size = "auto",
  ...props
}: { size?: keyof typeof styles.margin } & BaseProps) {
  return <Base cx={[styles.margin[size]]} {...props} />
}

// theme.css.ts mirrors every space token to a negative counterpart at runtime
// (Object.assign), so these maps carry keys TypeScript can't see statically.
const negative = (map: Record<string, string>, n: number | undefined) =>
  n === undefined ? undefined : map[String(-n)]

export function Nudge({
  left,
  right,
  top,
  bottom,
  ...props
}: {
  left?: number
  right?: number
  top?: number
  bottom?: number
} & BaseProps) {
  return (
    <Base
      cx={[
        negative(styles.marginLeft, left),
        negative(styles.marginRight, right),
        negative(styles.marginTop, top),
        negative(styles.marginBottom, bottom),
      ]}
      {...props}
    />
  )
}

export function Section(props: React.ComponentProps<typeof Box>) {
  return <Box as="section" className={styles.section} {...props} />
}

export function Text({
  variant = "body",
  center = false,
  bold = false,
  ...props
}: {
  variant?: styles.TextVariants
  center?: boolean
  bold?: boolean
} & BaseProps) {
  return (
    <Base
      cx={[
        styles.text[variant],
        center && styles.text.center,
        bold && styles.text.bold,
      ]}
      {...props}
    />
  )
}

export function SuperHeading(props: BaseProps) {
  return <Text as="h1" variant="superHeading" {...props} />
}

export function Heading(props: BaseProps) {
  return <Text as="h2" variant="heading" {...props} />
}

export function Subhead(props: BaseProps) {
  return <Text as="h3" variant="subhead" {...props} />
}

export function Kicker(props: BaseProps) {
  return <Text variant="kicker" {...props} />
}

export function Link({
  to,
  href,
  // `Base` consumes `as` before it ever reaches here; stripping it keeps our
  // polymorphic prop from colliding with next/link's own `as`.
  as: _as,
  ...props
}: { to?: string; href?: string } & BaseProps) {
  const url = href || to || ""
  if (isAbsoluteUrl(url)) {
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    return <a href={url} className={styles.link} {...props} />
  }
  return (
    <NextLink
      href={withTrailingSlash(url)}
      className={styles.link}
      {...props}
    />
  )
}

export function NavLink(props: React.ComponentProps<typeof Link>) {
  return <Base as={Link} cx={[styles.navlink]} {...props} />
}

export function Button({
  variant = "primary",
  ...props
}: { variant?: styles.ButtonVariants } & React.ComponentProps<typeof Link>) {
  return <Base as={Link} cx={[styles.buttons[variant]]} {...props} />
}

export function ButtonList({
  links = [],
  reversed = false,
  ...props
}: { links?: SiteLink[]; reversed?: boolean } & BaseProps) {
  const getVariant = (i: number): styles.ButtonVariants => {
    if (reversed) {
      return i === 0 ? "reversed" : "linkReversed"
    }
    return i === 0 ? "primary" : "link"
  }
  return (
    <FlexList marginY={4} {...props}>
      {links &&
        links.map((link, i) => (
          <li key={link.href}>
            <Button href={link.href} variant={getVariant(i)}>
              {link.text}
            </Button>
          </li>
        ))}
    </FlexList>
  )
}

export function Icon({
  image,
  size = "medium",
}: {
  image: SiteImage
  size?: styles.IconSizes
}) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      className={styles.icons[size]}
    />
  )
}

export function IconLink(props: React.ComponentProps<typeof NavLink>) {
  return <NavLink cx={[styles.iconLink]} {...props} />
}

export function InteractiveIcon(props: BaseProps) {
  return <Base as="button" cx={[styles.interactiveIcon]} {...props} />
}

export function VisuallyHidden(props: BaseProps) {
  return <Base as="span" cx={[styles.visuallyHidden]} {...props} />
}
