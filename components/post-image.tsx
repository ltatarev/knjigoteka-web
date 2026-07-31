import Image from "next/image"
import { imageSize } from "@/lib/image-size"
import * as styles from "./post.css"

// Container width="tight" is 848px with 32px padding either side.
const SIZES = "(max-width: 848px) 100vw, 784px"

export function CoverImage({ src, alt }: { src: string; alt: string }) {
  const { width, height } = imageSize(src)
  return (
    <div
      className={styles.coverImage}
      style={{ maxWidth: `${width}px`, aspectRatio: `${width} / ${height}` }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={SIZES}
        style={{ objectFit: "cover" }}
        priority
      />
    </div>
  )
}

export function BodyImage({ src, alt }: { src: string; alt: string }) {
  const { width, height } = imageSize(src)
  return (
    <div
      className={styles.bodyImage}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Image src={src} alt={alt} fill sizes={SIZES} style={{ objectFit: "cover" }} />
    </div>
  )
}
