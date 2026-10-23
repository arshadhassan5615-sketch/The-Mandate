// Optional painted province medals. Save src/assets/images/seals/<provinceId>.png and the map uses it instead of the drawn seal.
const SEAL_ART = import.meta.glob('./images/seals/*.png', { eager: true, import: 'default' }) as Record<string, string>

/** Picks the url for a file name from a glob map, or null. Pure; exported for tests. */
export function pickArt(art: Readonly<Record<string, string>>, fileName: string): string | null {
  const key = Object.keys(art).find(path => path.endsWith(`/${fileName}`))
  return key === undefined ? null : art[key]
}

/** The painted medal for a province, or null when none has been added. */
export function getSealArt(provinceId: string): string | null {
  return pickArt(SEAL_ART, `${provinceId}.png`)
}
