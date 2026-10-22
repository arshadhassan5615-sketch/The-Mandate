const files = import.meta.glob<string>('./*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' })

function basenameOf(path: string): string {
  const file = path.slice(path.lastIndexOf('/') + 1)
  return file.slice(0, file.lastIndexOf('.'))
}

/** Painted stills for scene cutscenes, keyed by file basename (the name scene JSON uses). */
export const CUTSCENE_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [basenameOf(path), url]),
)

export function getCutsceneArt(key: string): string | null {
  return CUTSCENE_ART[key] ?? null
}

/** Sorted keys of the `<key>__<ministerId>` variants registered for a still. */
export function cutsceneVariants(key: string): string[] {
  const prefix = `${key}__`
  return Object.keys(CUTSCENE_ART)
    .filter(name => name.startsWith(prefix))
    .sort()
}
