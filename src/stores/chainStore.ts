import { create } from 'zustand'
import type { ChainTrigger } from '../types/narrative'
import type { GameState } from '../types/gameState'
import { buildScheduled, resolveChains, type ScheduledChain } from '../engine/ChainReactionEngine'
import { MAX_OVERDUE_CHAINS_PER_WEEK } from '../engine/weekCompletion'
import { useJournalStore } from './journalStore'
import { getScene } from '../engine/NarrativeEngine'

interface ChainStore {
  scheduled: ScheduledChain[]

  // Called inside narrativeStore.processChoice after a choice is committed
  schedule: (triggers: ChainTrigger[], currentWeek: number, sourceId: string, sceneId?: string) => void

  // Called inside weekStore.completeWeek after the week counter advances.
  // Returns scene IDs that fired this tick; removes them from the queue.
  // maxOverdue caps backlog fires only; on-time chains (fireWeek === week) always fire.
  process: (week: number, state: GameState, flags: string[], maxOverdue?: number) => string[]

  // Mid-week delivery. Only chains due exactly this week (fireWeek === week) are
  // evaluated; overdue chains are left untouched so their single roll is kept
  // for completeWeek's capped tick. Returns fired target ids.
  processOnTime: (week: number, state: GameState, flags: string[]) => string[]
}

function recordFiredConsequences(week: number, firedChains: ScheduledChain[]): void {
  // Update journal entries with consequences when chains fire
  for (const chain of firedChains) {
    if (chain.sceneId && chain.sourceId) {
      const scene = getScene(chain.targetNodeId)
      const consequenceText = scene
        ? `Week ${week}: "${scene.title}" — a consequence of your earlier decision.`
        : `Week ${week}: A consequence of your earlier decision has manifested.`
      useJournalStore.getState().updateConsequences(chain.sceneId, chain.sourceId, consequenceText)
    }
  }
}

export const useChainStore = create<ChainStore>((set, get) => ({
  scheduled: [],

  schedule: (triggers, currentWeek, sourceId, sceneId) => {
    if (!triggers.length) return
    const entries = buildScheduled(triggers, currentWeek, sourceId, sceneId)
    // Dedupe: the same (target, fireWeek) pending twice is always redundant —
    // recurring schedules used to accumulate duplicates here (H-2).
    const pending = new Set(get().scheduled.map(c => `${c.targetNodeId}@${c.fireWeek}`))
    const fresh = entries.filter(e => !pending.has(`${e.targetNodeId}@${e.fireWeek}`))
    if (!fresh.length) return
    set(s => ({ scheduled: [...s.scheduled, ...fresh] }))
  },

  process: (week, state, flags, maxOverdue = MAX_OVERDUE_CHAINS_PER_WEEK) => {
    // Capped fire rate: a backlog of overdue chains (e.g. an old autosave)
    // drains a few per week instead of all at once. Overflow stays scheduled.
    const { fired, remaining, firedChains } = resolveChains(
      get().scheduled,
      week,
      state,
      flags,
      maxOverdue,
    )
    set({ scheduled: remaining })
    recordFiredConsequences(week, firedChains)
    return fired
  },

  processOnTime: (week, state, flags) => {
    // Only chains due this week are evaluated. Overdue chains are untouched, so
    // their probability roll is not spent on every mid-week rebuild.
    const { scheduled } = get()
    const due = scheduled.filter(c => c.fireWeek === week)
    const rest = scheduled.filter(c => c.fireWeek !== week)
    const { fired, remaining, firedChains } = resolveChains(due, week, state, flags, 0)
    set({ scheduled: [...rest, ...remaining] })
    recordFiredConsequences(week, firedChains)
    return fired
  },
}))

// Enable Hot Module Replacement (HMR) for Zustand store
// Preserves scheduled chain reactions across hot reloads
if (import.meta.hot) {
  import.meta.hot.accept()
}
