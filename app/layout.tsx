import type { Metadata } from "next"
import { dmSans, dmMono } from "./fonts"
import Header from "@/components/header"
import Footer from "@/components/footer"
import "@/styles/global.css"

// Defaults from gatsby-config.js siteMetadata. Individual pages override title
// and description; the Gatsby Head component applied no title template, so
// neither do we.
export const metadata: Metadata = {
  metadataBase: new URL("https://knjigoteka.club"),
  title: "Knjigoteka Bilje",
  description: "Udruga ljubitelja knjiga Bilje",
  twitter: { card: "summary" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hr" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
