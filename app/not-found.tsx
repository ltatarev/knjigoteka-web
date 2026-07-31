import { Container, Box, Heading, Text, Link, Flex } from "@/components/ui"
import ChevronRight from "@/components/chevron-right"
import * as styles from "@/components/not-found.css"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({ title: "Stranica nije pronađena" })

export default function NotFound() {
  return (
    <Box paddingY={4}>
      <Container>
        <Flex variant="column">
          <Heading variant="mega" className={styles.heading}>
            404
          </Heading>
          <Heading as="h1">Stranica nije pronađena</Heading>
          <Flex variant="column" gap={0}>
            <Text className={styles.text}>Nažalost ta stranica ne postoji.</Text>
            <Link to="/" className={styles.link}>
              <span>Povratak</span>
              <ChevronRight className={styles.linkChevron} />
            </Link>
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}
