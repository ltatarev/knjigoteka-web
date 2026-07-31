import { DM_Sans, DM_Mono } from "next/font/google"

/**
 * Weights are pinned deliberately. Gatsby loaded DM Sans 400/500/700 and DM Mono
 * 400/500 via @fontsource. The theme defines `extrabold: 800` and uses it for
 * every heading, but 800 was never actually loaded — headings render at 700 on
 * the live site. Loading the variable font here would silently make every
 * heading heavier, so we ship the same weights Gatsby did.
 *
 * latin-ext is required for Croatian diacritics (č ć š ž đ).
 */
export const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
})

export const dmMono = DM_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})
