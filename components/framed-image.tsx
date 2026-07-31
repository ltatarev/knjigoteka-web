import Image from "next/image"
import { imageSize } from "@/lib/image-size"
import * as styles from "./framed-image.css"

// Container width="tight" is 848px with 32px padding either side.
const TIGHT_SIZES = "(max-width: 848px) 100vw, 784px"
// Feature images sit in a Box width="half" inside the 1280px container.
const HALF_SIZES = "(max-width: 40em) 100vw, 608px"

function Framed({
  src,
  alt,
  className,
  sizes,
  constrain = false,
  priority = false,
}: {
  src: string
  alt: string
  className: string
  sizes: string
  /**
   * Cap the box at the image's intrinsic width, as GatsbyImage's constrained
   * layout did. Wrappers that carried an explicit width:100% skip this.
   */
  constrain?: boolean
  priority?: boolean
}) {
  const { width, height } = imageSize(src)
  return (
    <div
      className={className}
      style={{
        aspectRatio: `${width} / ${height}`,
        ...(constrain ? { maxWidth: `${width}px` } : null),
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        style={{ objectFit: "cover" }}
        priority={priority}
      />
    </div>
  )
}

export function CoverImage(props: { src: string; alt: string }) {
  return (
    <Framed
      {...props}
      className={styles.coverImage}
      sizes={TIGHT_SIZES}
      constrain
      priority
    />
  )
}

export function BodyImage(props: { src: string; alt: string }) {
  return <Framed {...props} className={styles.bodyImage} sizes={TIGHT_SIZES} />
}

export function FeatureImage(props: { src: string; alt: string }) {
  return (
    <Framed
      {...props}
      className={styles.featureImage}
      sizes={HALF_SIZES}
      constrain
    />
  )
}

/** Uncropped — the live about hero set only width:100% on its wrapper. */
export function AboutHeroImage({ src, alt }: { src: string; alt: string }) {
  const { width, height } = imageSize(src)
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes="100vw"
      className={styles.aboutHeroImage}
      priority
    />
  )
}
