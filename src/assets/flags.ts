const flagFiles = import.meta.glob<string>('./images/Flags/*.{jpg,jpeg,png,webp,svg}', {
  eager: true,
  import: 'default',
})

const flagByBaseName: Record<string, string> = Object.fromEntries(
  Object.entries(flagFiles).map(([path, url]) => [path.split('/').pop() ?? path, url]),
)

export function getFlagArt(fileName: string): string | null {
  return flagByBaseName[fileName] ?? null
}
