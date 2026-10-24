import type { NarrativeNode, SceneChoice } from '../types/narrative'
import resolutions from '../data/commitments/resolutions.json'
import { stripOuterQuotes } from './quotes'

export interface Commitment {
  id: string            // `${sceneId}:${segmentId}:${choiceId}`, or `${sceneId}:${choiceId}` when the choice has no segment
  sceneId: string
  sceneTitle: string
  choiceId: string
  week: number
  quote: string         // the choice text without outer quotation marks
  witnesses: string[]   // scene characters minus the player, order kept, no duplicates
  flags: string[]       // the choice's flags
}

export type CommitmentStatus = 'outstanding' | 'kept' | 'broken'

export interface ResolutionRule {
  madeBy: string        // a flag the promising choice sets
  keptBy?: string[]     // any of these active → kept
  brokenBy?: string[]   // any of these active → broken (wins over kept)
}

const PLAYER_CHARACTER_ID = 'katerin_ashavel'
const MAX_QUOTE_LENGTH = 240
const ELLIPSIS = '…'

/** Phrases that mark a choice as a promise. Word-bounded, so 'compromise' never matches 'promise'. Vows and threats ("I will not let…") are not promises; author a choice with "commitment": true when the text makes one in other words. */
export const PROMISE_PATTERN = /\b(?:I promise|you have my word|I give you my word|I guarantee|I swear|I pledge|I['’]ll make sure|I will make sure|on my honour|on my honor)\b/i

/** Curated promise resolution rules, loaded from data/commitments/resolutions.json. */
export const RESOLUTION_RULES: readonly ResolutionRule[] = resolutions

/** A choice is a commitment when its author override says so, else when its text contains a promise phrase. */
export function isCommitmentChoice(choice: Pick<SceneChoice, 'text' | 'commitment'>): boolean {
  if (choice.commitment === true) return true
  if (choice.commitment === false) return false
  return PROMISE_PATTERN.test(choice.text)
}

function cleanQuote(text: string): string {
  const unquoted = stripOuterQuotes(text)
  if (unquoted.length <= MAX_QUOTE_LENGTH) return unquoted
  return unquoted.slice(0, MAX_QUOTE_LENGTH - 1) + ELLIPSIS
}

function witnessesOf(characters: readonly string[]): string[] {
  const witnesses = new Set(characters.filter(id => id !== PLAYER_CHARACTER_ID))
  return [...witnesses]
}

/**
 * Builds a ledger entry from a promising choice made in a scene during a week.
 * The segment is part of the id when given, so the same choice id in two branches
 * of one scene stays two promises. Without a segment the id is `scene:choice`.
 */
export function commitmentFromChoice(
  scene: Pick<NarrativeNode, 'id' | 'title' | 'characters'>,
  choice: Pick<SceneChoice, 'id' | 'text' | 'flags'>,
  week: number,
  segmentId?: string | null,
): Commitment {
  const id = segmentId
    ? `${scene.id}:${segmentId}:${choice.id}`
    : `${scene.id}:${choice.id}`
  return {
    id,
    sceneId: scene.id,
    sceneTitle: scene.title,
    choiceId: choice.id,
    week,
    quote: cleanQuote(choice.text),
    witnesses: witnessesOf(scene.characters),
    flags: [...(choice.flags ?? [])],
  }
}

/**
 * Works out whether a commitment is kept or broken. Only rules whose madeBy flag
 * is on the commitment apply. Any active brokenBy flag breaks it, which wins over kept.
 */
export function commitmentStatus(
  commitment: Commitment,
  activeFlags: readonly string[],
  rules: readonly ResolutionRule[],
): CommitmentStatus {
  const active = new Set(activeFlags)
  const applicable = rules.filter(rule => commitment.flags.includes(rule.madeBy))
  if (applicable.some(rule => (rule.brokenBy ?? []).some(flag => active.has(flag)))) return 'broken'
  if (applicable.some(rule => (rule.keptBy ?? []).some(flag => active.has(flag)))) return 'kept'
  return 'outstanding'
}
