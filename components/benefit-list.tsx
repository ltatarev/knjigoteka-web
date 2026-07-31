import * as React from "react"
import {
  Container,
  Section,
  FlexList,
  Box,
  Icon,
  Heading,
  Text,
  Space,
} from "./ui"
import type { BenefitListBlock, Benefit } from "@/lib/types"

function BenefitItem({ image, heading, text }: Benefit) {
  return (
    <Box as="li" width="third" padding={4} paddingY={3}>
      {image && <Icon image={image} size="small" />}
      <Space size={2} />
      <Heading variant="medium">{heading}</Heading>
      <Text>{text}</Text>
    </Box>
  )
}

export default function BenefitList({ heading, text, content }: BenefitListBlock) {
  return (
    <Section>
      <Container>
        <Box center>
          {heading && <Heading>{heading}</Heading>}
          {text && <Text variant="lead">{text}</Text>}
        </Box>
        <Space size={3} />
        <FlexList gutter={3} variant="start" responsive wrap>
          {content.map((benefit, i) => (
            <BenefitItem key={i} {...benefit} />
          ))}
        </FlexList>
      </Container>
    </Section>
  )
}
