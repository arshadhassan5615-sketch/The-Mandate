import Dexie, { type Table } from 'dexie'
import type { GameState } from '../types/gameState'
import type { ScheduledChain } from '../engine/ChainReactionEngine'
import type { Decree, PendingLongTermEffect } from '../types/decree'
import type { CabinetState, MinisterRequest } from '../types/minister'
import type { Bill, BillHistoryEntry } from '../types/bills'
import type { JournalEntry } from '../types/journal'
import type { NewsArticle } from '../types/news'
import type { DiplomaticLetter } from '../types/letters'

export interface SaveRecord {
  version: number         // 2 = current; 0/1 = legacy
  slot: number            // 0 = autosave, 1-10 = manual
  name: string            // player-editable label
  timestamp: number       // Date.now()
  weekNumber: number
  actNumber: number
  playTimeMinutes: number
  gameState: GameState
  visitedSceneIds: string[]
  activeFlags: string[]
  unlockedCodexIds: string[]
  metCharacters: string[]
  scheduledChains: ScheduledChain[]
  forcedChainIds: string[]

  // v2 additions — captured for the 6 stores that were previously dropped
  decreeState?: {
    pendingDecrees: Decree[]
    signedDecrees: Decree[]
    rejectedDecrees: Decree[]
    tabledDecrees: Decree[]
    pendingLongTermEffects: PendingLongTermEffect[]
  }
  cabinetState?: CabinetState & {
    pending_requests: MinisterRequest[]
    completed_requests: string[]
  }
  billState?: {
    bills: Bill[]
    history: BillHistoryEntry[]
  }
  journalState?: {
    entries: JournalEntry[]
  }
  newsState?: {
    articles: NewsArticle[]
    readRecords: Record<string, number[]>
    lastReadIndex: number
  }
  letterState?: {
    letters: DiplomaticLetter[]
    readIds: string[]
    currentIndex: number
  }
}

class MandateDB extends Dexie {
  saves!: Table<SaveRecord, number>

  constructor() {
    super('the-mandate-v1')
    this.version(1).stores({ saves: 'slot' })
  }
}

export const db = new MandateDB()
