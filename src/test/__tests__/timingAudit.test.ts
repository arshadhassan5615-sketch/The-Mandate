import { describe, it, expect } from 'vitest'
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mulberry32, preferTags, seededPick } from '../choicePlayer'
import {
  LAST_WEEK,
  PARTIAL_REPORT_FILES,
  mergeTimingReports,
  writeTimingGroup,
  renderVotes,
  renderMarkdown,
  RULES_TEXT,
  type TimingReport,
  type VoteRecord,
  parseFileWeek,
  loadAgendaDeclarations,
  declaredWindow,
  sceneWindow,
  mergeWindows,
  classifyOfferTiming,
  classifyMissing,
  classifyNeverOfferedMandatory,
  classifyRepeat,
  classifyChain,
  dedupeFindings,
  buildProfileFindings,
  createLedger,
  pushUnique,
  groupAcrossProfiles,
  type AgendaDeclaration,
  type ChainSchedule,
  type TimingFinding,
  type TimingLedger,
} from '../timingAudit'

function decl(overrides: Partial<AgendaDeclaration> = {}): AgendaDeclaration {
  return {
    file: 'week05.json',
    id: 'a',
    sceneId: 'scene_a',
    fileWeek: 5,
    weekAvailable: 5,
    weekDeadline: 6,
    prerequisites: [],
    isUrgent: false,
    recurring: false,
    slotCost: 0,
    executionOrder: 1,
    ...overrides,
  }
}

describe('parseFileWeek', () => {
  it('reads the week from weekNN file names', () => {
    expect(parseFileWeek('week05.json')).toBe(5)
    expect(parseFileWeek('week14_neg.json')).toBe(14)
    expect(parseFileWeek('C:\\repo\\src\\data\\agenda\\week100.json')).toBe(100)
  })

  it('returns null for project files', () => {
    expect(parseFileWeek('project_kravenstal_steel.json')).toBeNull()
  })
})

describe('loadAgendaDeclarations', () => {
  it('reads both the bare-array and { agenda } shapes and skips entries without id or sceneId', () => {
    const decls = loadAgendaDeclarations({
      'week03.json': [{ id: 'x', sceneId: 's1', weekAvailable: 3, isUrgent: true }],
      'week04.json': { agenda: [{ id: 'y', sceneId: 's2', weekAvailable: 4, weekDeadline: 5 }, { sceneId: 'no-id' }] },
      'project_a.json': [{ id: 'p', sceneId: 's3', weekAvailable: 9 }],
    })
    expect(decls.map(d => d.id)).toEqual(['x', 'y', 'p'])
    expect(decls[0]).toMatchObject({ file: 'week03.json', fileWeek: 3, isUrgent: true, weekDeadline: null })
    expect(decls[1]).toMatchObject({ fileWeek: 4, weekDeadline: 5 })
    expect(decls[2]).toMatchObject({ fileWeek: null })
  })
})

describe('declaredWindow', () => {
  it('starts at weekAvailable when present', () => {
    expect(declaredWindow(decl({ weekAvailable: 7, fileWeek: 5 }))).toEqual({ start: 7, deadline: 6 })
  })

  it('falls back to the file week when weekAvailable is absent', () => {
    expect(declaredWindow(decl({ weekAvailable: null, fileWeek: 5, weekDeadline: null }))).toEqual({ start: 5, deadline: null })
  })

  it('starts at week 1 when neither weekAvailable nor a file week exists', () => {
    expect(declaredWindow(decl({ weekAvailable: null, fileWeek: null, weekDeadline: null }))).toEqual({ start: 1, deadline: null })
  })
})

describe('sceneWindow and mergeWindows', () => {
  it('reads scene weekAvailable (default 1) and weekDeadline', () => {
    expect(sceneWindow(undefined)).toBeNull()
    expect(sceneWindow({})).toEqual({ start: 1, deadline: null })
    expect(sceneWindow({ weekAvailable: 3, weekDeadline: 9 })).toEqual({ start: 3, deadline: 9 })
  })

  it('takes the latest start and the earliest deadline', () => {
    expect(mergeWindows({ start: 5, deadline: 8 }, { start: 7, deadline: 10 })).toEqual({ start: 7, deadline: 8 })
    expect(mergeWindows({ start: 5, deadline: null }, { start: 2, deadline: 9 })).toEqual({ start: 5, deadline: 9 })
    expect(mergeWindows({ start: 5, deadline: null }, null)).toEqual({ start: 5, deadline: null })
  })
})

describe('classifyOfferTiming (EARLY / LATE)', () => {
  const win = { start: 5, deadline: 7 }

  it('flags an offer before the window opens as EARLY', () => {
    expect(classifyOfferTiming(win, [4, 5])).toBe('EARLY')
  })

  it('flags a first offer after the deadline as LATE', () => {
    expect(classifyOfferTiming(win, [8])).toBe('LATE')
  })

  it('accepts offers inside the window, including the deadline week', () => {
    expect(classifyOfferTiming(win, [5, 6, 7])).toBeNull()
    expect(classifyOfferTiming(win, [7])).toBeNull()
  })

  it('never reports LATE for an open-ended window', () => {
    expect(classifyOfferTiming({ start: 5, deadline: null }, [103])).toBeNull()
  })

  it('returns null when the item was never offered', () => {
    expect(classifyOfferTiming(win, [])).toBeNull()
  })
})

describe('classifyMissing', () => {
  const win = { start: 5, deadline: 7 }

  it('is true when eligible inside the window and never offered inside it', () => {
    expect(classifyMissing(win, [6], [])).toBe(true)
    expect(classifyMissing(win, [6], [2])).toBe(true)
  })

  it('is false when it was offered inside the window', () => {
    expect(classifyMissing(win, [6], [6])).toBe(false)
  })

  it('is false when it was never eligible inside the window', () => {
    expect(classifyMissing(win, [1, 9], [])).toBe(false)
  })
})

describe('classifyNeverOfferedMandatory and classifyRepeat', () => {
  it('flags only mandatory entries that were never offered', () => {
    expect(classifyNeverOfferedMandatory(true, [])).toBe(true)
    expect(classifyNeverOfferedMandatory(true, [4])).toBe(false)
    expect(classifyNeverOfferedMandatory(false, [])).toBe(false)
  })

  it('flags a non-recurring item played in more than one week', () => {
    expect(classifyRepeat([3, 4], false)).toBe(true)
    expect(classifyRepeat([3, 3], false)).toBe(false)
    expect(classifyRepeat([3, 4], true)).toBe(false)
  })
})

describe('classifyChain', () => {
  it('is CHAIN_LATE when delivered after the fire week', () => {
    expect(classifyChain(10, 12, false)).toBe('CHAIN_LATE')
  })

  it('is CHAIN_EARLY when delivered before the fire week', () => {
    expect(classifyChain(10, 9, false)).toBe('CHAIN_EARLY')
  })

  it('is clean when delivered on the fire week', () => {
    expect(classifyChain(10, 10, false)).toBeNull()
  })

  it('is CHAIN_NEVER when never delivered and the target never visited', () => {
    expect(classifyChain(10, null, false)).toBe('CHAIN_NEVER')
  })

  it('is not a finding when the target was satisfied through another route', () => {
    expect(classifyChain(10, null, true)).toBeNull()
  })
})

describe('buildProfileFindings', () => {
  it('reports EARLY, MISSING and LATE for agenda entries from the ledger', () => {
    const early = decl({ id: 'early', sceneId: 'sc_early', weekAvailable: 5, weekDeadline: 6 })
    const late = decl({ id: 'late', sceneId: 'sc_late', weekAvailable: 2, weekDeadline: 3 })
    const missing = decl({ id: 'missing', sceneId: 'sc_missing', weekAvailable: 4, weekDeadline: 6 })
    const ledger = createLedger()
    pushUnique(ledger.offeredWeeks, 'early', 4)
    pushUnique(ledger.offeredWeeks, 'late', 9)
    pushUnique(ledger.eligibleWeeks, 'missing', 5)

    const findings = buildProfileFindings({
      profile: 'p',
      declarations: [early, late, missing],
      ledger,
      visitedAtEnd: [],
      sceneWindowOf: () => null,
    })
    const summary = findings.map(f => `${f.type}:${f.id}`).sort()
    expect(summary).toEqual(['EARLY:early', 'LATE:late', 'MISSING:missing'])
  })

  it('reports CHAIN_LATE and CHAIN_NEVER from the chain ledger', () => {
    const ledger = createLedger()
    ledger.chainFirst.set('scene_late', { chainId: 'c1', fireWeek: 10, scheduledWeek: 8 })
    ledger.chainFirst.set('scene_lost', { chainId: 'c2', fireWeek: 11, scheduledWeek: 8 })
    ledger.chainDelivered.set('scene_late', 13)
    ledger.chainDropped.set('scene_lost', 11)

    const findings = buildProfileFindings({
      profile: 'p',
      declarations: [],
      ledger,
      visitedAtEnd: [],
      sceneWindowOf: () => null,
    })
    const types = Object.fromEntries(findings.map(f => [f.sceneId, f.type]))
    expect(types).toEqual({ scene_late: 'CHAIN_LATE', scene_lost: 'CHAIN_NEVER' })
    expect(findings.find(f => f.sceneId === 'scene_lost')?.details).toContain('vanished unfired in week 11')
  })

  it('does not merge the shared scene window into recurring occurrences', () => {
    const ledger = createLedger()
    ledger.itemMeta.set('citizen_petitions_8', { sceneId: 'act_citizen_petitions', weekAvailable: 8, weekDeadline: 9, recurring: true, isUrgent: false })
    pushUnique(ledger.offeredWeeks, 'citizen_petitions_8', 8)

    const findings = buildProfileFindings({
      profile: 'p',
      declarations: [],
      ledger,
      visitedAtEnd: [],
      sceneWindowOf: () => ({ start: 1, deadline: 5 }),
    })
    expect(findings).toEqual([])
  })

  it('skips virtual scenes for REPEAT and reports played repeats for real scenes', () => {
    const ledger = createLedger()
    ledger.itemMeta.set('__v1', { sceneId: '__budget__', weekAvailable: 1, weekDeadline: null, recurring: false, isUrgent: false })
    ledger.played.push({ week: 1, id: '__v1', sceneId: '__budget__' }, { week: 2, id: '__v1', sceneId: '__budget__' })
    ledger.itemMeta.set('inj', { sceneId: 'sc_inj', weekAvailable: 1, weekDeadline: null, recurring: false, isUrgent: false })
    ledger.played.push({ week: 1, id: 'inj', sceneId: 'sc_inj' }, { week: 3, id: 'inj', sceneId: 'sc_inj' })

    const findings = buildProfileFindings({
      profile: 'p',
      declarations: [],
      ledger,
      visitedAtEnd: [],
      sceneWindowOf: () => null,
    })
    expect(findings.map(f => `${f.type}:${f.id}`)).toEqual(['REPEAT:inj'])
  })
})

describe('dedupeFindings and groupAcrossProfiles', () => {
  const base: Omit<TimingFinding, 'profile'> = {
    type: 'LATE',
    id: 'x',
    sceneId: 'sx',
    week: 4,
    weeks: [4],
    window: '1-3',
    details: '',
  }

  it('keeps one finding per (profile, type, id)', () => {
    const out = dedupeFindings([
      { ...base, profile: 'a' },
      { ...base, profile: 'a', week: 5 },
      { ...base, profile: 'b' },
    ])
    expect(out).toHaveLength(2)
  })

  it('counts the distinct profiles that hit each finding', () => {
    const grouped = groupAcrossProfiles([
      { ...base, profile: 'a' },
      { ...base, profile: 'b' },
      { ...base, profile: 'b', id: 'other' },
    ])
    expect(grouped[0]).toMatchObject({ id: 'x', profiles: ['a', 'b'] })
    expect(grouped[1]).toMatchObject({ id: 'other', profiles: ['b'] })
  })
})

describe('LAST_WEEK', () => {
  it('is the final playable week of the scripted walk', () => {
    expect(LAST_WEEK).toBe(103)
  })
})

describe('chain deferral and dropped chains', () => {
  it('reports CHAIN_DEFERRED instead of CHAIN_LATE when the scene opens after the fire week', () => {
    const ledger = createLedger()
    ledger.chainFirst.set('scene_deferred', { chainId: 'c1', fireWeek: 10, scheduledWeek: 8, sourceId: 'choice_x', sceneId: 'scene_src' })
    ledger.chainDelivered.set('scene_deferred', 13)

    const findings = buildProfileFindings({
      profile: 'p',
      declarations: [],
      ledger,
      visitedAtEnd: [],
      sceneWindowOf: () => ({ start: 13, deadline: null }),
    })
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ type: 'CHAIN_DEFERRED', sceneId: 'scene_deferred', window: 'fire 10' })
    expect(findings[0].details).toContain('deferred: scene opens week 13')
    expect(findings[0].details).toContain('by choice_x')
  })

  it('keeps CHAIN_LATE when the scene was already open at the fire week', () => {
    const ledger = createLedger()
    ledger.chainFirst.set('scene_late', { chainId: 'c1', fireWeek: 10, scheduledWeek: 8 })
    ledger.chainDelivered.set('scene_late', 13)

    const findings = buildProfileFindings({
      profile: 'p',
      declarations: [],
      ledger,
      visitedAtEnd: [],
      sceneWindowOf: () => ({ start: 2, deadline: null }),
    })
    expect(findings.map(f => f.type)).toEqual(['CHAIN_LATE'])
  })

  it('emits one informational DROPPED_CHAIN finding per dropped chain entry', () => {
    const ledger = createLedger()
    ledger.droppedChains.push(
      { chainId: 'chain_1_scene_d', target: 'scene_d', fireWeek: 11, week: 11, reason: 'conditions failed (evaluated after the tick)' },
      { chainId: 'chain_2_scene_d', target: 'scene_d', fireWeek: 12, week: 12, reason: 'probability roll failed (inferred)' },
    )

    const findings = buildProfileFindings({
      profile: 'p',
      declarations: [],
      ledger,
      visitedAtEnd: [],
      sceneWindowOf: () => null,
    })
    const dropped = findings.filter(f => f.type === 'DROPPED_CHAIN')
    expect(dropped).toHaveLength(2)
    expect(dropped[0].details).toContain('chain_1_scene_d dropped in week 11: conditions failed')
  })
})

describe('multi-source chain attribution', () => {
  const late: ChainSchedule = { chainId: 'c_late', fireWeek: 42, scheduledWeek: 38, sourceId: 'choice_late' }
  const early: ChainSchedule = { chainId: 'c_early', fireWeek: 41, scheduledWeek: 39, sourceId: 'choice_early' }

  function ledgerWith(delivered: number, schedules: ChainSchedule[]): TimingLedger {
    const ledger = createLedger()
    ledger.chainFirst.set('scene_multi', schedules[0])
    ledger.chainSchedules.set('scene_multi', schedules)
    ledger.chainDelivered.set('scene_multi', delivered)
    return ledger
  }

  function findingsFor(ledger: TimingLedger, declarations: AgendaDeclaration[] = []): TimingFinding[] {
    return buildProfileFindings({
      profile: 'p',
      declarations,
      ledger,
      visitedAtEnd: [],
      sceneWindowOf: () => null,
    })
  }

  it('does not call a delivery early when a later-scheduled chain fires that week', () => {
    const ledger = ledgerWith(41, [late, early])
    expect(findingsFor(ledger)).toEqual([])
  })

  it('still reports CHAIN_EARLY when no chain to the target fires by the delivery week', () => {
    const ledger = ledgerWith(40, [late, early])
    const findings = findingsFor(ledger)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ type: 'CHAIN_EARLY', sceneId: 'scene_multi', window: 'fire 41' })
    expect(findings[0].details).toContain('delivered week 40')
  })

  it('judges CHAIN_EARLY against the earliest fire week, not the first schedule seen', () => {
    const ledger = ledgerWith(41, [late])
    ledger.chainSchedules.set('scene_multi', [late, early])
    ledger.chainFirst.set('scene_multi', late)
    expect(findingsFor(ledger)).toEqual([])
  })

  it('lists every source in the finding details', () => {
    const ledger = ledgerWith(40, [late, early])
    const findings = findingsFor(ledger)
    expect(findings[0].details).toContain('by choice_late')
    expect(findings[0].details).toContain('by choice_early')
  })

  it('does not call a delivery early when an agenda entry for the scene had already opened', () => {
    const ledger = ledgerWith(41, [late])
    const agenda = decl({ id: 'agenda_multi', sceneId: 'scene_multi', weekAvailable: 40, weekDeadline: 45 })
    expect(findingsFor(ledger, [agenda])).toEqual([])
  })

  it('still reports CHAIN_EARLY when the agenda entry opens after the delivery', () => {
    const ledger = ledgerWith(41, [late])
    const agenda = decl({ id: 'agenda_multi', sceneId: 'scene_multi', weekAvailable: 45, weekDeadline: 50 })
    expect(findingsFor(ledger, [agenda]).map(f => f.type)).toEqual(['CHAIN_EARLY'])
  })
})

describe('choice pickers (choicePlayer)', () => {
  const choices = [
    { id: 'a', text: 'A', internalTag: 'populist' as const },
    { id: 'b', text: 'B', internalTag: 'pragmatist' as const },
    { id: 'c', text: 'C', internalTag: 'reformist' as const },
    { id: 'd', text: 'D' },
  ]

  it('preferTags picks the first tag in preference order, then the first choice', () => {
    expect(preferTags(['reformist', 'pragmatist'])(choices).id).toBe('c')
    expect(preferTags(['authoritarian', 'pragmatist'])(choices).id).toBe('b')
    expect(preferTags(['authoritarian'])(choices).id).toBe('a')
  })

  it('mulberry32 yields the same sequence for the same seed, in [0, 1)', () => {
    const first = mulberry32(42)
    const second = mulberry32(42)
    const seq = [first(), first(), first()]
    expect(seq).toEqual([second(), second(), second()])
    expect(seq.every(v => v >= 0 && v < 1)).toBe(true)
  })

  it('seededPick is reproducible for a fixed seed', () => {
    const run = (): string[] => {
      const pick = seededPick(42)
      return [pick(choices).id, pick(choices).id, pick(choices).id, pick(choices).id]
    }
    expect(run()).toEqual(run())
  })
})

describe('chain counters in the ledger', () => {
  it('starts with zero choices, fired chains and an empty schedule set', () => {
    const ledger = createLedger()
    expect(ledger.choicesMade).toBe(0)
    expect(ledger.chainsFired).toBe(0)
    expect(ledger.chainIdsScheduled.size).toBe(0)
    expect(ledger.droppedChains).toEqual([])
  })
})

// ─── Partial reports, merge and votes section ────────────────────────────────

function profileSummary(name: string) {
  return {
    name,
    usesChoices: false,
    weeksWalked: LAST_WEEK,
    reachedEpilogue: true,
    itemsPlayed: 0,
    choicesMade: 0,
    chainsScheduled: 0,
    chainsFired: 0,
    chainsDropped: 0,
    notes: [],
  }
}

function vote(profile: string, overrides: Partial<VoteRecord> = {}): VoteRecord {
  return {
    profile,
    week: 25,
    itemId: 'agenda_w25_vote',
    sceneId: '__vote__',
    voteType: 'referendum',
    threshold: 126,
    totalSeats: 250,
    yes: 130,
    no: 120,
    undecided: 0,
    margin: 4,
    spendLevel: 0,
    passed: true,
    flagsApplied: ['referendum_passed', 'constitution_ratified'],
    lobbyingEnabled: true,
    ...overrides,
  }
}

function report(names: string[], votes: VoteRecord[] = []): TimingReport {
  return {
    rules: RULES_TEXT,
    profiles: names.map(profileSummary),
    findings: names.map(name => ({
      profile: name,
      type: 'LATE' as const,
      id: `item_${name}`,
      sceneId: 'sc',
      week: 3,
      weeks: [3],
      window: '1-2',
      details: '',
    })),
    votes,
  }
}

describe('mergeTimingReports', () => {
  it('concatenates profiles, findings and votes in the order given', () => {
    const merged = mergeTimingReports([
      report(['untouched', 'reformist'], [vote('reformist')]),
      report(['chooser'], [vote('chooser')]),
    ])
    expect(merged.profiles.map(p => p.name)).toEqual(['untouched', 'reformist', 'chooser'])
    expect(merged.findings.map(f => f.profile)).toEqual(['untouched', 'reformist', 'chooser'])
    expect(merged.votes.map(v => v.profile)).toEqual(['reformist', 'chooser'])
    expect(merged.rules).toBe(RULES_TEXT)
  })

  it('refuses a profile name that appears in two parts', () => {
    expect(() => mergeTimingReports([report(['a', 'b']), report(['b', 'c'])])).toThrow('duplicate profile(s): b')
  })

  it('refuses an empty list of parts', () => {
    expect(() => mergeTimingReports([])).toThrow('no parts')
  })
})

describe('writeTimingGroup', () => {
  it('writes only the partial file until both groups exist, then the merged report', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timing-merge-'))
    try {
      const first = writeTimingGroup(dir, 'nochoice', report(['untouched'], [vote('untouched')]))
      expect(first.merged).toBe(false)
      expect(existsSync(join(dir, PARTIAL_REPORT_FILES.nochoice))).toBe(true)
      expect(existsSync(join(dir, 'timing-report.json'))).toBe(false)

      const second = writeTimingGroup(dir, 'choice', report(['chooser']))
      expect(second.merged).toBe(true)
      const merged = JSON.parse(readFileSync(join(dir, 'timing-report.json'), 'utf8')) as TimingReport
      expect(merged.profiles.map(p => p.name)).toEqual(['untouched', 'chooser'])
      expect(merged.votes).toHaveLength(1)
      expect(readFileSync(join(dir, 'timing-report.md'), 'utf8')).toContain('## Votes (1)')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('renderVotes', () => {
  it('shows the tally, the outcome and the flags applied', () => {
    const md = renderVotes([vote('reformist')])
    expect(md).toContain('## Votes (1)')
    expect(md).toContain('130-120-0 of 250')
    expect(md).toContain('PASSED')
    expect(md).toContain('referendum_passed, constitution_ratified')
  })

  it('notes votes on entries with lobbying disabled and handles an empty list', () => {
    expect(renderVotes([vote('p', { lobbyingEnabled: false, passed: false })])).toContain('real screen does not tally')
    expect(renderVotes([])).toContain('_none_')
  })

  it('is part of the full markdown report', () => {
    const md = renderMarkdown(report(['p'], [vote('p')]))
    expect(md).toContain('## Votes (1)')
  })
})
