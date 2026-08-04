import * as React from "react"
import { Container, Box, Kicker, Heading, Text, Link } from "./ui"
import Feature from "./feature"
import { getAllPosts } from "@/lib/posts"
import type { FeatureListBlock } from "@/lib/types"

export default function FeatureList({ kicker, heading, text }: FeatureListBlock) {
  // Built from the posts collection rather than homepage.json's duplicated
  // copy, so a post added later can appear here. Always the 3 most recent
  // posts (getAllPosts is sorted newest first).
  const posts = getAllPosts().slice(0, 3)

  return (
    <Container width="fullbleed">
      <Box background="muted" radius="large">
        <Box center paddingY={5}>
          <Heading>
            {kicker && <Kicker>{kicker}</Kicker>}
            <Link to="/news">{heading}</Link>
          </Heading>
          {text && <Text>{text}</Text>}
        </Box>
        {posts.map((post, i) => (
          <Feature
            key={post.slug}
            flip={Boolean(i % 2)}
            image={post.coverImage}
            kicker={post.kicker}
            heading={post.listingTitle}
            text={post.excerpt}
            links={[
              {
                type: "homepageLink",
                text: "Pročitajte više",
                href: `/${post.slug}/`,
              },
            ]}
          />
        ))}
      </Box>
    </Container>
  )
}
