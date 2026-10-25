import { getFlagArt } from './flags'
import { getSealArt } from './sealArt'

export type CodexImageKind = 'flag' | 'medal' | 'portrait' | 'picture'

export interface CodexImage {
  kind: CodexImageKind
  src?: string
  characterId?: string
  caption?: string
}

/** Drop-in images: src/assets/images/codex/<entryId>.<ext> or <entryId>--<anything>.<ext>. */
const DROP_IN_FILES = import.meta.glob<string>('./images/codex/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
})

/** Captions for drop-in files, keyed by file base name (without extension). Missing key means no caption. */
export const CODEX_IMAGE_CAPTIONS: Record<string, string> = {}

/** Built-in flags per codex entry id. Files are resolved through getFlagArt; missing files are skipped. */
export const NATION_FLAGS: Record<string, { file: string; caption?: string }[]> = {
  veltria_overview: [{ file: 'Veltria.jpg', caption: 'Flag of the Republic of Veltria' }],
  nation_tyvaren_confederation: [{ file: 'Tyvaren Confederation.jpg', caption: 'Flag of the Tyvaren Confederation' }],
  nation_arcturian_commonwealth: [{ file: 'Arcturia_.jpg', caption: 'Flag of the Arcturian Commonwealth' }],
  nation_orythian_dominion: [{ file: 'Orythian Dominion.jpg', caption: 'Flag of the Orythian Dominion' }],
  nation_lytheira: [{ file: 'lytheira.jpg', caption: 'Flag of Lytheira' }],
  nation_morivask: [
    { file: 'morivask.jpg', caption: 'Flag of the Skala junta · since 1959' },
    { file: 'morivask_republic.jpg', caption: 'Republic of Morivask · until 1959' },
  ],
  faction_dravenni: [{ file: 'dravenni.jpg', caption: 'Dravenni flag' }],
}

const DROP_IN_EXTENSION = /\.(png|jpg|jpeg|webp)$/

/** Splits drop-in file paths into a main image (for entryId) and extra images (entryId--*). Pure; exported for tests. */
export function resolveDropIns(
  files: Readonly<Record<string, string>>,
  entryId: string,
): { main: CodexImage | null; extras: CodexImage[] } {
  const entries = Object.entries(files)
    .map(([path, src]) => {
      const fileName = path.split('/').pop() ?? path
      return { base: fileName.replace(DROP_IN_EXTENSION, ''), src }
    })
    .sort((a, b) => a.base.localeCompare(b.base))

  const toImage = (base: string, src: string): CodexImage => {
    const caption = CODEX_IMAGE_CAPTIONS[base]
    return caption === undefined ? { kind: 'picture', src } : { kind: 'picture', src, caption }
  }

  const mainEntry = entries.find(e => e.base === entryId)
  const extras = entries
    .filter(e => e.base.startsWith(`${entryId}--`))
    .map(e => toImage(e.base, e.src))

  return {
    main: mainEntry ? toImage(mainEntry.base, mainEntry.src) : null,
    extras,
  }
}

/** "province_ashenmere" → "Ashenmere"; "some_name" → "Some Name". */
function titleCaseId(id: string): string {
  return id
    .split('_')
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

function builtInFlags(entryId: string): CodexImage[] {
  const flags = NATION_FLAGS[entryId] ?? []
  return flags.flatMap(({ file, caption }) => {
    const src = getFlagArt(file)
    if (src === null) return []
    return [caption === undefined ? { kind: 'flag' as const, src } : { kind: 'flag' as const, src, caption }]
  })
}

function builtInMedal(entryId: string): CodexImage[] {
  const provinceId = entryId.replace(/^province_/, '')
  if (provinceId === entryId) return []
  const src = getSealArt(provinceId)
  if (src === null) return []
  return [{ kind: 'medal', src, caption: `Seal of ${titleCaseId(provinceId)}` }]
}

function builtInPortrait(entryId: string): CodexImage[] {
  if (!entryId.startsWith('character_')) return []
  return [{ kind: 'portrait', characterId: entryId.replace(/^character_/, '') }]
}

/**
 * Images for a codex entry, main image first. Empty when the entry has none.
 * Main image: drop-in <entryId>.<ext>, else the first built-in (flag, then medal, then portrait).
 * Alternatives follow: drop-in extras (<entryId>--*), then the remaining built-ins.
 */
export function getCodexImages(entryId: string): CodexImage[] {
  const dropIns = resolveDropIns(DROP_IN_FILES, entryId)
  const builtIns = [
    ...builtInFlags(entryId),
    ...builtInMedal(entryId),
    ...builtInPortrait(entryId),
  ]

  if (dropIns.main) return [dropIns.main, ...dropIns.extras, ...builtIns]
  const [first, ...rest] = builtIns
  if (!first) return dropIns.extras
  return [first, ...dropIns.extras, ...rest]
}
