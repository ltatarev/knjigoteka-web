import { MDXRemote } from "next-mdx-remote/rsc"
import { BodyImage } from "./post-image"

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
const components = {
  img: ({ src, alt }: { src?: string; alt?: string }) =>
    src ? <BodyImage src={src} alt={alt ?? ""} /> : null,
}

export default function MdxContent({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} />
}
