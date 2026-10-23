import { useChainStore } from '../stores/chainStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { buildDinnerChainTriggers } from './FamilyDinnerEngine'
import { buildBriefingChainTriggers } from './IntelligenceBriefingEngine'

/**
 * Schedules the recurring family-dinner and intelligence-briefing chains the
 * first time a week starts. Idempotent: flags record that each was scheduled.
 */
export function scheduleWeekStartChains(currentWeek: number): void {
  if (!useNarrativeStore.getState().activeFlags.includes('family_dinner_chains_scheduled')) {
    const dinnerTriggers = buildDinnerChainTriggers(currentWeek)
    if (dinnerTriggers.length > 0) {
      useChainStore.getState().schedule(dinnerTriggers, currentWeek, 'family_dinner_init')
      useNarrativeStore.getState().addFlags(['family_dinner_chains_scheduled'])
    }
  }

  if (!useNarrativeStore.getState().activeFlags.includes('intelligence_briefing_chains_scheduled')) {
    const briefingTriggers = buildBriefingChainTriggers(currentWeek)
    if (briefingTriggers.length > 0) {
      useChainStore.getState().schedule(briefingTriggers, currentWeek, 'intelligence_briefing_init')
      useNarrativeStore.getState().addFlags(['intelligence_briefing_chains_scheduled'])
    }
  }
}
