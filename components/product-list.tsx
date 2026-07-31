import * as React from "react"
import {
  Container,
  Section,
  FlexList,
  Text,
  Kicker,
  Heading,
  Subhead,
  Box,
  Icon,
} from "./ui"
import type { Product, ProductListBlock } from "@/lib/types"

function ProductItem({ image, heading, text }: Product) {
  return (
    <Box center>
      {image && <Icon image={image} size="large" />}
      {/* No product carries a heading, so this renders an empty h3 — as live. */}
      <Subhead>{heading}</Subhead>
      <Text>{text}</Text>
    </Box>
  )
}

export default function ProductList({
  kicker,
  heading,
  text,
  content,
}: ProductListBlock) {
  return (
    <Section>
      <Container>
        <Box center paddingY={4}>
          <Heading>
            {kicker && <Kicker>{kicker}</Kicker>}
            {heading}
          </Heading>
          {text && <Text>{text}</Text>}
        </Box>
        <FlexList gap={4} variant="responsive">
          {content.map((product, i) => (
            <li key={i}>
              <ProductItem {...product} />
            </li>
          ))}
        </FlexList>
      </Container>
    </Section>
  )
}
