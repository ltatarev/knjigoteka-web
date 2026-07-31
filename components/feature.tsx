import * as React from "react"
import {
  Container,
  Section,
  Flex,
  Box,
  Subhead,
  Kicker,
  Text,
  ButtonList,
} from "./ui"
import { FeatureImage } from "./framed-image"
import type { SiteLink } from "@/lib/types"
import type { Backgrounds } from "./ui.css"

export type FeatureProps = {
  image?: { src: string; alt: string }
  kicker?: string
  heading?: string
  text?: string
  links?: SiteLink[]
  flip?: boolean
  /**
   * The Gatsby news page passed background="background", which is not a key of
   * styles.backgrounds — it resolved to undefined and rendered transparent.
   * "none" says that explicitly instead of relying on a failed lookup.
   */
  background?: Backgrounds | "none"
}

export default function Feature({
  image,
  kicker,
  heading,
  text,
  links,
  flip,
  background = "muted",
}: FeatureProps) {
  return (
    <Section
      padding={1}
      background={background === "none" ? undefined : background}
    >
      <Container>
        <Flex gap={4} variant="responsive">
          <Box width="half" order={flip ? 1 : undefined}>
            {image && <FeatureImage src={image.src} alt={image.alt} />}
          </Box>
          <Box width="half">
            <Subhead>
              {kicker && <Kicker>{kicker}</Kicker>}
              {heading}
            </Subhead>
            <Text variant="lead">{text}</Text>
            <ButtonList links={links} />
          </Box>
        </Flex>
      </Container>
    </Section>
  )
}
