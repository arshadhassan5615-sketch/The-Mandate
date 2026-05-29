import { create } from 'zustand'
import type { ChainTrigger } from '../types/narrative'
import type { GameState } from '../types/gameState'
import { buildScheduled, resolveChains, type ScheduledChain } from '../engine/ChainReactionEngine'
import { useJournalStore } from './journalStore'
import { getScene } from '../engine/NarrativeEngine'

interface ChainStore {
  scheduled: ScheduledChain[]

  // Called inside narrativeStore.processChoice after a choice is committed
  schedule: (triggers: ChainTrigger[], currentWeek: number, sourceId: string, sceneId?: string) => void

  // Called inside weekStore.completeWeek after the week counter advances.
  // Returns scene IDs that fired this tick; removes them from the queue.
  process: (week: number, state: GameState, flags: string[]) => string[]
}

export const useChainStore = create<ChainStore>((set, get) => ({
  scheduled: [],

  schedule: (triggers, currentWeek, sourceId, sceneId) => {
    if (!triggers.length) return
    const entries = buildScheduled(triggers, currentWeek, sourceId, sceneId)
    set(s => ({ scheduled: [...s.scheduled, ...entries] }))
  },

  process: (week, state, flags) => {
    const { fired, remaining, firedChains } = resolveChains(get().scheduled, week, state, flags)
    set({ scheduled: remaining })

    // Update journal entries with consequences when chains fire
    for (const chain of firedChains ?? []) {
      if (chain.sceneId && chain.sourceId) {
        const scene = getScene(chain.targetNodeId)
        const consequenceText = scene
          ? `Week ${week}: "${scene.title}" — a consequence of your earlier decision.`
          : `Week ${week}: A consequence of your earlier decision has manifested.`
        useJournalStore.getState().updateConsequences(chain.sceneId, chain.sourceId, consequenceText)
      }
    }

    return fired
  },
}))
