import type { GovernanceOutcome } from '../types/ending'

const epilogueArtModules = import.meta.glob<string>('./images/epilogues/ending_*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
})

const ART_BY_BASENAME: Record<string, string> = Object.fromEntries(
  Object.entries(epilogueArtModules).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, ''),
    url,
  ]),
)

export function getEpilogueArt(outcome: GovernanceOutcome): string | null {
  return ART_BY_BASENAME[`ending_${outcome}`] ?? null
}
