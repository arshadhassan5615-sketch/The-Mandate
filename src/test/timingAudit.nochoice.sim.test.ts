// Scene-timing audit, no-choice profiles (4 of 8). Walks weeks 1-103 through the
// real week flow and writes timing-report.nochoice.json. The second group run
// (this file or timingAudit.choice.sim.test.ts) merges both into
// timing-report.json / timing-report.md at the project root.
//
//   $env:MANDATE_TIMING='1'; npx vitest run src/test/timingAudit.nochoice.sim.test.ts
//
// Split in two so each file stays well inside the default worker heap: one
// file walking all eight profiles ran out of memory after about six.
// Report only: nothing in game code or data is changed.
import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { resolve } from 'node:path'

import { setWaiter, resetWorld } from './simHarness'
import { RULES_TEXT, writeTimingGroup, type TimingReport, type VoteRecord, type TimingFinding, type ProfileSummary } from './timingAudit'
import { NOCHOICE_PROFILES, auditProfile } from './timingAuditWalk'

const RUN = process.env.MANDATE_TIMING === '1'
// Vitest runs from the project root (the-mandate/), where the reports land.
const REPORT_DIR = resolve(process.cwd())

describe.skipIf(!RUN)('scene timing audit, no-choice profiles (env MANDATE_TIMING=1)', () => {
  const summaries: ProfileSummary[] = []
  const findings: TimingFinding[] = []
  const votes: VoteRecord[] = []

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    setWaiter(async ms => {
      await vi.advanceTimersByTimeAsync(ms)
    })
    resetWorld()
  })

  afterEach(() => {
    setWaiter(null)
    vi.useRealTimers()
  })

  afterAll(() => {
    const report: TimingReport = {
      rules: RULES_TEXT,
      profiles: summaries,
      findings,
      votes,
    }
    writeTimingGroup(REPORT_DIR, 'nochoice', report)
  })

  for (const profile of NOCHOICE_PROFILES) {
    it(`audits weeks 1-103 as ${profile.name}`, async () => {
      const result = await auditProfile(profile)
      summaries.push(result.summary)
      findings.push(...result.findings)
      votes.push(...result.votes)
      expect.soft(result.reachedEpilogue, `${profile.name}: walk did not reach the epilogue`).toBe(true)
    }, 300000)
  }
})
