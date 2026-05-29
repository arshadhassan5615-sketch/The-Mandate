import Dexie, { type Table } from 'dexie'
import type { GameState } from '../types/gameState'
import type { ScheduledChain } from '../engine/ChainReactionEngine'

export interface SaveRecord {
  slot: number              // 0 = autosave, 1-10 = manual
  name: string              // player-editable label
  timestamp: number         // Date.now()
  weekNumber: number
  actNumber: number
  playTimeMinutes: number
  gameState: GameState
  visitedSceneIds: string[]
  activeFlags: string[]
  unlockedCodexIds: string[]
  scheduledChains: ScheduledChain[]
  forcedChainIds: string[]
}

class MandateDB extends Dexie {
  saves!: Table<SaveRecord, number>

  constructor() {
    super('the-mandate-v1')
    this.version(1).stores({ saves: 'slot' })
  }
}

export const db = new MandateDB()
