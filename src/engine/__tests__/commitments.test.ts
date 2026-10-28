import { describe, expect, it } from 'vitest'
import {
  PROMISE_PATTERN,
  RESOLUTION_RULES,
  commitmentFromChoice,
  commitmentStatus,
  deadlineWeekOf,
  isCommitmentChoice,
  settleBrokenCommitments,
  type Commitment,
  type ResolutionRule,
} from '../commitments'

const SCENE = {
  id: 'act3_press_briefing',
  title: 'The Press Briefing',
  characters: ['katerin_ashavel', 'gregor_maric'],
}

function makeCommitment(overrides: Partial<Commitment> = {}): Commitment {
  return {
    id: 'scene_a:choice_a',
    sceneId: 'scene_a',
    sceneTitle: 'Scene A',
    choiceId: 'choice_a',
    week: 12,
    quote: 'I promise.',
    witnesses: ['gregor_maric'],
    flags: ['promised_pensions'],
    ...overrides,
  }
}

describe('PROMISE_PATTERN and isCommitmentChoice', () => {
  it.each([
    'I promise you this.',
    'You have my word on it.',
    'I guarantee the vote.',
    'On my honour, the files stay sealed.',
    'I SWEAR it.',
    'I pledge my support.',
    "I'll make sure the pensions are paid.",
  ])('detects the promise phrase in %j', (text) => {
    expect(isCommitmentChoice({ text })).toBe(true)
    expect(PROMISE_PATTERN.test(text)).toBe(true)
  })

  it.each([
    "I won't let them close the mill.",
    'Give me two weeks before I commit to a timetable.',
    'I will not let this war drag on for months.',
  ])('does not treat threats, vows or "I commit" wording as a promise: %j', (text) => {
    expect(isCommitmentChoice({ text })).toBe(false)
    expect(PROMISE_PATTERN.test(text)).toBe(false)
  })

  it('does not fire on "compromise" or on promise without "I"', () => {
    expect(isCommitmentChoice({ text: 'We need a compromise.' })).toBe(false)
    expect(isCommitmentChoice({ text: 'The promise of reform' })).toBe(false)
  })

  it('does not match a phrase that is a prefix of a longer word', () => {
    expect(PROMISE_PATTERN.test('I promised nothing.')).toBe(false)
    expect(PROMISE_PATTERN.test('I will not letter the matter lie.')).toBe(false)
  })

  it('forces true on plain text when commitment is true', () => {
    expect(isCommitmentChoice({ text: 'Let us discuss the budget.', commitment: true })).toBe(true)
  })

  it('forces false on promise text when commitment is false', () => {
    expect(isCommitmentChoice({ text: 'I promise you this.', commitment: false })).toBe(false)
  })
})

describe('commitmentFromChoice', () => {
  it('builds the id from scene and choice ids and copies scene and choice fields', () => {
    const result = commitmentFromChoice(SCENE, { id: 'opt_1', text: 'I promise.', flags: ['f1'] }, 14)

    expect(result).toEqual({
      id: 'act3_press_briefing:opt_1',
      sceneId: 'act3_press_briefing',
      sceneTitle: 'The Press Briefing',
      choiceId: 'opt_1',
      week: 14,
      quote: 'I promise.',
      witnesses: ['gregor_maric'],
      flags: ['f1'],
    })
  })

  it('keeps the same choice id in two segments of one scene as two different promises', () => {
    const inFirstBranch = commitmentFromChoice(SCENE, { id: 'opt_1', text: 'I promise.' }, 14, 'branch_a')
    const inSecondBranch = commitmentFromChoice(SCENE, { id: 'opt_1', text: 'I promise.' }, 14, 'branch_b')

    expect(inFirstBranch.id).toBe('act3_press_briefing:branch_a:opt_1')
    expect(inSecondBranch.id).toBe('act3_press_briefing:branch_b:opt_1')
    expect(inFirstBranch.id).not.toBe(inSecondBranch.id)
  })

  it('keeps the scene:choice id when no segment is given, null or empty', () => {
    const withoutSegment = commitmentFromChoice(SCENE, { id: 'opt_1', text: 'I promise.' }, 14)
    const nullSegment = commitmentFromChoice(SCENE, { id: 'opt_1', text: 'I promise.' }, 14, null)
    const emptySegment = commitmentFromChoice(SCENE, { id: 'opt_1', text: 'I promise.' }, 14, '')

    expect(withoutSegment.id).toBe('act3_press_briefing:opt_1')
    expect(nullSegment.id).toBe('act3_press_briefing:opt_1')
    expect(emptySegment.id).toBe('act3_press_briefing:opt_1')
  })

  it('strips straight outer quotation marks', () => {
    const result = commitmentFromChoice(SCENE, { id: 'c', text: '"I promise the bridge."' }, 1)

    expect(result.quote).toBe('I promise the bridge.')
  })

  it('strips curly outer quotation marks', () => {
    const result = commitmentFromChoice(SCENE, { id: 'c', text: '“I promise the bridge.”' }, 1)

    expect(result.quote).toBe('I promise the bridge.')
  })

  it('trims whitespace around the quote', () => {
    const result = commitmentFromChoice(SCENE, { id: 'c', text: '   I promise.   ' }, 1)

    expect(result.quote).toBe('I promise.')
  })

  it('truncates quotes longer than 240 characters to 239 characters plus an ellipsis', () => {
    const longText = `I promise ${'a'.repeat(300)}`
    const result = commitmentFromChoice(SCENE, { id: 'c', text: longText }, 1)

    expect(result.quote).toBe(`${longText.slice(0, 239)}…`)
    expect(result.quote).toHaveLength(240)
  })

  it('keeps a quote of exactly 240 characters untouched', () => {
    const text = `I promise ${'a'.repeat(230)}`
    expect(text).toHaveLength(240)

    const result = commitmentFromChoice(SCENE, { id: 'c', text }, 1)

    expect(result.quote).toBe(text)
  })

  it('removes the player and duplicate witnesses while keeping order', () => {
    const scene = {
      id: 's',
      title: 'S',
      characters: ['katerin_ashavel', 'lioran_vey', 'gregor_maric', 'lioran_vey', 'katerin_ashavel'],
    }

    const result = commitmentFromChoice(scene, { id: 'c', text: 'I promise.' }, 1)

    expect(result.witnesses).toEqual(['lioran_vey', 'gregor_maric'])
  })

  it('gives an empty flags list when the choice has no flags', () => {
    const result = commitmentFromChoice(SCENE, { id: 'c', text: 'I promise.' }, 1)

    expect(result.flags).toEqual([])
  })

  it('copies flags so mutating the result does not change the input', () => {
    const flags = ['flag_a']
    const result = commitmentFromChoice(SCENE, { id: 'c', text: 'I promise.', flags }, 1)

    result.flags.push('flag_b')

    expect(flags).toEqual(['flag_a'])
    expect(result.flags).not.toBe(flags)
  })
})

describe('commitmentStatus', () => {
  const commitment = makeCommitment()

  it('is outstanding with no rules', () => {
    expect(commitmentStatus(commitment, ['promised_pensions'], [])).toBe('outstanding')
  })

  it('is kept when a keptBy flag is active', () => {
    const rules: ResolutionRule[] = [{ madeBy: 'promised_pensions', keptBy: ['pensions_paid'] }]

    expect(commitmentStatus(commitment, ['pensions_paid'], rules)).toBe('kept')
  })

  it('is broken when a brokenBy flag is active', () => {
    const rules: ResolutionRule[] = [{ madeBy: 'promised_pensions', brokenBy: ['pensions_cut'] }]

    expect(commitmentStatus(commitment, ['pensions_cut'], rules)).toBe('broken')
  })

  it('is broken rather than kept when both a brokenBy and a keptBy flag are active', () => {
    const rules: ResolutionRule[] = [
      { madeBy: 'promised_pensions', keptBy: ['pensions_paid'], brokenBy: ['pensions_cut'] },
    ]

    expect(commitmentStatus(commitment, ['pensions_paid', 'pensions_cut'], rules)).toBe('broken')
  })

  it('ignores a rule whose madeBy flag is not on the commitment', () => {
    const rules: ResolutionRule[] = [
      { madeBy: 'some_other_promise', keptBy: ['pensions_paid'], brokenBy: ['pensions_cut'] },
    ]

    expect(commitmentStatus(commitment, ['pensions_paid', 'pensions_cut'], rules)).toBe('outstanding')
  })

  it('stays outstanding when no active flag matches a rule', () => {
    const rules: ResolutionRule[] = [{ madeBy: 'promised_pensions', keptBy: ['pensions_paid'] }]

    expect(commitmentStatus(commitment, ['unrelated'], rules)).toBe('outstanding')
  })
})

describe('RESOLUTION_RULES', () => {
  it('loads as an array of rules from resolutions.json', () => {
    expect(Array.isArray(RESOLUTION_RULES)).toBe(true)
  })

  it('resolves a media_deal promise from the curated rules, with broken winning over kept', () => {
    const mediaDealCommitment: Commitment = {
      id: 'scene_media:choice_media',
      sceneId: 'scene_media',
      sceneTitle: 'Media',
      choiceId: 'choice_media',
      week: 14,
      quote: 'I promise the paper stays free.',
      witnesses: ['gregor_maric'],
      flags: ['media_deal'],
    }

    expect(commitmentStatus(mediaDealCommitment, ['free_press_killed'], RESOLUTION_RULES)).toBe('kept')
    expect(
      commitmentStatus(mediaDealCommitment, ['free_press_killed', 'media_deal_broken'], RESOLUTION_RULES),
    ).toBe('broken')
  })
})

describe('RESOLUTION_RULES for the Arcturian aid promise', () => {
  const arcturianCommitment: Commitment = {
    id: 'letter_response_arcturian:letter_arcturian_response',
    sceneId: 'letter_response_arcturian',
    sceneTitle: 'A Reply from Arcturia',
    choiceId: 'letter_arcturian_response',
    week: 1,
    quote: 'I want every krone accounted for.',
    witnesses: ['elara_vostane'],
    flags: ['letter_arcturian_replied', 'arcturian_aid_received'],
  }

  it('is kept when the quarterly report accounts for every line', () => {
    expect(commitmentStatus(arcturianCommitment, ['arcturian_aid_accounted'], RESOLUTION_RULES)).toBe('kept')
  })

  it('is kept when the diverted thirty million is disclosed to Cray', () => {
    expect(commitmentStatus(arcturianCommitment, ['arcturian_aid_disclosed'], RESOLUTION_RULES)).toBe('kept')
  })

  it('is broken when the thirty million is folded into a broad line', () => {
    expect(commitmentStatus(arcturianCommitment, ['arcturian_aid_diverted'], RESOLUTION_RULES)).toBe('broken')
  })

  it('stays outstanding while no quarterly report outcome flag is active', () => {
    expect(commitmentStatus(arcturianCommitment, [], RESOLUTION_RULES)).toBe('outstanding')
  })
})

describe('deadlines and settlement', () => {
  const pensionRule: ResolutionRule = {
    madeBy: 'promised_pensions',
    keptBy: ['pensions_paid'],
    deadlineWeeks: 4,
  }

  describe('commitmentStatus with a deadline', () => {
    const commitment = makeCommitment()

    it('is outstanding at the deadline week', () => {
      expect(commitmentStatus(commitment, [], [pensionRule], 16)).toBe('outstanding')
    })

    it('is broken the week after the deadline', () => {
      expect(commitmentStatus(commitment, [], [pensionRule], 17)).toBe('broken')
    })

    it('is kept after the deadline when a keptBy flag is active', () => {
      expect(commitmentStatus(commitment, ['pensions_paid'], [pensionRule], 17)).toBe('kept')
    })

    it('ignores the deadline when no currentWeek is passed', () => {
      expect(commitmentStatus(commitment, [], [pensionRule])).toBe('outstanding')
    })
  })

  describe('deadlineWeekOf', () => {
    const commitment = makeCommitment()

    it('returns the promise week plus deadlineWeeks', () => {
      expect(deadlineWeekOf(commitment, [pensionRule])).toBe(16)
    })

    it('returns null when no applicable rule has a deadline', () => {
      expect(deadlineWeekOf(commitment, [{ madeBy: 'promised_pensions', keptBy: ['pensions_paid'] }])).toBeNull()
    })

    it('returns the smallest deadline when two rules apply', () => {
      const rules: ResolutionRule[] = [
        pensionRule,
        { madeBy: 'promised_pensions', brokenBy: ['pensions_cut'], deadlineWeeks: 2 },
      ]

      expect(deadlineWeekOf(commitment, rules)).toBe(14)
    })
  })

  describe('settleBrokenCommitments', () => {
    const commitment = makeCommitment()
    const rules: ResolutionRule[] = [
      {
        ...pensionRule,
        consequences: [{ stat: 'factions.workersCoalition', operation: 'add', value: -10 }],
      },
    ]

    it('returns the consequences and flags of a commitment broken by its deadline', () => {
      const effects = settleBrokenCommitments([commitment], [], rules, 17, [])

      expect(effects).toEqual([
        {
          commitmentId: 'scene_a:choice_a',
          modifiers: [
            {
              stat: 'factions.workersCoalition',
              operation: 'add',
              value: -10,
              sourceId: 'scene_a:choice_a',
              sourceType: 'system',
            },
          ],
          flags: ['promise_broken_promised_pensions'],
        },
      ])
    })

    it('returns nothing for a commitment already in settledIds', () => {
      expect(settleBrokenCommitments([commitment], [], rules, 17, ['scene_a:choice_a'])).toEqual([])
    })

    it('returns a commitment broken by a brokenBy flag before its deadline', () => {
      const brokenRules: ResolutionRule[] = [
        { madeBy: 'promised_pensions', brokenBy: ['pensions_cut'], deadlineWeeks: 4 },
      ]

      const effects = settleBrokenCommitments([commitment], ['pensions_cut'], brokenRules, 13, [])

      expect(effects).toHaveLength(1)
      expect(effects[0].commitmentId).toBe('scene_a:choice_a')
      expect(effects[0].modifiers).toEqual([])
      expect(effects[0].flags).toEqual(['promise_broken_promised_pensions'])
    })

    it('does not return a commitment whose flags match no rule', () => {
      const unrelated = makeCommitment({ flags: ['unrelated_flag'] })

      expect(settleBrokenCommitments([unrelated], [], rules, 17, [])).toEqual([])
    })
  })
})
