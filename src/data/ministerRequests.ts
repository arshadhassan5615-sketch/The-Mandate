import type { MinisterRequest, MinistryType } from '../types/minister'

let requestCounter = 0
const makeId = () => `req_${++requestCounter}_${Date.now()}`

export const generateWeeklyRequests = (
  week: number,
  ministers: Record<MinistryType, unknown>,
  activeFlags: string[] = [],
): MinisterRequest[] => {
  const requests: MinisterRequest[] = []

  const fm = ministers.finance as { id: string } | null
  const im = ministers.interior as { id: string } | null
  const dm = ministers.defense as { id: string } | null
  const em = ministers.education as { id: string } | null
  const hm = ministers.health as { id: string } | null
  const fa = ministers.foreign_affairs as { id: string } | null

  // Finance minister report every 2 weeks
  if (week % 2 === 0 && fm) {
    requests.push({
      id: makeId(),
      minister_id: fm.id,
      week,
      type: 'budget',
      title: `Budget Review — Week ${week}`,
      description: fm.id === 'elara_vostane'
        ? `Chancellor. Revenue projections for the quarter are holding, but the infrastructure line is being drawn down faster than projected. I need a decision on whether we reallocate from the military reserve or accept the shortfall.`
        : `The quarterly numbers are within acceptable variance. I would recommend we discuss the debt service schedule before the next session. There are options worth considering.`,
      options: [
        {
          id: 'reallocate',
          text: 'Reallocate from military reserve',
          stat_effects: { budget: 15, military_readiness: -8 },
          loyalty_effect: 5,
          satisfaction_effect: 10,
          flag: 'budget_reallocated_military',
          consequence: 'Frees up funds but reduces military flexibility.',
        },
        {
          id: 'accept_shortfall',
          text: 'Accept the shortfall for now',
          stat_effects: { budget: -10 },
          loyalty_effect: -3,
          satisfaction_effect: -5,
          consequence: 'Maintains military reserve but tightens the budget.',
        },
        {
          id: 'emergency_review',
          text: 'Commission a full emergency review',
          stat_effects: { budget: 0, public_trust: -3 },
          loyalty_effect: 2,
          satisfaction_effect: 3,
          flag: 'budget_emergency_review',
          consequence: 'Delays the decision but gives more information.',
        },
      ],
      urgent: false,
    })
  }

  // Interior minister report every 3 weeks
  if (week % 3 === 0 && im) {
    requests.push({
      id: makeId(),
      minister_id: im.id,
      week,
      type: 'policy',
      title: `Internal Security Report — Week ${week}`,
      description: im.id === 'danika_oberlin'
        ? `Three regional governors have requested increased security presence in their districts ahead of the constitutional referendum. I can authorize it under existing emergency protocols, but it would look better with your direct instruction.`
        : `The regional situation is stable. However, I have received informal requests from two governors that I think require your judgment rather than mine.`,
      options: [
        {
          id: 'authorize_security',
          text: 'Authorize increased security presence',
          stat_effects: { public_order: 10, civil_liberties: -8 },
          loyalty_effect: 8,
          satisfaction_effect: 10,
          flag: 'security_presence_increased',
          consequence: 'Stabilizes the regions but raises civil liberties concerns.',
        },
        {
          id: 'deny_request',
          text: 'Deny the request — maintain current levels',
          stat_effects: { civil_liberties: 5, public_order: -5 },
          loyalty_effect: -5,
          satisfaction_effect: -8,
          consequence: 'Protects civil liberties but leaves governors frustrated.',
        },
        {
          id: 'targeted_response',
          text: 'Authorize targeted response only',
          stat_effects: { public_order: 4, civil_liberties: -2 },
          loyalty_effect: 3,
          satisfaction_effect: 4,
          consequence: 'A compromise that partially satisfies both concerns.',
        },
      ],
      urgent: false,
    })
  }

  // Defense minister every 4 weeks
  if (week % 4 === 0 && dm) {
    requests.push({
      id: makeId(),
      minister_id: dm.id,
      week,
      type: 'policy',
      title: `Defense Readiness Report — Week ${week}`,
      description: dm.id === 'colonel_dusek'
        ? `Chancellor. The northern border units are under-equipped for winter operations. The procurement request has been sitting in Finance for six weeks. I am not asking you to bypass the process. I am asking you to remind Finance that soldiers feel the cold.`
        : `Defense readiness is at acceptable levels. I have several procurement recommendations that would significantly improve our strategic posture if approved.`,
      options: [
        {
          id: 'expedite_procurement',
          text: 'Expedite the procurement request',
          stat_effects: { military_readiness: 15, budget: -12 },
          loyalty_effect: 10,
          satisfaction_effect: 12,
          flag: 'defense_procurement_expedited',
          consequence: 'Improves readiness but strains the budget.',
        },
        {
          id: 'standard_process',
          text: 'Let it proceed through standard channels',
          stat_effects: { military_readiness: -5 },
          loyalty_effect: -4,
          satisfaction_effect: -6,
          consequence: 'Respects process but leaves troops under-equipped.',
        },
        {
          id: 'partial_release',
          text: 'Release emergency winter supplies only',
          stat_effects: { military_readiness: 6, budget: -4 },
          loyalty_effect: 4,
          satisfaction_effect: 5,
          consequence: 'A targeted compromise addressing immediate needs.',
        },
      ],
      urgent: false,
    })
  }

  // Education minister every 3 weeks
  if (week % 3 === 1 && em) {
    requests.push({
      id: makeId(),
      minister_id: em.id,
      week,
      type: 'policy',
      title: `Education Report — Week ${week}`,
      description: em.id === 'marta_solen'
        ? `Chancellor. The Church is blocking implementation of the new civic curriculum in sixty-seven schools in Dravenhollow and Thornfeld. Archbishop Renek has been polite. He has also been immovable. I need to know how much of my mandate you are prepared to back.`
        : `Implementation of the current curriculum is proceeding within expected parameters. There are some regional variations I would like to discuss at your convenience.`,
      options: [
        {
          id: 'back_minister',
          text: 'Back the minister fully — implement the curriculum',
          stat_effects: {
            reformist_support: 12,
            church_relations: -15,
            education_index: 10,
          },
          loyalty_effect: 12,
          satisfaction_effect: 15,
          flag: 'curriculum_reform_backed',
          consequence: 'Advances reform but significantly damages Church relations.',
        },
        {
          id: 'negotiate',
          text: 'Negotiate a compromise with the Church',
          stat_effects: {
            church_relations: 5,
            education_index: 4,
            reformist_support: -3,
          },
          loyalty_effect: -3,
          satisfaction_effect: -5,
          consequence: 'Preserves the relationship but slows reform.',
        },
        {
          id: 'defer',
          text: 'Defer to regional governors on implementation',
          stat_effects: {
            church_relations: 8,
            education_index: -2,
            reformist_support: -8,
          },
          loyalty_effect: -8,
          satisfaction_effect: -12,
          consequence: 'Avoids conflict but abandons the minister.',
        },
      ],
      urgent: false,
    })
  }

  // Health minister every 4 weeks
  if (week % 4 === 2 && hm) {
    requests.push({
      id: makeId(),
      minister_id: hm.id,
      week,
      type: 'budget',
      title: `Health System Report — Week ${week}`,
      description: hm.id === 'lena_kaspar'
        ? `The rural clinic network in Ashenmere Province is operating at forty percent capacity due to staffing shortages. I have a plan to fix it. It costs thirty-one million Krone and requires cutting the pharmaceutical procurement contract with Valdek Industries. I am aware of the political implications.`
        : `Health system metrics are within acceptable ranges. I have identified some procurement efficiencies I would like to discuss.`,
      options: [
        {
          id: 'approve_plan',
          text: 'Approve the plan and cut the contract',
          stat_effects: {
            public_health: 18,
            budget: -31,
            oligarch_relations: -12,
          },
          loyalty_effect: 15,
          satisfaction_effect: 18,
          flag: 'health_reform_approved',
          consequence: 'Significantly improves public health but creates powerful enemies.',
        },
        {
          id: 'approve_modified',
          text: 'Approve a modified version — keep the contract',
          stat_effects: {
            public_health: 8,
            budget: -15,
          },
          loyalty_effect: -4,
          satisfaction_effect: -6,
          consequence: 'Partial improvement but disappoints the minister.',
        },
        {
          id: 'defer_health',
          text: 'Defer — request a less disruptive proposal',
          stat_effects: { public_health: -3 },
          loyalty_effect: -10,
          satisfaction_effect: -15,
          consequence: 'Avoids conflict but the situation continues to deteriorate.',
        },
      ],
      urgent: false,
    })
  }

  // Foreign affairs — one-shot ambassador appointment (week 4+)
  if (
    week >= 4 &&
    fa &&
    !activeFlags.includes('tyvaren_ambassador_appointed') &&
    !activeFlags.includes('tyvaren_ambassador_political_pick')
  ) {
    requests.push({
      id: makeId(),
      minister_id: fa.id,
      week,
      type: 'policy',
      title: 'Tyvaren Ambassador Appointment',
      description: fa.id === 'vera_sorin'
        ? `Chancellor. The ambassadorship to Tyvaren has sat vacant for six weeks — an unusual gap that the Confederation has noticed. I have two candidates. One is a career diplomat who has spent a decade building trust across that border. The other is politically useful to you domestically, but Tyvaren does not know him, and unfamiliarity at that particular border makes me uneasy.`
        : `The Tyvaren posting needs to be filled. I have two names for you. I will say plainly — one of them I would send. The other I would not, but you may have reasons I don't.`,
      options: [
        {
          id: 'appoint_career_diplomat',
          text: 'Appoint the career diplomat to Tyvaren',
          stat_effects: { international_standing: 8, tyvaren_tension: -6 },
          loyalty_effect: 6,
          satisfaction_effect: 8,
          flag: 'tyvaren_ambassador_appointed',
          consequence: 'Strengthens diplomatic ties with Tyvaren but offers no domestic political benefit.',
        },
        {
          id: 'appoint_political_ally',
          text: 'Appoint the domestically useful candidate',
          stat_effects: { international_standing: -3, tyvaren_tension: 4 },
          loyalty_effect: -2,
          satisfaction_effect: -5,
          flag: 'tyvaren_ambassador_political_pick',
          consequence: 'Strengthens a domestic political relationship but unsettles Tyvaren.',
        },
        {
          id: 'delay_appointment',
          text: 'Delay the appointment further',
          stat_effects: { international_standing: -5, tyvaren_tension: 3 },
          loyalty_effect: -4,
          satisfaction_effect: -6,
          consequence: 'The vacancy continues to be noticed and increasingly resented.',
        },
      ],
      urgent: false,
    })
  }

  return requests
}
