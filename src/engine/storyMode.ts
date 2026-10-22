/** Fraction of a harmful change that still lands in Story Mode. */
export const STORY_MODE_FACTOR = 0.5

/** Stats where higher is better: Story Mode softens decreases. Entries ending in '.' are prefixes. */
export const HIGHER_IS_BETTER: readonly string[] = [
  'factions.',
  'advisorTrust.',
  'personal.publicImage',
  'personal.marriageHealth',
  'personal.lioraRelationship',
  'personal.tomasWellbeing',
  'playerPolling',
  'nation.economyHealth',
]

/** Stats where higher is worse: Story Mode softens increases. */
export const HIGHER_IS_WORSE: readonly string[] = ['personal.stressLevel', 'tyvarenHostility']

const SOFTENED_SOURCES = new Set<string | undefined>(['scene_choice', 'weekly_tick', 'cabinet', undefined])

function matches(stat: string, list: readonly string[]): boolean {
  return list.some(entry => (entry.endsWith('.') ? stat.startsWith(entry) : stat === entry))
}

/** Returns the (possibly softened) value of a modifier under Story Mode. */
export function softenForStoryMode(
  stat: string,
  operation: 'add' | 'set' | 'multiply',
  value: number,
  sourceType?: string,
): number {
  if (operation !== 'add' || !SOFTENED_SOURCES.has(sourceType)) return value
  if (value < 0 && matches(stat, HIGHER_IS_BETTER)) return value * STORY_MODE_FACTOR
  if (value > 0 && matches(stat, HIGHER_IS_WORSE)) return value * STORY_MODE_FACTOR
  return value
}
