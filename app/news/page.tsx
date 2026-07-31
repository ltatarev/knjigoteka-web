import { Container } from "@/components/ui"
import Feature from "@/components/feature"
import { getPostsInDisplayOrder } from "@/lib/news-order"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({ title: "Novosti" })

export default function News() {
  const posts = getPostsInDisplayOrder()

  return (
    <Container>
      {posts.map((post, i) => (
        <Feature
          key={post.slug}
          background="none"
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
    </Container>
  )
}
