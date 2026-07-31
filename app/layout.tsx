import type { Metadata } from "next"
import { dmSans, dmMono } from "./fonts"
import Header from "@/components/header"
import Footer from "@/components/footer"
import "@/styles/global.css"

// Every page sets its own tags through lib/metadata.ts. Deliberately no default
// description: the Gatsby Head component emitted one only when the page carried
// it, so a fallback here would add descriptions the live site does not have.
// The Head component applied no title template either, so neither do we.
export const metadata: Metadata = {
  metadataBase: new URL("https://knjigoteka.club"),
  title: "Knjigoteka Bilje",
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
