import * as React from "react";
import Layout from "../components/layout";
import { Container, Box, Text, Flex } from "../components/ui";
import * as styles from "../components/404.css";

export default function News() {
  return (
    <Layout title="Kontakt">
      <Box paddingY={4}>
        <Container>
          <Flex variant="column">
            <Flex variant="column" gap={0}>
              <Text variant="lead" className={styles.text}>
                News
              </Text>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
}
