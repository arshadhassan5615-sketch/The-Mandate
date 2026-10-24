import type { Condition, FlagCondition, SceneChoice, StatCondition } from '../types/narrative'
import type { FactionState, GameState } from '../types/gameState'
import { evaluateAll, evaluateCondition } from './conditionEvaluator'
import { ENGINE_CONTINUE_ID } from './NarrativeEngine'
import { FACTION_NAMES } from '../data/factions/factionNames'

export type ChoiceAvailability =
  | { kind: 'available' }
  | { kind: 'locked'; reason: string }   // shown greyed with the reason
  | { kind: 'hidden' }                    // not shown at all

/** Lower-case noun phrases used in lock reasons, one per direction of the stat. */
export interface StatLabel {
  more: string   // used for '>' and '>=' ("Requires <more>")
  less: string   // used for '<' and '<=' ("Requires <less>")
}

const FIXED_STAT_LABELS: Readonly<Record<string, StatLabel>> = {
  'nation.economyHealth': { more: 'a stronger economy', less: 'a weaker economy' },
  'nation.militaryReadiness': { more: 'stronger military readiness', less: 'lower military readiness' },
  'nation.militaryTech': { more: 'a more modern military', less: 'a less modern military' },
  'nation.pressFreedom': { more: 'a freer press', less: 'a more restrained press' },
  'nation.internationalStanding': { more: 'greater international standing', less: 'lower international standing' },
  'nation.publicOrder': { more: 'greater public order', less: 'less public order' },
  'personal.publicImage': { more: 'a stronger public image', less: 'a lower public profile' },
  'personal.personalWealth': { more: 'more personal wealth', less: 'less personal wealth' },
  'personal.marriageHealth': { more: 'a stronger marriage', less: 'a strained marriage' },
  'personal.tomasWellbeing': { more: 'Tomas to be doing better', less: 'Tomas to be struggling' },
  'personal.moralCompass': { more: 'a firmer moral compass', less: 'a more flexible conscience' },
  'advisorTrust.theron': { more: "Theron's trust", less: "less of Theron's trust" },
}

function factionLabel(key: keyof FactionState): StatLabel {
  const { name } = FACTION_NAMES[key]
  // Civic Renewal is named without an article ("the support of Civic Renewal").
  const named = key === 'reformists' ? name : `the ${name}`
  return {
    more: `the support of ${named}`,
    less: `less support from ${named}`,
  }
}

const FACTION_STAT_LABELS: Readonly<Record<string, StatLabel>> = Object.fromEntries(
  (Object.keys(FACTION_NAMES) as Array<keyof FactionState>).map(key => [
    `factions.${key}`,
    factionLabel(key),
  ]),
)

/** Stat path → lower-case noun phrase used in lock reasons. */
export const STAT_LABELS: Readonly<Record<string, StatLabel>> = {
  ...FIXED_STAT_LABELS,
  ...FACTION_STAT_LABELS,
}

function isFlagCondition(c: Condition): c is FlagCondition {
  return (c as { type?: string }).type === 'flag'
}

function isStatCondition(c: Condition): c is StatCondition {
  return !isFlagCondition(c)
}

/** A flag condition, or a stat condition on a 'flags.' path, is a story gate. */
function isStoryGate(c: Condition): boolean {
  return isFlagCondition(c) || (c as StatCondition).stat.startsWith('flags.')
}

function resolveLabel(stat: string): StatLabel | null {
  return Object.hasOwn(STAT_LABELS, stat) ? STAT_LABELS[stat] : null
}

/**
 * Returns the in-words reason a stat condition is not met, or null when the
 * condition cannot be explained to the player (unknown stat, or '==' / '!=').
 */
export function lockReason(condition: StatCondition): string | null {
  const label = resolveLabel(condition.stat)
  if (label === null) return null
  switch (condition.operator) {
    case '>':
    case '>=':
      return `Requires ${label.more}`
    case '<':
    case '<=':
      return `Requires ${label.less}`
    default:
      return null
  }
}

/**
 * Decides how a choice is shown: available, locked with a reason (stat-gated
 * only), or hidden (story-gated, or stat-gated with no explainable reason).
 */
export function choiceAvailability(
  choice: Pick<SceneChoice, 'conditions'>,
  state: GameState,
  flags: readonly string[],
): ChoiceAvailability {
  const conditions = choice.conditions ?? []
  const flagList = [...flags]
  if (evaluateAll(conditions, state, flagList)) return { kind: 'available' }

  const failing = conditions.filter(c => !evaluateCondition(c, state, flagList))
  if (failing.some(isStoryGate)) return { kind: 'hidden' }

  const [first] = failing.filter(isStatCondition)
  if (first === undefined) return { kind: 'hidden' }

  const reason = lockReason(first)
  return reason === null ? { kind: 'hidden' } : { kind: 'locked', reason }
}

export interface DisplayChoice { choice: SceneChoice; lockedReason: string | null }

/** The choices to show, in scene order: available ones, and stat-locked ones with their reason. If none is available, a terminal Continue is added so the scene can always proceed. */
export function displayChoices(
  choices: readonly SceneChoice[],
  state: GameState,
  flags: readonly string[],
): DisplayChoice[] {
  const shown: DisplayChoice[] = []
  for (const choice of choices) {
    const availability = choiceAvailability(choice, state, flags)
    if (availability.kind === 'hidden') continue
    shown.push({
      choice,
      lockedReason: availability.kind === 'locked' ? availability.reason : null,
    })
  }
  const hasAvailable = shown.some(entry => entry.lockedReason === null)
  if (hasAvailable) return shown
  return [...shown, { choice: { id: ENGINE_CONTINUE_ID, text: 'Continue…' }, lockedReason: null }]
}
