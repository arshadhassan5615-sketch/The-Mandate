import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { maxEdgeFor, shrinkImage } from '../../build/imageShrinkPlugin'

const WIDE_WIDTH = 3000
const WIDE_HEIGHT = 2000

async function makeLargeJpeg(): Promise<Buffer> {
  const pixels = Buffer.alloc(WIDE_WIDTH * WIDE_HEIGHT * 3)
  for (let y = 0; y < WIDE_HEIGHT; y++) {
    for (let x = 0; x < WIDE_WIDTH; x++) {
      const offset = (y * WIDE_WIDTH + x) * 3
      pixels[offset] = (x * 7 + y * 3) % 256
      pixels[offset + 1] = (x * y) % 256
      pixels[offset + 2] = (x + y * 11) % 256
    }
  }
  return sharp(pixels, { raw: { width: WIDE_WIDTH, height: WIDE_HEIGHT, channels: 3 } })
    .jpeg({ quality: 95 })
    .toBuffer()
}

describe('maxEdgeFor', () => {
  it('returns null for province overlays so they keep map resolution', () => {
    expect(maxEdgeFor('src/assets/provinces/veltria_north.png')).toBeNull()
  })

  it('returns 3072 for map images', () => {
    expect(maxEdgeFor('/project/src/assets/maps/veltria_full.jpg')).toBe(3072)
  })

  it('returns 1024 for portraits in the potraits folder', () => {
    expect(maxEdgeFor('/project/src/assets/potraits/idris_kaelen.jpeg')).toBe(1024)
  })

  it('returns 512 for seals, map pins, rail icons and flags', () => {
    expect(maxEdgeFor('/project/src/assets/images/seals/civic_medal.jpg')).toBe(512)
    expect(maxEdgeFor('/project/src/assets/images/map-pins/pin.png')).toBe(512)
    expect(maxEdgeFor('/project/src/assets/images/rail-icons/state.jpg')).toBe(512)
    expect(maxEdgeFor('/project/src/assets/images/Flags/veltria.png')).toBe(512)
  })

  it('returns 1920 for cutscenes, epilogues and locations', () => {
    expect(maxEdgeFor('/project/src/assets/cutscenes/intro.jpg')).toBe(1920)
    expect(maxEdgeFor('/project/src/assets/images/epilogues/ending.jpg')).toBe(1920)
    expect(maxEdgeFor('/project/src/assets/images/locations/palace.jpg')).toBe(1920)
  })

  it('returns 1600 for any other image', () => {
    expect(maxEdgeFor('/project/src/assets/images/misc/background.png')).toBe(1600)
  })

  it('treats Windows backslash paths the same as forward slash paths', () => {
    expect(maxEdgeFor('C:\\project\\src\\assets\\maps\\veltria_full.jpg')).toBe(3072)
  })
})

describe('shrinkImage', () => {
  it('resizes a 3000x2000 JPEG to a long edge of 1600 and returns a smaller buffer', async () => {
    const input = await makeLargeJpeg()

    const output = await shrinkImage(input, 'jpeg', 1600)

    const metadata = await sharp(output).metadata()
    expect(Math.max(metadata.width ?? 0, metadata.height ?? 0)).toBe(1600)
    expect(output.length).toBeLessThan(input.length)
  })

  it('returns the identical buffer when a tiny PNG cannot be made smaller', async () => {
    const input = await sharp({
      create: { width: 2, height: 2, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    })
      .png()
      .toBuffer()

    const output = await shrinkImage(input, 'png', 1600)

    expect(output).toBe(input)
  })

  it('keeps original dimensions when maxEdge is null', async () => {
    const input = await makeLargeJpeg()

    const output = await shrinkImage(input, 'jpeg', null)

    const metadata = await sharp(output).metadata()
    expect(metadata.width).toBe(WIDE_WIDTH)
    expect(metadata.height).toBe(WIDE_HEIGHT)
  })
})
