import layoutJson from "@/content/data/layout.json"
import type { LayoutData } from "./types"

export const layout = layoutJson as LayoutData

export const headerNav = layout.header.navItems
export const headerCta = layout.header.cta
export const footer = layout.footer
