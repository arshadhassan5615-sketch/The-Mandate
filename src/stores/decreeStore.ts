import { create } from 'zustand'
import type { Decree, PendingLongTermEffect } from '../types/decree'
import type { GameState } from '../types/gameState'
import { ALL_DECREES } from '../data/decrees'
import { useGameStore } from './gameStore'

function evaluatePrerequisites(
  prerequisites: Decree['prerequisites'],
  gameState: GameState
): boolean {
  if (!prerequisites || prerequisites.length === 0) return true
  for (const req of prerequisites) {
    const parts = req.stat.split('.')
    let current: unknown = gameState
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return false
      current = (current as Record<string, unknown>)[part]
    }
    const val = req.value as number
    switch (req.operator) {
      case '<':  if (!((current as number) < val))  return false; break
      case '<=': if (!((current as number) <= val)) return false; break
      case '>':  if (!((current as number) > val))  return false; break
      case '>=': if (!((current as number) >= val)) return false; break
      case '==': if ((current as number) != val)    return false; break
      case '===': if (current !== val)              return false; break
    }
  }
  return true
}

interface DecreeStore {
  pendingDecrees: Decree[]
  signedDecrees: Decree[]
  rejectedDecrees: Decree[]
  tabledDecrees: Decree[]
  selectedDecree: Decree | null
  pendingLongTermEffects: PendingLongTermEffect[]

  initDecrees: (currentWeek: number, gameState: GameState, flags: string[]) => void
  signDecree: (id: string) => void
  rejectDecree: (id: string) => void
  tableDecree: (id: string) => void
  selectDecree: (decree: Decree | null) => void
}

export const useDecreeStore = create<DecreeStore>((set, get) => ({
  pendingDecrees: [],
  signedDecrees: [],
  rejectedDecrees: [],
  tabledDecrees: [],
  selectedDecree: null,
  pendingLongTermEffects: [],

  initDecrees: (currentWeek, gameState) => {
    const { signedDecrees, rejectedDecrees } = get()
    const signedIds = new Set(signedDecrees.map(d => d.id))
    const rejectedIds = new Set(rejectedDecrees.map(d => d.id))
    const tabled = get().tabledDecrees

    const eligible = ALL_DECREES.filter(decree => {
      if (decree.weekProposed > currentWeek) return false
      if (signedIds.has(decree.id)) return false
      if (rejectedIds.has(decree.id)) return false
      if (!evaluatePrerequisites(decree.prerequisites, gameState)) return false
      if (decree.conflictsWith) {
        const hasConflict = decree.conflictsWith.some(cid => signedIds.has(cid))
        if (hasConflict) return false
      }
      return true
    })

    const pending = eligible.filter(d =>
      !signedIds.has(d.id) &&
      !rejectedIds.has(d.id) &&
      !tabled.some(t => t.id === d.id)
    )

    const retabled = tabled.filter(d => {
      if (signedIds.has(d.id) || rejectedIds.has(d.id)) return false
      if (d.conflictsWith) {
        return !d.conflictsWith.some(cid => signedIds.has(cid))
      }
      return true
    })

    const merged = [...pending, ...retabled]
    const deduped = merged.filter((d, i) => merged.findIndex(m => m.id === d.id) === i)

    set({ pendingDecrees: deduped, tabledDecrees: [] })
  },

  signDecree: (id) => {
    const state = get()
    const decree = state.pendingDecrees.find(d => d.id === id)
    if (!decree) return

    const gameStore = useGameStore.getState()

    const immediateMods = decree.immediateEffects.map(e => ({
      stat: e.stat,
      operation: (e.operation ?? 'add') as 'add' | 'set' | 'multiply',
      value: e.value,
    }))
    if (immediateMods.length > 0) {
      gameStore.applyModifiers(immediateMods)
    }

    const newWeek = useGameStore.getState().currentWeek
    const longTerm: PendingLongTermEffect[] = decree.longTermEffects.map(e => ({
      stat: e.stat,
      value: e.value,
      operation: (e.operation ?? 'add') as 'add' | 'set' | 'multiply',
      applyAtWeek: newWeek + (e.delayWeeks ?? 0),
      description: e.description,
    }))

    set(s => ({
      pendingDecrees: s.pendingDecrees.filter(d => d.id !== id),
      signedDecrees: [...s.signedDecrees, { ...decree, signed: true }],
      pendingLongTermEffects: [...s.pendingLongTermEffects, ...longTerm],
    }))
  },

  rejectDecree: (id) => {
    set(s => ({
      pendingDecrees: s.pendingDecrees.filter(d => d.id !== id),
      rejectedDecrees: [...s.rejectedDecrees, { ...get().pendingDecrees.find(d => d.id === id)!, rejected: true }],
    }))
  },

  tableDecree: (id) => {
    set(s => ({
      pendingDecrees: s.pendingDecrees.filter(d => d.id !== id),
      tabledDecrees: [...s.tabledDecrees, { ...get().pendingDecrees.find(d => d.id === id)!, tabled: true }],
    }))
  },

  selectDecree: (decree) => {
    set({ selectedDecree: decree })
  },
}))

// Enable Hot Module Replacement (HMR) for Zustand store
if (import.meta.hot) {
  import.meta.hot.accept()
}
