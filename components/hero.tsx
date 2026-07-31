import * as React from "react"
import {
  Box,
  ButtonList,
  Container,
  Flex,
  Heading,
  Kicker,
  Section,
  Subhead,
  Text,
} from "./ui"
import { ConstrainedImage } from "./framed-image"
import type { HeroBlock } from "@/lib/types"

export default function Hero({
  kicker,
  heading,
  subhead,
  text,
  image,
  links,
}: HeroBlock) {
  return (
    <Section>
      <Container>
        <Flex gap={4} variant="responsive">
          <Box width="half">
            {image && (
              <ConstrainedImage src={image.src} alt={image.alt} priority />
            )}
          </Box>
          <Box width="half">
            <Heading as="h1">
              {kicker && <Kicker>{kicker}</Kicker>}
              {heading}
            </Heading>
            {/* The live hero has no subhead, so this renders an empty h2.
                Kept, because removing it changes the vertical rhythm. */}
            <Subhead as="h2">{subhead}</Subhead>
            <Text as="p">{text}</Text>
            <ButtonList links={links} />
          </Box>
        </Flex>
      </Container>
    </Section>
  )
}
