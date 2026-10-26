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
import type { ChoiceRecord } from '../stores/narrativeStore'
import type { Commitment } from '../engine/commitments'
import type { MeetingNote } from '../types/meetingNotes'

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
  /** Week-scoped completion ledger (Fix A). Optional: older saves default to []. */
  completedItemIds?: string[]
  /** Choices made this playthrough. Optional: older saves default to []. */
  choiceLog?: ChoiceRecord[]
  /** Province news items already read. Optional: older saves default to []. */
  provinceNewsSeenIds?: string[]
  /** Promises given this playthrough. Optional: older saves default to []. */
  commitments?: Commitment[]
  /** Katerin's automatic meeting notes. Optional: older saves default to []. */
  meetingNotes?: MeetingNote[]
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
    /** Week whose weekly minister requests were already generated; absent in older saves. */
    requests_generated_week?: number | null
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