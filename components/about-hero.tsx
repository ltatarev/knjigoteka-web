import * as React from "react"
import { Container, Section, Text, SuperHeading } from "./ui"
import { AboutHeroImage } from "./framed-image"
import * as styles from "./about-hero.css"
import type { AboutHeroBlock } from "@/lib/types"

export default function AboutHero({ heading, text, image }: AboutHeroBlock) {
  return (
    <Section>
      <Container>
        <SuperHeading className={styles.aboutHeroHeader}>{heading}</SuperHeading>
        {text && <Text className={styles.aboutHeroText}>{text}</Text>}
      </Container>
      <Container width="wide">
        {image && <AboutHeroImage src={image.src} alt={image.alt} />}
      </Container>
    </Section>
  )
}
