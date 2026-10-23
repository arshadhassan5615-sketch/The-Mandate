import { beforeEach, describe, expect, it } from 'vitest'
import { scheduleWeekStartChains } from '../weekStartChains'
import { buildDinnerChainTriggers } from '../FamilyDinnerEngine'
import { buildBriefingChainTriggers } from '../IntelligenceBriefingEngine'
import { useChainStore } from '../../stores/chainStore'
import { useNarrativeStore } from '../../stores/narrativeStore'

const DINNER_FLAG = 'family_dinner_chains_scheduled'
const BRIEFING_FLAG = 'intelligence_briefing_chains_scheduled'

describe('scheduleWeekStartChains', () => {
  beforeEach(() => {
    useNarrativeStore.getState().resetAll()
    useChainStore.setState(useChainStore.getInitialState())
  })

  it('sets the scheduled flags for each chain that has triggers this week', () => {
    // Arrange
    const hasDinner = buildDinnerChainTriggers(1).length > 0
    const hasBriefing = buildBriefingChainTriggers(1).length > 0

    // Act
    scheduleWeekStartChains(1)

    // Assert
    const { activeFlags } = useNarrativeStore.getState()
    expect(activeFlags.includes(DINNER_FLAG)).toBe(hasDinner)
    expect(activeFlags.includes(BRIEFING_FLAG)).toBe(hasBriefing)
  })

  it('schedules nothing new when called a second time', () => {
    // Arrange
    scheduleWeekStartChains(1)
    const scheduledAfterFirstCall = useChainStore.getState().scheduled.length

    // Act
    scheduleWeekStartChains(1)

    // Assert
    expect(useChainStore.getState().scheduled.length).toBe(scheduledAfterFirstCall)
  })
})
