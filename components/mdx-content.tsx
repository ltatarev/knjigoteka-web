import { Children, isValidElement, type ReactNode } from "react"
import { MDXRemote } from "next-mdx-remote/rsc"
import { BodyImage } from "./framed-image"

/**
 * Renders a post body.
 *
 * next-mdx-remote over @next/mdx: @next/mdx compiles MDX through the bundler,
 * which means every body has to be a module the bundler knows about at build
 * time. Post bodies are read from content/ at runtime and need gray-matter for
 * frontmatter regardless, so a string-in renderer fits. This runs as a Server
 * Component and ships no client JS.
 *
 * Bodies use only paragraphs, blockquotes, bold and images.
 */
const Img = ({ src, alt }: { src?: string; alt?: string }) =>
  src ? <BodyImage src={src} alt={alt ?? ""} /> : null

/**
 * Markdown wraps a standalone image in a paragraph, but BodyImage renders a
 * <div>, which is invalid inside <p> and fails hydration. Drop the paragraph
 * when the image is all it holds.
 */
function Paragraph({ children }: { children?: ReactNode }) {
  const kids = Children.toArray(children)
  const only = kids.length === 1 ? kids[0] : null
  if (isValidElement(only) && only.type === Img) return only
  return <p>{children}</p>
}

const components = {
  img: Img,
  p: Paragraph,
}

export default function MdxContent({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} />
}
