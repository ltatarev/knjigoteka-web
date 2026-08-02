import fs from "node:fs"
import path from "node:path"

/**
 * Intrinsic dimensions for images under public/.
 *
 * Post frontmatter carries only { src, alt } — the migration stamped width and
 * height onto the structural JSON but not onto posts. next/image needs real
 * dimensions to reserve layout space, and the live GatsbyImage constrained the
 * image to its intrinsic width, so we read the headers off disk at build time.
 *
 * The migrated posts are all JPEG and PNG. Notion-synced posts are WebP —
 * notion-sync.mjs re-encodes every download through sharp. Anything else throws
 * loudly rather than guessing.
 */

export type Dimensions = { width: number; height: number }

const cache = new Map<string, Dimensions>()

function readPng(buf: Buffer): Dimensions | null {
  // 8-byte signature, then the IHDR chunk: length(4) type(4) width(4) height(4)
  if (buf.length < 24) return null
  if (buf.readUInt32BE(0) !== 0x89504e47) return null
  if (buf.toString("ascii", 12, 16) !== "IHDR") return null
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

// Start-of-frame markers carry the dimensions. DHT/DAC/RST/SOS do not.
const SOF = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
])

function readJpeg(buf: Buffer): Dimensions | null {
  if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) return null
  let offset = 2
  while (offset < buf.length - 1) {
    if (buf[offset] !== 0xff) {
      offset++
      continue
    }
    const marker = buf[offset + 1]
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2
      continue
    }
    if (marker === 0xda) break // start of scan; dimensions would have come first
    const length = buf.readUInt16BE(offset + 2)
    if (SOF.has(marker)) {
      // marker(2) length(2) precision(1) height(2) width(2)
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      }
    }
    offset += 2 + length
  }
  return null
}

/**
 * WebP wraps VP8 data in a RIFF container: "RIFF" size "WEBP" then a chunk
 * whose fourcc says which of three encodings follows. sharp emits plain "VP8 "
 * for the quality settings the sync uses, but lossless and extended files turn
 * up whenever an image has transparency or animation, so all three are read.
 */
function readWebp(buf: Buffer): Dimensions | null {
  if (buf.length < 30) return null
  if (buf.toString("ascii", 0, 4) !== "RIFF") return null
  if (buf.toString("ascii", 8, 12) !== "WEBP") return null

  switch (buf.toString("ascii", 12, 16)) {
    case "VP8 ": {
      // Lossy: 3-byte frame tag, then the 0x9d012a start code, then 14-bit
      // width and height little-endian. The top 2 bits are the scale factor.
      if (buf.readUIntLE(23, 3) !== 0x2a019d) return null
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      }
    }
    case "VP8L": {
      // Lossless: 0x2f signature, then 14 bits width-1 and 14 bits height-1
      // packed into the next 4 bytes.
      if (buf[20] !== 0x2f) return null
      const bits = buf.readUInt32LE(21)
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      }
    }
    case "VP8X": {
      // Extended: flags(1) reserved(3), then canvas width-1 and height-1 as
      // 24-bit little-endian.
      return {
        width: buf.readUIntLE(24, 3) + 1,
        height: buf.readUIntLE(27, 3) + 1,
      }
    }
    default:
      return null
  }
}

/** `src` is a public-root-relative path, e.g. /images/posts/rebecca-cover.jpg */
export function imageSize(src: string): Dimensions {
  const cached = cache.get(src)
  if (cached) return cached

  const file = path.join(process.cwd(), "public", src)
  let buf: Buffer
  try {
    buf = fs.readFileSync(file)
  } catch {
    throw new Error(`image not found: ${src} (looked in public${src})`)
  }

  const size = readPng(buf) ?? readJpeg(buf) ?? readWebp(buf)
  if (!size || !size.width || !size.height) {
    throw new Error(`could not read dimensions from ${src}`)
  }

  cache.set(src, size)
  return size
}
