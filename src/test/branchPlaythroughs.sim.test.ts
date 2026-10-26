// Branch playthroughs and dropped-chain proof (work order B1). Env-gated.
//
//   $env:MANDATE_TIMING='1'; npx vitest run src/test/branchPlaythroughs.sim.test.ts
//
// A. Every NEVER_OFFERED_MANDATORY id in timing-report.json is played through
//    the real week flow from a state planWorld builds, and must be offered and
//    played inside its window.
// B. The four choice profiles are re-walked with the onChainDropped hook, and
//    every dropped chain is classified LEGIT or SUSPECT from the actual state.
// Writes branch-playthroughs-report.md and .json at the project root.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resolve } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'

import { setWaiter } from './simHarness'
import { CHOICE_PROFILES, auditProfile } from './timingAuditWalk'
import {
  playBranch,
  unknownBranchRow,
  classifyDrop,
  buildReport,
  renderMarkdown,
  mandatoryCases,
  planWorld,
  type BranchRow,
  type DeliveryRecord,
  type DropRecord,
} from './branchPlaythroughs'

const RUN = process.env.MANDATE_TIMING === '1'
// Vitest runs from the project root (the-mandate/), where the reports land.
const ROOT = resolve(process.cwd())
const TIMING_REPORT = resolve(ROOT, 'timing-report.json')
const REPORT_MD = resolve(ROOT, 'branch-playthroughs-report.md')
const REPORT_JSON = resolve(ROOT, 'branch-playthroughs-report.json')

/** Ids the full-game timing audit reported as urgent but never offered. */
function neverOfferedIds(): string[] {
  const report = JSON.parse(readFileSync(TIMING_REPORT, 'utf8')) as {
    findings: { type: string; id: string }[]
  }
  return [...new Set(report.findings.filter(f => f.type === 'NEVER_OFFERED_MANDATORY').map(f => f.id))]
}

describe.skipIf(!RUN)('branch playthroughs and dropped-chain proof (env MANDATE_TIMING=1)', () => {
  const rows: BranchRow[] = []
  const drops: DropRecord[] = []
  const deliveries: DeliveryRecord[] = []

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    setWaiter(async ms => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  })

  afterEach(() => {
    setWaiter(null)
    vi.useRealTimers()
  })

  it('plays every never-offered urgent branch through the real week flow', async () => {
    const ids = neverOfferedIds()
    const cases = mandatoryCases()
    expect(ids.length, 'timing-report.json lists no NEVER_OFFERED_MANDATORY ids').toBeGreaterThan(0)
    for (const id of ids) {
      const item = cases.find(c => c.id === id)
      if (!item) {
        rows.push(unknownBranchRow(id))
        continue
      }
      rows.push(await playBranch(item, planWorld(item)))
    }
  }, 1200000)

  for (const profile of CHOICE_PROFILES) {
    it(`classifies every dropped chain in ${profile.name}`, async () => {
      const result = await auditProfile(profile, {
        onChainDropped: (chain, week, evaluation) => {
          drops.push(classifyDrop(profile.name, chain, week, evaluation))
        },
      })
      deliveries.push(...result.chainDeliveries.map(d => ({ profile: profile.name, ...d })))
    }, 300000)
  }

  it('writes the reports, then asserts every branch passes and no drop is suspect', () => {
    const report = buildReport(rows, drops, deliveries)
    writeFileSync(REPORT_MD, renderMarkdown(report), 'utf8')
    writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), 'utf8')

    const failing = rows.filter(r => !r.pass).map(r => `${r.id}: ${r.failure}`)
    expect(failing, 'branches that did not pass their window').toEqual([])
    const suspects = drops
      .filter(d => d.verdict === 'SUSPECT')
      .map(d => `${d.chainId} -> ${d.target} (${d.profile}, week ${d.dropWeek}): ${d.why}`)
    expect(suspects, 'dropped chains that are SUSPECT').toEqual([])
  })
})
