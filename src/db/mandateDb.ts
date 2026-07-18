import Dexie, { type Table } from 'dexie'
import type { GameState } from '../types/gameState'
import type { ScheduledChain } from '../engine/ChainReactionEngine'
import type { Decree, PendingLongTermEffect } from '../types/decree'
import type { CabinetState, MinisterRequest } from '../types/minister'
import type { Bill, BillHistoryEntry } from '../types/bills'
import type { SittingHistoryEntry } from '../types/parliament'
import type { JournalEntry } from '../types/journal'
import type { NewsArticle } from '../types/news'
import type { DiplomaticLetter } from '../types/letters'

export interface SaveRecord {
  version: number
  slot: number
  name: string
  timestamp: number
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
  /** Persist sitting decisions only — catalog reloads from JSON; currentSittingResults is transient. */
  parliamentState?: {
    sittingHistory: SittingHistoryEntry[]
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
    super('the-mandate-v2')
    this.version(1).stores({
      saves: 'slot, name, timestamp, weekNumber'
    })
  }
}

export const db = new MandateDB()