import Image from "next/image"
import { Container, Box, Text, Flex } from "@/components/ui"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({ title: "Kontakt" })

export default function Contact() {
  return (
    <Box>
      <Container>
        {/* Gatsby passed variant="row", which is not a key of flexVariants —
            it resolved to undefined, leaving a plain non-responsive flex row. */}
        <Flex gap={4}>
          <Box>
            <Image
              src="/images/site/contact-reading.png"
              alt="Reading"
              width={575}
              height={456}
              sizes="(max-width: 40em) 100vw, 608px"
              style={{ width: "100%", height: "auto" }}
              priority
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
            <a href="mailto:knjigotekabilje@gmail.com">
              knjigotekabilje@gmail.com
            </a>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}
