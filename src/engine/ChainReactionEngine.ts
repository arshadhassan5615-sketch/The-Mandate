import type { ChainTrigger, Condition } from '../types/narrative'
import type { GameState } from '../types/gameState'
import { evaluateAll } from './conditionEvaluator'
import { getScene } from './NarrativeEngine'

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
  maxFires: number = Number.MAX_SAFE_INTEGER,
): { fired: string[]; remaining: ScheduledChain[]; firedChains: ScheduledChain[] } {
  const fired: string[] = []
  const firedChains: ScheduledChain[] = []
  const remaining: ScheduledChain[] = []

  for (const chain of scheduled) {
    if (chain.fireWeek > week) {
      remaining.push(chain)
      continue
    }

    // Week deferral: a chain due before its target scene opens waits for the
    // scene's week instead of firing early (e.g. an old autosave's backlog, or
    // a long delay overshooting into content written for a later week). It
    // stays scheduled — never dropped. Targets outside the registry fire on
    // schedule, since there is no authored week to defer to.
    const targetWeek = getScene(chain.targetNodeId)?.weekAvailable
    if (targetWeek !== undefined && week < targetWeek) {
      remaining.push(chain)
      continue
    }

    // Conditions evaluated at fire time, not at schedule time
    if (chain.conditions?.length && !evaluateAll(chain.conditions, state, flags)) {
      if (import.meta.env.DEV) {
        console.warn('[Chain] dropped (conditions failed):', chain.targetNodeId, chain.id)
      }
      continue  // conditions failed — event no longer relevant
    }

    // Probability roll
    if (chain.probability !== undefined && Math.random() > chain.probability) {
      if (import.meta.env.DEV) {
        console.warn('[Chain] dropped (probability roll failed):', chain.targetNodeId, chain.id)
      }
      continue  // didn't happen this run
    }

    // Late fire: due in an earlier week, still playing now. Logged so backlog
    // drains are visible in diagnostics instead of silent.
    if (import.meta.env.DEV && chain.fireWeek < week) {
      console.info(`[Chain] late-fire: "${chain.targetNodeId}" due week ${chain.fireWeek}, firing week ${week}`)
    }

    // Per-week cap: once this week's slots are full, carry the chain forward.
    // It stays scheduled (never dropped) and fires on a later week — a backlog
    // of overdue chains (old autosave) must not flood a single week.
    if (fired.length >= maxFires) {
      remaining.push(chain)
      continue
    }

    fired.push(chain.targetNodeId)
    firedChains.push(chain)
  }

  return { fired, remaining, firedChains }
}
