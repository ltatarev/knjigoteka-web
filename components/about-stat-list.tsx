import * as React from "react"
import { Container, Section, FlexList, Box, Text } from "./ui"
import * as styles from "./about-stat-list.css"
import type { AboutStatListBlock, AboutStat } from "@/lib/types"

function Stat({ value, label }: AboutStat) {
  return (
    <Box width="fitContent" className={styles.statContainer}>
      {value && <Text variant="stat">{value}</Text>}
      {label && <Text variant="statLabel">{label}</Text>}
    </Box>
  )
}

export default function AboutStatList({ content }: AboutStatListBlock) {
  return (
    <Section>
      <Container>
        <FlexList className={styles.statList} variant="center" responsive>
          {content.map((stat, i) => (
            <Stat key={i} {...stat} />
          ))}
        </FlexList>
      </Container>
    </Section>
  )
}
