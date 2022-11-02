import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"

export default function GatsbyContentfulLogo() {
  return (
    <StaticImage
      src="../assets/logo.png"
      alt="Knjigoteka Logo"
      placeholder="blurred"
      layout="fixed"
      width={60}
      height={60}
    />
  )
}
