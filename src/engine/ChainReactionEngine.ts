import type { ChainTrigger, Condition } from '../types/narrative'
import type { GameState } from '../types/gameState'
import { evaluateAll } from './conditionEvaluator'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduledChain {
  id: string           // unique instance ID
  targetNodeId: string
  fireWeek: number     // absolute week number when this fires
  conditions?: Condition[]
  probability?: number // 0-1; undefined = always fires
  sourceId: string     // choice.id that created this (for debug)
  sceneId?: string     // scene.id that contained the choice
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

let _seq = 0

export function buildScheduled(
  triggers: ChainTrigger[],
  currentWeek: number,
  sourceId: string,
  sceneId?: string,
): ScheduledChain[] {
  return triggers.map(t => ({
    id: `chain_${++_seq}_${t.targetNodeId}`,
    targetNodeId: t.targetNodeId,
    fireWeek: currentWeek + t.delayWeeks,
    conditions: t.conditions,
    probability: t.probability,
    sourceId,
    sceneId,
  }))
}

// ─── Resolve ──────────────────────────────────────────────────────────────────

// Called once per week advance. Evaluates every pending chain against the new
// week number, game state, and active flags.
//
// Fire rules:
//   - fireWeek > week  → not yet; keep in queue
//   - fireWeek <= week → evaluate conditions + roll probability; fire or drop (not re-queued)
//
// A chain whose conditions fail at fire time is dropped — the political moment passed.
// A chain whose probability roll fails at fire time is also dropped — luck didn't turn.

export function resolveChains(
  scheduled: ScheduledChain[],
  week: number,
  state: GameState,
  flags: string[],
): { fired: string[]; remaining: ScheduledChain[]; firedChains: ScheduledChain[] } {
  const fired: string[] = []
  const firedChains: ScheduledChain[] = []
  const remaining: ScheduledChain[] = []

  for (const chain of scheduled) {
    if (chain.fireWeek > week) {
      remaining.push(chain)
      continue
    }

    // Conditions evaluated at fire time, not at schedule time
    if (chain.conditions?.length && !evaluateAll(chain.conditions, state, flags)) {
      continue  // conditions failed — event no longer relevant
    }

    // Probability roll
    if (chain.probability !== undefined && Math.random() > chain.probability) {
      continue  // didn't happen this run
    }

    fired.push(chain.targetNodeId)
    firedChains.push(chain)
  }

  return { fired, remaining, firedChains }
}
