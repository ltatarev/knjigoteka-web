import { style } from "@vanilla-extract/css"

/**
 * Reproduces the live cover and in-post image treatment.
 *
 * Gatsby rendered `<GatsbyImage style={...}>`, which put the styles on
 * .gatsby-image-wrapper (position:relative; overflow:hidden) and absolutely
 * positioned the real <img> inside at width/height 100% with object-fit:cover.
 * So max-height centre-crops the image, it does not clip the bottom off. The
 * `object-fit:cover` in Gatsby's own inline style sat on the wrapper div, where
 * it did nothing — the rule that mattered came from its stylesheet.
 *
 * aspect-ratio + max-height gets the same box without Gatsby's spacer element.
 */

const imageBox = style({
  position: "relative",
  overflow: "hidden",
})

// Post cover: constrained to the image's intrinsic width (set inline per image).
export const coverImage = style([
  imageBox,
  { borderRadius: "15px", maxHeight: "500px" },
])

// In-post: the live wrapper carried an explicit width:100%, so these stretch to
// the container even when the source is narrower.
export const bodyImage = style([
  imageBox,
  { borderRadius: "15px", width: "100%", maxHeight: "350px" },
])

// Feature cards on /news/ and the homepage.
export const featureImage = style([
  imageBox,
  { borderRadius: "25px", maxHeight: "330px" },
])

// The about hero is uncropped — its class set only width:100%.
export const aboutHeroImage = style({
  width: "100%",
  height: "auto",
})
