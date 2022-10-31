import * as React from "react"
import Layout from "../components/layout"
import { Container, Box, Heading, Text, Link, Flex } from "../components/ui"
import ChevronRight from "../components/chevron-right"
import * as styles from "../components/404.css"

export default function NotFound() {
  return (
    <Layout title="Stranica nije pronađena">
      <Box paddingY={4}>
        <Container>
          <Flex variant="column">
            <Heading variant="mega" className={styles.heading}>
              404
            </Heading>
            <Heading as="h1">Stranica nije pronađena</Heading>
            <Flex variant="column" gap={0}>
              <Text className={styles.text}>
                Nažalost ta stranica ne postoji.
              </Text>
              <Link to="/" className={styles.link}>
                <span>Povratak</span>
                <ChevronRight className={styles.linkChevron} />
              </Link>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Layout>
  )
}
