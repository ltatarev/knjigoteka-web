import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Container, Box, Heading } from "@/components/ui"
import { CoverImage } from "@/components/post-image"
import MdxContent from "@/components/mdx-content"
import { getAllPostSlugs, getPostBySlug } from "@/lib/posts"

// Posts live at root-level slugs (/rebecca/, /book-club-muza/, ...). Anything
// not in content/posts is a 404, same as Gatsby.
export const dynamicParams = false

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  // The Gatsby Head component used the `description` field; `excerpt` backs it
  // up for the posts where Contentful left description empty.
  const description = post.description || post.excerpt

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      images: [post.coverImage.src],
    },
    twitter: {
      card: "summary",
      title: post.title,
      description,
      images: [post.coverImage.src],
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <Box paddingY={5}>
      <Container width="tight">
        <Heading as="h1">{post.title}</Heading>
        <CoverImage src={post.coverImage.src} alt={post.coverImage.alt} />
        <MdxContent source={post.content} />
        <p>
          <i>S ljubavlju prema knjigama,</i>
          <br />
          <b>Knjigoteka Bilje</b>
        </p>
      </Container>
    </Box>
  )
}
