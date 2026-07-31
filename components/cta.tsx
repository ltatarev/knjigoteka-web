import * as React from "react"
import {
  Container,
  Section,
  Heading,
  Text,
  ButtonList,
  Kicker,
  Flex,
} from "./ui"
import { ConstrainedImage } from "./framed-image"
import type { CtaBlock } from "@/lib/types"

export default function Cta({ kicker, heading, text, image, links }: CtaBlock) {
  return (
    <Container width="fullbleed">
      <Section padding={5} radius="large" background="muted">
        <Heading center>
          {kicker && <Kicker center>{kicker}</Kicker>}
          {heading}
        </Heading>
        <Text as="p" center variant="lead">
          {text}
        </Text>
        <ButtonList links={links} variant="center" reversed />
        {image && (
          <Flex variant="center">
            <ConstrainedImage src={image.src} alt={image.alt} />
          </Flex>
        )}
      </Section>
    </Container>
  )
}
