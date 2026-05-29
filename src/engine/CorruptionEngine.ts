import type { CorruptionEntry, GameState } from '../types/gameState'

// Map narrative flags to corruption ledger entries
const CORRUPTION_FLAG_MAP: Record<string, Omit<CorruptionEntry, 'id' | 'weekRecorded' | 'discovered' | 'discoveryWeek'>> = {
  conflict_of_interest_steel: {
    description: 'Invested in Armadine Industries, a steel company dependent on government contracts',
    witnesses: ['Mikhael Dorin', 'Armadine board members'],
    evidence: 'Personal investment records showing shares purchased during Chancellorship',
  },
  conflict_of_interest_trade_zone: {
    description: 'Purchased Aldenmoor Port Bonds before signing the Free Trade Zone Act',
    witnesses: ['Elara Vostane', 'Treasury officials'],
    evidence: 'Bond purchase records dated before FTZ Act signature',
  },
  vael_investment: {
    description: 'Invested in Margrave Vael\'s private Thornfeld Opportunity Trust',
    witnesses: ['Margrave Lucan Vael', 'Fund administrators', 'Twelve other investors'],
    evidence: 'Fund membership records and capital transfer documentation',
  },
  hidden_investment: {
    description: 'Used offshore shell company to conceal Vael fund investment',
    witnesses: ['Lytheiran banking intermediary', 'Shell company registrar'],
    evidence: 'Amber Coast shell company registration and fund transfer records',
  },
  bet_against_krone: {
    description: 'Took a short position against the Veltrian Krone while serving as Chancellor',
    witnesses: ['Lytheiran banker', 'Foreign exchange broker'],
    evidence: 'Short position records, shell company documentation, trade execution logs',
  },
  inside_information_trade: {
    description: 'Used non-public economic information gained as Chancellor to profit from currency speculation',
    witnesses: ['Lytheiran banker', 'Central bank officials (unwitting)'],
    evidence: 'Timeline correlation between policy briefings and trade execution dates',
  },
  offshore_holdings: {
    description: 'Maintains undisclosed offshore financial holdings in foreign jurisdictions',
    witnesses: ['Lytheiran banking officials', 'Shell company administrators'],
    evidence: 'Foreign bank account records and shell company registration documents',
  },
  plausible_deniability: {
    description: 'Used spouse\'s name to invest in a conflict-of-interest company while maintaining deniability',
    witnesses: ['Jonas Ashavel', 'Mikhael Dorin'],
    evidence: 'Investment records in Jonas Ashavel\'s name with clear connection to Chancellor\'s office',
  },
  financially_entangled_vael: {
    description: 'Has a significant financial relationship with oligarch Lucan Vael',
    witnesses: ['Margrave Lucan Vael', 'Fund administrators'],
    evidence: 'Investment records, meeting logs, and correspondence with Vael',
  },
  lobbying_questionable_5k: {
    description: 'Deployed substantial personal funds to influence Assembly vote',
    witnesses: ['Vyktor Reznik', 'Assembly whip counters', 'Opposition MPs'],
    evidence: 'Campaign expenditure records and lobbyist testimony',
  },
  lobbying_corrupt_10k: {
    description: 'Deployed massive personal funds to buy Assembly votes',
    witnesses: ['Vyktor Reznik', 'Multiple Assembly members', 'Financial investigators'],
    evidence: 'Large-scale fund disbursements correlated with vote switches',
  },
  lobbying_vote_buying: {
    description: 'Credibly accused of buying Assembly votes through personal wealth',
    witnesses: ['Opposition leaders', 'Independent MPs', 'Electoral Commission investigators'],
    evidence: 'Pattern of personal payments to swing-vote MPs and their affiliates',
  },
}

/**
 * Calculate the weekly chance a corruption flag is discovered (% chance out of 100)
 */
export function calculateDiscoveryChance(gameState: GameState, activeFlags: string[]): number {
  const pressFreedom = gameState.nation.pressFreedom
  const bcaExists = activeFlags.includes('bca_funded')
  const nadiaInvestigating = activeFlags.includes('nadia_investigating_vyktor') ||
                              activeFlags.includes('nadia_investigation_endorsed') ||
                              activeFlags.includes('investigation_unrestricted')

  return Math.min(
    (pressFreedom * 0.3) +
    (bcaExists ? 30 : 0) +
    (nadiaInvestigating ? 20 : 0),
    95  // Cap at 95% — some things stay hidden
  )
}

/**
 * Run corruption discovery checks for all flagged corruption actions.
 * Returns any newly discovered corruption entries.
 */
export function processCorruptionDiscovery(
  gameState: GameState,
  activeFlags: string[],
): CorruptionEntry[] {
  const chance = calculateDiscoveryChance(gameState, activeFlags)
  const existingLedger = gameState.corruptionLedger
  const newEntries: CorruptionEntry[] = []

  for (const [flag, entryData] of Object.entries(CORRUPTION_FLAG_MAP)) {
    if (!activeFlags.includes(flag)) continue

    // Check if already in ledger
    const alreadyRecorded = existingLedger.some(e =>
      e.description === entryData.description && e.discovered
    )
    if (alreadyRecorded) continue

    // Check if the flag was recorded in ledger but not yet discovered
    const undiscoveredEntry = existingLedger.find(e =>
      e.description === entryData.description && !e.discovered
    )

    // Roll for discovery
    const roll = Math.random() * 100
    if (roll <= chance) {
      if (undiscoveredEntry) {
        // Update existing entry
        newEntries.push({
          ...undiscoveredEntry,
          discovered: true,
          discoveryWeek: gameState.currentWeek,
        })
      } else {
        // Create new entry
        newEntries.push({
          id: `corruption_${flag}_${gameState.currentWeek}`,
          weekRecorded: gameState.currentWeek,
          description: entryData.description,
          witnesses: entryData.witnesses,
          evidence: entryData.evidence,
          discovered: true,
          discoveryWeek: gameState.currentWeek,
        })
      }
    }
  }

  return newEntries
}

/**
 * Add undiscovered corruption flags to the ledger (called when flag is first set via choices).
 * These are recorded but not yet discovered.
 */
export function recordCorruptionFlag(
  gameState: GameState,
  flag: string,
): CorruptionEntry | null {
  const entryData = CORRUPTION_FLAG_MAP[flag]
  if (!entryData) return null

  // Don't record duplicates
  const exists = gameState.corruptionLedger.some(e => e.description === entryData.description)
  if (exists) return null

  return {
    id: `corruption_${flag}_${gameState.currentWeek}`,
    weekRecorded: gameState.currentWeek,
    description: entryData.description,
    witnesses: entryData.witnesses,
    evidence: entryData.evidence,
    discovered: false,
    discoveryWeek: null,
  }
}

/**
 * Returns the number of publicly discovered corruption entries
 */
export function getDiscoveredCount(ledger: CorruptionEntry[]): number {
  return ledger.filter(e => e.discovered).length
}

/**
 * Check if impeachment should be triggered (3+ public corruption discoveries)
 */
export function shouldTriggerImpeachment(discoveredCount: number): boolean {
  return discoveredCount >= 3
}
