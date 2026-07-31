import * as React from "react"
import { Container, Box, Kicker, Heading, Text, Link } from "./ui"
import Feature from "./feature"
import { getPostsInDisplayOrder, HOMEPAGE_SLUGS } from "@/lib/news-order"
import type { FeatureListBlock } from "@/lib/types"

export default function FeatureList({ kicker, heading, text }: FeatureListBlock) {
  // Built from the posts collection rather than homepage.json's duplicated
  // copy, so a post added later can appear here. Which posts, and in what
  // order, is pinned in lib/news-order.ts.
  const bySlug = new Map(getPostsInDisplayOrder().map((p) => [p.slug, p]))
  const posts = HOMEPAGE_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (p) => p !== undefined
  )

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
