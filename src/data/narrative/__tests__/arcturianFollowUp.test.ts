import { describe, expect, it } from 'vitest'
import letterResponse from '../act3/letter_response_arcturian.json'
import quarterlyReport from '../act3/letter_arcturian_quarterly_report.json'
import resolutions from '../../commitments/resolutions.json'

const FOLLOW_UP_ID = 'letter_arcturian_quarterly_report'

describe('Arcturian aid follow-up scene', () => {
  it('chains from the promise choice to the quarterly report', () => {
    const promiseChoice = letterResponse.choices.find((choice) => choice.id === 'letter_arcturian_response')
    const targets = (promiseChoice?.chainTriggers ?? []).map((trigger) => trigger.targetNodeId)

    expect(targets).toContain(FOLLOW_UP_ID)
  })

  it('offers exactly the three outcome flags, one per choice', () => {
    const flags = quarterlyReport.choices.map((choice) => choice.flags)

    expect(flags).toEqual([
      ['arcturian_aid_accounted'],
      ['arcturian_aid_disclosed'],
      ['arcturian_aid_diverted'],
    ])
  })

  it('gives every choice at least two stateChanges', () => {
    const counts = quarterlyReport.choices.map((choice) => choice.stateChanges.length)

    expect(Math.min(...counts)).toBeGreaterThanOrEqual(2)
  })

  it('sets every keptBy and brokenBy flag of the Arcturian rule in the follow-up scene', () => {
    const rule = resolutions.find((candidate) => candidate.madeBy === 'arcturian_aid_received')
    const sceneFlags = new Set(quarterlyReport.choices.flatMap((choice) => choice.flags))
    const outcomeFlags = [...(rule?.keptBy ?? []), ...(rule?.brokenBy ?? [])]

    expect(rule).toBeDefined()
    expect(outcomeFlags.length).toBeGreaterThan(0)
    for (const flag of outcomeFlags) {
      expect(sceneFlags.has(flag)).toBe(true)
    }
  })
})
