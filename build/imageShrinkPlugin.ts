import { readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import type { Plugin } from 'vite'

type ImageExt = 'jpg' | 'jpeg' | 'png'

const DEFAULT_MAX_EDGE = 1600
const IMAGE_FILE_PATTERN = /\.(jpg|jpeg|png)$/i
const CONCURRENCY = 8
const JPEG_QUALITY = 80
const PNG_COMPRESSION_LEVEL = 9
const PNG_EFFORT = 8
const BYTES_PER_MB = 1024 * 1024

/**
 * Longest allowed edge (px) for an image, decided by its source folder.
 * `null` means "never resize" (the image overlays the map at map resolution).
 */
export function maxEdgeFor(sourcePath: string): number | null {
  const normalized = '/' + sourcePath.replace(/\\/g, '/').replace(/^\/+/, '')

  if (normalized.includes('/assets/provinces/')) return null
  if (normalized.includes('/assets/maps/')) return 3072
  if (normalized.includes('/assets/potraits/')) return 1024
  if (
    normalized.includes('/images/seals/') ||
    normalized.includes('/images/map-pins/') ||
    normalized.includes('/images/rail-icons/') ||
    normalized.includes('/images/Flags/')
  ) {
    return 512
  }
  if (
    normalized.includes('/assets/cutscenes/') ||
    normalized.includes('/images/epilogues/') ||
    normalized.includes('/images/locations/')
  ) {
    return 1920
  }
  return DEFAULT_MAX_EDGE
}

/**
 * Resizes (only when larger than maxEdge) and re-encodes an image.
 * Returns the original buffer unchanged unless the result is strictly smaller.
 */
export async function shrinkImage(
  input: Buffer,
  ext: ImageExt,
  maxEdge: number | null,
): Promise<Buffer> {
  let pipeline = sharp(input)

  if (maxEdge !== null) {
    const { width = 0, height = 0 } = await pipeline.metadata()
    if (Math.max(width, height) > maxEdge) {
      pipeline = pipeline.resize({
        width: maxEdge,
        height: maxEdge,
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
  }

  const encoded =
    ext === 'png'
      ? pipeline.png({ compressionLevel: PNG_COMPRESSION_LEVEL, effort: PNG_EFFORT })
      : pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })

  const output = await encoded.toBuffer()
  return output.length < input.length ? output : input
}

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      return entry.isDirectory() ? collectFiles(fullPath) : [fullPath]
    }),
  )
  return nested.flat()
}

/** Maps basename -> path relative to the project root (forward slashes). */
async function buildAssetIndex(projectRoot: string): Promise<Map<string, string>> {
  const assetsDir = path.join(projectRoot, 'src', 'assets')
  const files = await collectFiles(assetsDir)
  const index = new Map<string, string>()
  for (const file of files) {
    const basename = path.basename(file)
    if (!index.has(basename)) {
      index.set(basename, path.relative(projectRoot, file).split(path.sep).join('/'))
    }
  }
  return index
}

async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0
  const worker = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const item = items[nextIndex]
      nextIndex += 1
      await task(item)
    }
  }
  const workerCount = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
}

const toMegabytes = (bytes: number): string => (bytes / BYTES_PER_MB).toFixed(1)

export function imageShrinkPlugin(): Plugin {
  let projectRoot = process.cwd()
  let indexPromise: Promise<Map<string, string>> | null = null

  const getAssetIndex = (): Promise<Map<string, string>> => {
    indexPromise ??= buildAssetIndex(projectRoot)
    return indexPromise
  }

  /** Source path if known; `undefined` when the asset cannot be traced to a file. */
  const resolveSourcePath = async (asset: {
    originalFileNames: string[]
    originalFileName: string | null
    name: string | undefined
    names: string[]
  }): Promise<string | undefined> => {
    const direct = asset.originalFileNames?.[0] ?? asset.originalFileName ?? undefined
    if (direct) return direct

    const name = asset.names?.[0] ?? asset.name
    if (!name) return undefined
    const index = await getAssetIndex()
    return index.get(path.basename(name))
  }

  return {
    name: 'image-shrink',
    apply: 'build',
    enforce: 'post',

    configResolved(config) {
      projectRoot = config.root
    },

    async generateBundle(_options, bundle) {
      const images = Object.values(bundle).filter(
        (item) => item.type === 'asset' && IMAGE_FILE_PATTERN.test(item.fileName),
      )

      let totalBefore = 0
      let totalAfter = 0

      await runWithConcurrency(images, CONCURRENCY, async (asset) => {
        if (asset.type !== 'asset') return
        const original = Buffer.from(asset.source)
        totalBefore += original.length
        totalAfter += original.length

        try {
          const sourcePath = await resolveSourcePath(asset)
          const maxEdge = sourcePath === undefined ? DEFAULT_MAX_EDGE : maxEdgeFor(sourcePath)
          const ext = path.extname(asset.fileName).slice(1).toLowerCase() as ImageExt
          const shrunk = await shrinkImage(original, ext, maxEdge)

          if (shrunk !== original) {
            asset.source = shrunk
            totalAfter += shrunk.length - original.length
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.warn(`[image-shrink] kept original for ${asset.fileName}: ${message}`)
        }
      })

      console.log(
        `[image-shrink] ${images.length} images: ${toMegabytes(totalBefore)} MB → ${toMegabytes(totalAfter)} MB`,
      )
    },
  }
}
