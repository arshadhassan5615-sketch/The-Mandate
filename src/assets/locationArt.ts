const files = import.meta.glob<string>('./images/locations/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' })

function basenameOf(path: string): string {
  const file = path.slice(path.lastIndexOf('/') + 1)
  return file.slice(0, file.lastIndexOf('.'))
}

/** Painted location establishing shots, keyed by file basename. */
export const LOCATION_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [basenameOf(path), url]),
)

export function getLocationArt(key: string): string | null {
  return LOCATION_ART[key] ?? null
}
