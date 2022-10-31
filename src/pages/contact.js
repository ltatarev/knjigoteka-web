import * as React from "react"
import Layout from "../components/layout"
import { Container, Box, Heading, Text, Link, Flex } from "../components/ui"
import ChevronRight from "../components/chevron-right"
import * as styles from "../components/404.css"

export default function Contact() {
  return (
    <Layout title="Kontakt">
      <Box paddingY={4}>
        <Container>
          <Flex variant="column">
            <Flex variant="column" gap={0}>
              <Text variant="lead" className={styles.text}>
                Radno vrijeme udruge: utorak, od 17 do 19 sati Dom kulture
                Bilje, Ul. kralja Zvonimira 2, Bilje
              </Text>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Layout>
  )
}
