import { describe, expect, it } from 'vitest'
import { auditChainWindows } from '../../../../scripts/audit-chain-windows.mjs'

// Static guard over the real narrative and agenda data: no chainTrigger may be
// impossible to deliver. A late chain (every possible fire week after the target's
// weekDeadline) is only a content bug when the target has no other launch path
// (agenda entry, nextNodeId, or an overlapping chain). Late chains with another
// path are REDUNDANT_LATE and informational. See scripts/audit-chain-windows.mjs.

describe('chain triggers can land inside their target scene window', () => {
  const { chains, impossible } = auditChainWindows()

  it('reads chain triggers from the narrative data', () => {
    expect(chains.length).toBeGreaterThan(0)
  })

  it('has no chain whose every possible fire week is after its target deadline', () => {
    const described = impossible.map(c => `${c.source} / ${c.choice} -> ${c.target} (delay ${c.delay})`)

    expect(described).toEqual([])
  })
})
