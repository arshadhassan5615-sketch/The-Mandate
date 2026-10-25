import { describe, expect, it } from 'vitest'
import formationMeeting from '../act1/act1_week2_cabinet_formation_meeting.json'
import { getAvailableChoices } from '../../../engine/NarrativeEngine'
import type { GameState } from '../../../types/gameState'

type Choice = {
  id: string
  text: string
  internalTag: string
  flags: string[]
  nextSegment?: string | null
  conditions?: { stat: string; operator: string; value: unknown }[]
}
type Segment = { narrative?: unknown[]; choices?: Choice[] }

const segments = formationMeeting.segments as unknown as Record<string, Segment>
const SEGMENT_IDS = Object.keys(segments)

const DEFENSE_HUB = 'defense_ministry_hub'
// Segments that enter Defense from the Interior ministry. These are the original
// entry points and are the only choices allowed to point at the Defense hub.
const ORIGINAL_DEFENSE_ENTRIES = [
  'interior_perov_pitch.interior_to_interrogation',
  'perov_police_answer.perov_police_move_on',
  'interior_confrontation.interior_support_oberlin',
  'interior_confrontation.interior_support_perov',
  'interior_confrontation.interior_defer_judgment',
]

// [answer segments of candidate A, B's met flag, B's deep segment]
type Candidate = { name: string; met: string; deep: string; answers: string[] }
const PAIRS: { a: Candidate; b: Candidate }[] = [
  {
    a: { name: 'Professor Theron', met: 'met_justice_theron', deep: 'justice_deep_theron', answers: ['justice_theron_priority_answer', 'theron_judges_answer', 'kesic_rebuttal_judges'] },
    b: { name: 'Prosecutor Kešić', met: 'met_justice_kesic', deep: 'justice_deep_kesic', answers: ['justice_kesic_priority_answer', 'justice_kesic_challenge_answer'] },
  },
  {
    a: { name: 'Chairman Marić', met: 'met_labor_maric', deep: 'labor_deep_maric', answers: ['labor_maric_priority_answer', 'labor_maric_challenge_answer'] },
    b: { name: 'Director Solec', met: 'met_labor_solec', deep: 'labor_deep_solec', answers: ['labor_solec_priority_answer', 'labor_solec_challenge_answer'] },
  },
  {
    a: { name: 'Ambassador Sorin', met: 'met_foreign_sorin', deep: 'foreign_affairs_deep_sorin', answers: ['foreign_sorin_priority_answer', 'foreign_sorin_challenge_answer'] },
    b: { name: 'Deputy Minister Borač', met: 'met_foreign_borac', deep: 'foreign_affairs_deep_borac', answers: ['foreign_borac_priority_answer', 'foreign_borac_challenge_answer'] },
  },
  {
    a: { name: 'Dr. Solén', met: 'met_education_solen', deep: 'education_deep_solen', answers: ['edu_solen_priority_answer', 'edu_solen_challenge_answer'] },
    b: { name: 'Deputy Minister Horák', met: 'met_education_horak', deep: 'education_deep_horak', answers: ['edu_horak_priority_answer', 'edu_horak_challenge_answer'] },
  },
  {
    a: { name: 'Dr. Kaspar', met: 'met_health_kaspar', deep: 'health_deep_kaspar', answers: ['health_kaspar_priority_answer', 'health_kaspar_challenge_answer'] },
    b: { name: 'Dr. Meln', met: 'met_health_meln', deep: 'health_deep_meln', answers: ['health_meln_priority_answer', 'health_meln_challenge_answer'] },
  },
  {
    a: { name: 'Engineer Varro', met: 'met_development_varro', deep: 'development_deep_varro', answers: ['dev_varro_priority_answer', 'dev_varro_challenge_answer'] },
    b: { name: 'Director Drenek', met: 'met_development_drenek', deep: 'development_deep_drenek', answers: ['dev_drenek_priority_answer', 'dev_drenek_challenge_answer'] },
  },
  {
    a: { name: 'Director Valdek', met: 'met_resources_valdek', deep: 'resources_deep_valdek', answers: ['valdek_priority_answer', 'valdek_challenge_answer'] },
    b: { name: 'Director Voss', met: 'met_resources_voss', deep: 'resources_deep_voss', answers: ['voss_priority_answer', 'voss_challenge_answer'] },
  },
]

// Each answer segment of a candidate offers a hear-other choice that brings the other candidate back.
const HEAR_OTHER_PAIRS: { segment: string; other: Candidate }[] = PAIRS.flatMap(({ a, b }) => [
  ...a.answers.map(segment => ({ segment, other: b })),
  ...b.answers.map(segment => ({ segment, other: a })),
])

const allChoices = () =>
  SEGMENT_IDS.flatMap(id => (segments[id].choices ?? []).map(choice => ({ segmentId: id, choice })))

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0

describe('Cabinet formation meeting flow', () => {
  it('every nextSegment points at a segment that exists', () => {
    // The scene's existing final choice is the only one allowed to have no nextSegment.
    const TERMINAL_CHOICE = 'transition_to_appointments.enter_appointment_screen'
    const dangling = allChoices()
      .filter(({ segmentId, choice }) => `${segmentId}.${choice.id}` !== TERMINAL_CHOICE)
      .filter(({ choice }) => !isNonEmptyString(choice.nextSegment) || !segments[choice.nextSegment])
      .map(({ segmentId, choice }) => `${segmentId}.${choice.id} -> ${String(choice.nextSegment)}`)

    expect(dangling).toEqual([])
  })

  it('only the original Interior entries point back at the Defense hub', () => {
    const referrers = allChoices()
      .filter(({ choice }) => choice.nextSegment === DEFENSE_HUB)
      .map(({ segmentId, choice }) => `${segmentId}.${choice.id}`)

    expect(referrers.sort()).toEqual([...ORIGINAL_DEFENSE_ENTRIES].sort())
  })

  it('defense follow-up hub offers the three questions and the move-on choice', () => {
    const hub = segments.defense_followup_hub
    const ids = hub.choices?.map(c => c.id)

    expect(ids).toEqual([
      'followup_dusek_timeline',
      'followup_dusek_budget',
      'followup_vass_iron_covenant',
      'followup_defense_to_education',
    ])
    expect(hub.choices?.at(-1)?.nextSegment).toBe('education_presents')
  })

  it('every defense question returns to the follow-up hub, not the hub entry', () => {
    const returns = ['dusek_timeline_hear_vass', 'dusek_budget_hear_vass', 'vass_probe_more']
    const sources = [segments.dusek_timeline, segments.dusek_budget_detail, segments.vass_probe]
    const targets = sources.flatMap(seg => (seg.choices ?? []).filter(c => returns.includes(c.id)))

    expect(targets).toHaveLength(3)
    for (const choice of targets) {
      expect(choice.nextSegment).toBe('defense_followup_hub')
      expect(choice.text).toBe('I have more questions on Defense.')
    }
  })

  it('the Vass move-on choice now says Education', () => {
    const choice = segments.vass_probe.choices?.find(c => c.id === 'vass_probe_to_justice')

    expect(choice?.text).toBe("I will hold you to that. Let's move to Education.")
    expect(choice?.nextSegment).toBe('education_presents')
  })

  it.each(HEAR_OTHER_PAIRS)('$segment offers a hear-other choice to $other.name', ({ segment, other }) => {
    const first = segments[segment].choices?.[0]

    expect(first?.id).toBe(`${segment}_hear_other`)
    expect(first?.text).toBe(`Bring ${other.name} back in. I have questions for the other candidate too.`)
    expect(first?.internalTag).toBe('pragmatist')
    expect(first?.flags).toEqual([other.met])
    expect(first?.nextSegment).toBe(other.deep)
    expect(first?.conditions).toEqual([{ stat: `flags.${other.met}`, operator: '!=', value: true }])
  })

  it('hides the hear-other choice once the other candidate has been met', () => {
    const scene = segments.justice_theron_priority_answer
    const state = {} as GameState
    const hearOther = 'justice_theron_priority_answer_hear_other'

    const withoutMet = getAvailableChoices(scene as never, state, [])
    const withMet = getAvailableChoices(scene as never, state, ['met_justice_kesic'])

    expect(withoutMet.map(c => c.id)).toContain(hearOther)
    expect(withMet.map(c => c.id)).not.toContain(hearOther)
  })
})
