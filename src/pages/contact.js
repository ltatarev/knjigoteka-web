import * as React from "react";
import { graphql } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";
import Layout from "../components/layout";
import { Container, Box, Text, Flex } from "../components/ui";

export default function Contact(props) {
  console.log(props);
  return (
    <Layout title="Kontakt">
      <Box>
        <Container>
          <Flex gap={4} variant="row">
            <Box>
              <StaticImage
                src="../assets/reading.png"
                alt="Reading"
                placeholder="blurred"
                layout="fullWidth"
              />
            </Box>
            <Box>
              <Text variant="bold">Radno vrijeme udruge:</Text>
              <Text>
                utorak, od 17 do 19 sati
                <br />
                Dom kulture Bilje, Ul. kralja Zvonimira 2, Bilje
              </Text>
              <Text variant="bold">E-mail adresa:</Text>
              <a href="mailto:knjigotekabilje@gmail">
                knjigotekabilje@gmail.com
              </a>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
}
