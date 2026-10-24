import type { FactionState } from '../types/gameState'
import { CHARACTERS, type CharacterMapEntry } from '../data/characters/roster'
import { FACTION_NAMES, isFactionKey } from '../data/factions/factionNames'

export interface MemoryEcho {
  subjectId: string   // roster id (e.g. 'character_gregor_maric') or `faction:<key>`
  name: string        // sentence subject, e.g. 'Gregor Marić' or 'The Iron Covenant'
}

/** Smallest absolute 'add' change that someone notices. */
export const MEMORY_THRESHOLD = 5

const CHARACTER_PREFIX = 'character_'
const FACTION_SUBJECT_PREFIX = 'faction:'
const PERSONAL_PREFIX = 'personal.'
const FACTION_PREFIX = 'factions.'

/**
 * Character-specific stats that belong to one person. Keys are exact stat paths,
 * values are roster ids. Advisors without a roster entry (Soraya, Valdek) are
 * deliberately absent, so their trust changes name no one.
 */
export const PERSON_STATS: Readonly<Record<string, string>> = {
  vaelInfluence: 'character_lucan_vael',
  seridaTrust: 'character_serida_valk',
  seridaMorale: 'character_serida_valk',
  danika_loyalty: 'character_danika_oberlin',
  'advisorTrust.vyktor': 'character_vyktor_reznik',
  'advisorTrust.danika': 'character_danika_oberlin',
  'advisorTrust.theron': 'character_aldric_theron',
  'advisorTrust.dusek': 'character_colonel_dusek',
}

type MemoryChoice = {
  stateChanges?: readonly { stat: string; operation?: string; value: number }[]
  statEffects?: readonly { stat: string; value: number }[]
}

interface PlainChange {
  stat: string
  value: number
}

function stripCharacterPrefix(id: string): string {
  return id.startsWith(CHARACTER_PREFIX) ? id.slice(CHARACTER_PREFIX.length) : id
}

function findCharacterById(id: string): CharacterMapEntry | undefined {
  const bareId = stripCharacterPrefix(id)
  return CHARACTERS.find(character => stripCharacterPrefix(character.id) === bareId)
}

function toMemorySubject(character: CharacterMapEntry): MemoryEcho {
  return { subjectId: character.id, name: character.name }
}

/** Only 'add' changes count; legacy statEffects are always 'add'. */
function addChanges(choice: MemoryChoice): readonly PlainChange[] {
  const modifiers = choice.stateChanges ?? []
  if (modifiers.length > 0) {
    return modifiers.filter(modifier => modifier.operation === undefined || modifier.operation === 'add')
  }
  return choice.statEffects ?? []
}

function resolveFactionSubject(key: keyof FactionState, presentCharacterIds: readonly string[]): MemoryEcho {
  for (const presentId of presentCharacterIds) {
    const character = findCharacterById(presentId)
    if (character?.factionKey === key) return toMemorySubject(character)
  }
  return { subjectId: `${FACTION_SUBJECT_PREFIX}${key}`, name: FACTION_NAMES[key].subject }
}

function resolvePersonalSubject(stat: string): MemoryEcho | null {
  const key = stat.slice(PERSONAL_PREFIX.length)
  const character = CHARACTERS.find(entry => entry.personalKey === key)
  return character ? toMemorySubject(character) : null
}

function resolveFixedPersonSubject(stat: string): MemoryEcho | null {
  if (!Object.hasOwn(PERSON_STATS, stat)) return null
  const character = findCharacterById(PERSON_STATS[stat])
  return character ? toMemorySubject(character) : null
}

/** Returns who a stat change is about, or null when it names no one. */
function resolveSubject(stat: string, presentCharacterIds: readonly string[]): MemoryEcho | null {
  if (stat.startsWith(PERSONAL_PREFIX)) return resolvePersonalSubject(stat)
  if (stat.startsWith(FACTION_PREFIX)) {
    const key = stat.slice(FACTION_PREFIX.length)
    return isFactionKey(key) ? resolveFactionSubject(key, presentCharacterIds) : null
  }
  return resolveFixedPersonSubject(stat)
}

/**
 * Decides who (if anyone) a choice's notable 'add' change is about. The
 * largest absolute change that resolves to a subject wins; ties keep the
 * earliest change. Inputs are never mutated.
 */
export function memoryEchoFor(
  choice: MemoryChoice,
  presentCharacterIds: readonly string[],
): MemoryEcho | null {
  let best: { magnitude: number; echo: MemoryEcho } | null = null
  for (const change of addChanges(choice)) {
    const magnitude = Math.abs(change.value)
    if (magnitude < MEMORY_THRESHOLD) continue
    const echo = resolveSubject(change.stat, presentCharacterIds)
    if (echo === null) continue
    if (best === null || magnitude > best.magnitude) best = { magnitude, echo }
  }
  return best?.echo ?? null
}
