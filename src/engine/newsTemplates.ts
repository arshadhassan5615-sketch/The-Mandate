import type { GameState } from '../types/gameState'
import { evaluateAll } from './conditionEvaluator'
import type { Condition } from '../types/narrative'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Newspaper = 'herald' | 'standard' | 'vnn' | 'dispatch'
export type NewsCategory = 'economy' | 'military' | 'foreign' | 'social' | 'politics'

export interface NewsItem {
  id: string
  newspaper: Newspaper
  headline: string
  subline: string
  category: NewsCategory
  priority: number           // 1–10; higher shows first when multiple conditions fire
  conditions: Condition[]    // ALL must be true (AND logic)
}

export const NEWSPAPER_LABELS: Record<Newspaper, string> = {
  herald:   'The Ashenmere Herald',
  standard: 'The People\'s Standard',
  vnn:      'Veltrian National News',
  dispatch: 'The Foreign Dispatch',
}

// ─── Template bank ────────────────────────────────────────────────────────────

const TEMPLATES: NewsItem[] = [

  // ── UNEMPLOYMENT ────────────────────────────────────────────────────────────

  {
    id: 'unemp_crisis',
    newspaper: 'standard',
    headline: 'KRAVENSTAL JOBLESS RATE EXCEEDS TWENTY-EIGHT PERCENT — THIRD CONSECUTIVE MONTHLY RISE',
    subline: 'Union secretary calls the situation "an emergency requiring emergency measures." Factory gates in Vorek district closed for the season.',
    category: 'economy',
    priority: 9,
    conditions: [{ stat: 'nation.unemployment', operator: '>', value: 28 }],
  },
  {
    id: 'unemp_high',
    newspaper: 'herald',
    headline: 'UNEMPLOYMENT FIGURES DISAPPOINT — INDUSTRIAL OUTPUT FALLS SHORT OF PROJECTIONS FOR FOURTH MONTH',
    subline: 'Finance ministry declines to provide forward guidance. Opposition calls for emergency parliamentary session.',
    category: 'economy',
    priority: 7,
    conditions: [{ stat: 'nation.unemployment', operator: '>', value: 22 }],
  },
  {
    id: 'unemp_factory_collapse',
    newspaper: 'standard',
    headline: 'SECOND KRAVENSTAL PLANT SUSPENDS OPERATIONS — WORKERS OCCUPY PREMISES',
    subline: 'Management of Vael-Kross Steel Plant Three is unreachable for comment. Workers\' Unity Coalition demands nationalization.',
    category: 'economy',
    priority: 10,
    conditions: [{ stat: 'nation.unemployment', operator: '>', value: 32 }],
  },
  {
    id: 'unemp_improving',
    newspaper: 'herald',
    headline: 'EMPLOYMENT FIGURES SHOW FIRST POSITIVE READING IN SIX MONTHS',
    subline: 'Government credits investment measures; opposition calls the gains "statistical noise." Kravenstal figures remain elevated.',
    category: 'economy',
    priority: 5,
    conditions: [{ stat: 'nation.unemployment', operator: '<', value: 16 }],
  },

  // ── INFLATION ────────────────────────────────────────────────────────────────

  {
    id: 'inflation_severe',
    newspaper: 'herald',
    headline: 'PRICES UP OVER EIGHTEEN PERCENT FROM LAST YEAR — GROCERY COSTS AT FIFTEEN-YEAR HIGH',
    subline: 'Market research body reports household spending power at historic low. Bread queues reported in three Thornfeld towns.',
    category: 'economy',
    priority: 8,
    conditions: [{ stat: 'nation.inflation', operator: '>', value: 18 }],
  },
  {
    id: 'inflation_high',
    newspaper: 'herald',
    headline: 'ANNUAL INFLATION RUNNING AT DOUBLE FIGURES FOR SECOND CONSECUTIVE QUARTER',
    subline: 'National Bank of Veltria declines to comment on rate policy. Business consortium reports declining consumer confidence.',
    category: 'economy',
    priority: 6,
    conditions: [{ stat: 'nation.inflation', operator: '>', value: 12 }],
  },
  {
    id: 'inflation_tamed',
    newspaper: 'herald',
    headline: 'INFLATION FALLS BELOW SIX PERCENT — FIRST TIME IN THREE YEARS',
    subline: 'Finance ministry cautiously optimistic. Economists cite currency stabilization and reduced import costs.',
    category: 'economy',
    priority: 5,
    conditions: [{ stat: 'nation.inflation', operator: '<', value: 6 }],
  },

  // ── ECONOMY GENERAL ─────────────────────────────────────────────────────────

  {
    id: 'economy_ima_warning',
    newspaper: 'dispatch',
    headline: 'INTERNATIONAL MONETARY AUTHORITY PLACES VELTRIA ON CREDIT WATCH — STRUCTURAL REFORMS DEMANDED',
    subline: 'IMA spokesman says "adjustments may be necessary to avoid intervention." Krone under pressure on international markets.',
    category: 'economy',
    priority: 9,
    conditions: [{ stat: 'nation.economyHealth', operator: '<', value: -25 }],
  },
  {
    id: 'economy_debt_crisis',
    newspaper: 'herald',
    headline: 'NATIONAL DEBT EXCEEDS 450 MILLION KRONE — DEBT SERVICE NOW RECORD SHARE OF ANNUAL BUDGET',
    subline: 'Parliamentary Finance Committee requests emergency session on fiscal sustainability. Opposition calls for full audit.',
    category: 'economy',
    priority: 8,
    conditions: [{ stat: 'nation.nationalDebt', operator: '>', value: 450 }],
  },
  {
    id: 'economy_recovery',
    newspaper: 'herald',
    headline: 'VELTRIAN ECONOMY SHOWS FIRST SIGNS OF SUSTAINED RECOVERY SINCE THE HALVEK ERA',
    subline: 'Foreign investment inquiries rise for third consecutive quarter. Business confidence index improves. Unemployment still elevated.',
    category: 'economy',
    priority: 5,
    conditions: [{ stat: 'nation.economyHealth', operator: '>', value: 15 }],
  },
  {
    id: 'economy_kravenstal_base',
    newspaper: 'herald',
    headline: 'KRAVENSTAL STEEL PRODUCTION DOWN EIGHT PERCENT ON PRIOR YEAR — INDUSTRY REQUESTS GOVERNMENT SUPPORT',
    subline: 'Vael-Kross Holdings requests meeting with Finance Ministry. No date confirmed. Analysts warn of further contraction without investment.',
    category: 'economy',
    priority: 2,
    conditions: [],
  },

  // ── MILITARY / IRON COVENANT ─────────────────────────────────────────────────

  {
    id: 'military_critical',
    newspaper: 'vnn',
    headline: 'DEFENSE MINISTRY ACKNOWLEDGES CRITICAL EQUIPMENT AND PERSONNEL SHORTFALLS ACROSS ALL BRANCHES',
    subline: 'Iron Covenant parliamentarians demand emergency defense review session. Minister Dusek unavailable for comment.',
    category: 'military',
    priority: 9,
    conditions: [{ stat: 'nation.militaryReadiness', operator: '<', value: 30 }],
  },
  {
    id: 'military_distrust',
    newspaper: 'herald',
    headline: 'GENERAL BRENNER DECLINES GOVERNMENT INVITATION FOR THIRD CONSECUTIVE WEEK',
    subline: 'Military sources cite "growing concern" over the direction of civilian leadership. Government spokesman denies any tension.',
    category: 'military',
    priority: 8,
    conditions: [{ stat: 'factions.ironCovenant', operator: '<', value: 25 }],
  },
  {
    id: 'military_crisis',
    newspaper: 'herald',
    headline: 'UNNAMED MILITARY SOURCES DESCRIBE "INSTITUTIONAL CRISIS" IN ARMED FORCES RELATIONSHIP WITH GOVERNMENT',
    subline: 'Iron Covenant MPs decline comment. Three senior officers reportedly requested early retirement in past week.',
    category: 'military',
    priority: 10,
    conditions: [{ stat: 'factions.ironCovenant', operator: '<', value: 15 }],
  },
  {
    id: 'military_strong',
    newspaper: 'vnn',
    headline: 'IRON COVENANT PRAISES GOVERNMENT\'S COMMITMENT TO NATIONAL DEFENSE',
    subline: 'General Brenner calls current military readiness "satisfactory" in rare public statement. First positive assessment in years.',
    category: 'military',
    priority: 4,
    conditions: [
      { stat: 'nation.militaryReadiness', operator: '>', value: 65 },
      { stat: 'factions.ironCovenant', operator: '>', value: 60 },
    ],
  },

  // ── TYVAREN / FOREIGN THREATS ────────────────────────────────────────────────

  {
    id: 'tyvaren_exercises',
    newspaper: 'dispatch',
    headline: 'TYVAREN MILITARY EXERCISES CONTINUE NEAR GRAVENMARK PASSES — THIRD CONSECUTIVE WEEK',
    subline: 'Foreign ministry issues standard diplomatic protest. Tyvaren Embassy has not responded. Northern border traffic suspended.',
    category: 'foreign',
    priority: 9,
    conditions: [
      { stat: 'nation.militaryReadiness', operator: '<', value: 40 },
      { stat: 'currentWeek', operator: '>', value: 4 },
    ],
  },
  {
    id: 'tyvaren_ambassador',
    newspaper: 'dispatch',
    headline: 'TYVAREN AMBASSADOR DECLINES ASHENMERE DIPLOMATIC RECEPTION — SECOND CONSECUTIVE YEAR',
    subline: 'Tyvaren Foreign Ministry cites "scheduling conflict." Analysts describe the snub as deliberate and escalatory.',
    category: 'foreign',
    priority: 3,
    conditions: [{ stat: 'currentWeek', operator: '>', value: 1 }],
  },
  {
    id: 'refugees_growing',
    newspaper: 'herald',
    headline: 'MORIVASK REFUGEE NUMBERS PASS FIFTY THOUSAND — SEVAGRAD INFRASTRUCTURE UNDER CRITICAL STRAIN',
    subline: 'Provincial governor requests emergency federal assistance. Ashenmere has not responded. Refugee rate now 600 per week.',
    category: 'foreign',
    priority: 7,
    conditions: [{ stat: 'currentWeek', operator: '>', value: 3 }],
  },
  {
    id: 'morivask_default',
    newspaper: 'dispatch',
    headline: 'MORIVASK CRISIS ENTERS ANOTHER MONTH — INTERNATIONAL COMMUNITY DIVIDED ON RESPONSE',
    subline: 'Asturien Forum vote on peacekeeping authorization expected. Orythian Dominion expected to veto. 47,000 already in Veltria.',
    category: 'foreign',
    priority: 2,
    conditions: [],
  },

  // ── DRAVENNI ─────────────────────────────────────────────────────────────────

  {
    id: 'dravenni_demands',
    newspaper: 'dispatch',
    headline: 'DRAVENNI LIBERATION FRONT ISSUES STATEMENT DEMANDING AUTONOMY TALKS IN ASHENMERE',
    subline: 'DLF spokesperson: "the patience of a people has limits." Tyvaren reacts with interest; observers note the timing.',
    category: 'foreign',
    priority: 7,
    conditions: [{ stat: 'factions.dravenni', operator: '<', value: 30 }],
  },
  {
    id: 'dravenni_violence',
    newspaper: 'vnn',
    headline: 'VIOLENCE REPORTED IN DRAVENHOLLOW DISTRICT — GOVERNMENT INVESTIGATING',
    subline: 'DLF denies responsibility; claims government provocation. Three soldiers injured near Dravenni settlement. Situation unclear.',
    category: 'foreign',
    priority: 10,
    conditions: [{ stat: 'factions.dravenni', operator: '<', value: 15 }],
  },

  // ── PUBLIC ORDER / CIVIL LIBERTIES ──────────────────────────────────────────

  {
    id: 'order_protests',
    newspaper: 'vnn',
    headline: 'PUBLIC ORDER INCIDENTS UP FORTY PERCENT LAST MONTH — PARLIAMENT PROTESTS INTO FOURTH WEEK',
    subline: 'Ashenmere Police Commissioner under pressure to act. Government refuses to characterize protests as a security threat.',
    category: 'social',
    priority: 8,
    conditions: [{ stat: 'nation.publicOrder', operator: '<', value: 30 }],
  },
  {
    id: 'liberties_downgrade',
    newspaper: 'dispatch',
    headline: 'INTERNATIONAL OBSERVERS DOWNGRADE VELTRIA CIVIL LIBERTIES RATING FOR SECOND CONSECUTIVE YEAR',
    subline: 'Asturien Human Rights Commission cites "troubling pattern of restrictions." Government calls assessment "politically motivated."',
    category: 'social',
    priority: 7,
    conditions: [{ stat: 'nation.civilLiberties', operator: '<', value: 20 }],
  },
  {
    id: 'press_suppressed',
    newspaper: 'herald',
    headline: 'JOURNALISTS\' COMMITTEE: RESTRICTIONS ON INDEPENDENT MEDIA "ECHO THE HALVEK ERA"',
    subline: 'Three independent radio stations report government pressure to modify programming. BNI formally denies involvement.',
    category: 'social',
    priority: 9,
    conditions: [{ stat: 'nation.pressFreedom', operator: '<', value: 15 }],
  },
  {
    id: 'press_flourishing',
    newspaper: 'herald',
    headline: 'INDEPENDENT MEDIA FLOURISHES — HERALD LAUNCHES INVESTIGATIVE UNIT',
    subline: 'Herald editor: "a new era of press freedom." Five new independent publications registered this quarter.',
    category: 'social',
    priority: 4,
    conditions: [{ stat: 'nation.pressFreedom', operator: '>', value: 65 }],
  },

  // ── CHURCH ───────────────────────────────────────────────────────────────────

  {
    id: 'church_cold',
    newspaper: 'vnn',
    headline: 'ARCHBISHOP RENEK ISSUES PASTORAL LETTER EXPRESSING "GRAVE CONCERNS" OVER GOVERNMENT DIRECTION',
    subline: 'Letter read in all rural parishes across Thornfeld. Church sources say concerns are "moral, not political." Observers disagree.',
    category: 'social',
    priority: 8,
    conditions: [{ stat: 'factions.church', operator: '<', value: 30 }],
  },
  {
    id: 'church_rupture',
    newspaper: 'vnn',
    headline: 'CATHEDRAL SILENT ON NATIONAL THANKSGIVING — CHURCH AND STATE RELATIONSHIP AT BREAKING POINT',
    subline: 'Archbishop Renek: "we cannot in conscience endorse the current direction." First such statement since the Halvek era.',
    category: 'social',
    priority: 9,
    conditions: [{ stat: 'factions.church', operator: '<', value: 20 }],
  },
  {
    id: 'church_endorsement',
    newspaper: 'herald',
    headline: 'CHURCH OF THE ETERNAL FLAME EXPRESSES SUPPORT FOR REFORM PROGRAM — RARE POLITICAL STATEMENT',
    subline: 'Archbishop Renek: "the Chancellor has shown good faith." Rural approval polling shifts markedly positive.',
    category: 'social',
    priority: 5,
    conditions: [{ stat: 'factions.church', operator: '>', value: 70 }],
  },

  // ── POLITICAL FACTIONS ───────────────────────────────────────────────────────

  {
    id: 'reformists_revolt',
    newspaper: 'standard',
    headline: 'CIVIC RENEWAL COALITION IN OPEN REVOLT — THREE MPs REFUSE TO VOTE WITH GOVERNMENT',
    subline: 'Professor Theron calls emergency caucus. Government parliamentary majority now relies on vote-by-vote negotiations.',
    category: 'politics',
    priority: 9,
    conditions: [{ stat: 'factions.reformists', operator: '<', value: 35 }],
  },
  {
    id: 'halvekists_rising',
    newspaper: 'herald',
    headline: 'OLD GUARD ALLIANCE GROWS TO THIRTY-EIGHT SEATS — KOLVAR CLAIMS "MANDATE FOR ORDER"',
    subline: 'Opposition leader calls government reform agenda "discredited by its own failure." Three former VUF members re-registered.',
    category: 'politics',
    priority: 7,
    conditions: [{ stat: 'factions.halvekists', operator: '>', value: 65 }],
  },
  {
    id: 'workers_congress',
    newspaper: 'standard',
    headline: 'WORKERS\' UNITY COALITION CALLS EMERGENCY NATIONAL CONGRESS IN KRAVENSTAL',
    subline: 'Soraya Khaled: "this government has forgotten the workers who put it there." Congress expected to pass strike authorization.',
    category: 'politics',
    priority: 9,
    conditions: [{ stat: 'factions.workersCoalition', operator: '<', value: 25 }],
  },
  {
    id: 'business_flight',
    newspaper: 'herald',
    headline: 'BUSINESS CONSORTIUM SUSPENDS MEETINGS WITH GOVERNMENT — CAPITAL FLIGHT CONCERNS GROW',
    subline: 'Three major firms announce headquarters relocations. Consortium chair cites "policy uncertainty and hostile regulatory signals."',
    category: 'politics',
    priority: 8,
    conditions: [{ stat: 'factions.businessClass', operator: '<', value: 20 }],
  },
  {
    id: 'approval_low',
    newspaper: 'herald',
    headline: 'CHANCELLOR APPROVAL FALLS TO HISTORIC LOWS — POLLING SHOWS TWENTY-THREE PERCENT SUPPORT',
    subline: 'Even core reform coalition supporters express doubt. Government described by analysts as "without direction or momentum."',
    category: 'politics',
    priority: 9,
    conditions: [{ stat: 'personal.publicImage', operator: '<', value: 25 }],
  },
  {
    id: 'approval_strong',
    newspaper: 'herald',
    headline: 'GOVERNMENT APPROVAL HOLDS STEADY DESPITE ECONOMIC CHALLENGES — POLLING ABOVE FIFTY PERCENT',
    subline: 'Latest Ashenmere survey shows Chancellor retaining broad support. Reform agenda described as "difficult but necessary" by respondents.',
    category: 'politics',
    priority: 4,
    conditions: [{ stat: 'personal.publicImage', operator: '>', value: 70 }],
  },
  {
    id: 'halvek_legacy',
    newspaper: 'herald',
    headline: 'HALVEK ERA COMPENSATION FUND — LEGAL CHALLENGES CONTINUE IN ASHENMERE COURTS',
    subline: 'Attorneys for 400 former political prisoners seeking ruling on eligibility. Government has not commented on timeline.',
    category: 'politics',
    priority: 3,
    conditions: [{ stat: 'currentWeek', operator: '>', value: 2 }],
  },

]

// ─── Selection algorithm ──────────────────────────────────────────────────────

const MAX_HEADLINES = 4
const MAX_PER_CATEGORY = 2

export function selectHeadlines(state: GameState, flags: string[]): NewsItem[] {
  // Filter to templates whose conditions are all met
  const eligible = TEMPLATES.filter(t =>
    t.conditions.length === 0 || evaluateAll(t.conditions, state, flags),
  )

  // Sort by priority descending
  eligible.sort((a, b) => b.priority - a.priority)

  const selected: NewsItem[] = []
  const usedNewspapers = new Set<Newspaper>()
  const categoryCount = new Map<NewsCategory, number>()

  for (const item of eligible) {
    if (selected.length >= MAX_HEADLINES) break
    // Each newspaper appears at most once
    if (usedNewspapers.has(item.newspaper)) continue
    // Each category appears at most twice
    const catCount = categoryCount.get(item.category) ?? 0
    if (catCount >= MAX_PER_CATEGORY) continue

    selected.push(item)
    usedNewspapers.add(item.newspaper)
    categoryCount.set(item.category, catCount + 1)
  }

  // If we got fewer than 3, relax the newspaper constraint and refill
  if (selected.length < 3) {
    for (const item of eligible) {
      if (selected.length >= MAX_HEADLINES) break
      if (selected.find(s => s.id === item.id)) continue
      const catCount = categoryCount.get(item.category) ?? 0
      if (catCount >= MAX_PER_CATEGORY) continue
      selected.push(item)
      categoryCount.set(item.category, catCount + 1)
    }
  }

  return selected
}

// ─── Vyktor opening line ──────────────────────────────────────────────────────

export function generateVyktorOpening(
  week: number,
  headlines: NewsItem[],
  forcedChainCount: number,
  urgentCount: number,
): string[] {
  const lines: string[] = []
  const hasChains = forcedChainCount > 0
  const hasCrisis = urgentCount > 0
  const economyCrisis = headlines.some(h => h.category === 'economy' && h.priority >= 8)
  const militaryCrisis = headlines.some(h => h.category === 'military' && h.priority >= 8)

  if (week === 1) {
    lines.push('Chancellor. First week. I\'ll keep this brief — there will be less brief weeks ahead.')
    lines.push('Three headline items overnight. Read them carefully before we discuss your schedule.')
    return lines
  }

  // Opening
  if (militaryCrisis) {
    lines.push(`Week ${week}. There is a military situation you need to see before we proceed.`)
  } else if (hasChains) {
    lines.push(`Week ${week}. A decision you made previously has returned. I\'ve marked it below.`)
  } else if (economyCrisis) {
    lines.push(`Week ${week}. The numbers from Kravenstal are bad. Read the Standard first.`)
  } else if (hasCrisis) {
    lines.push(`Week ${week}. Something requires your immediate attention before we discuss the schedule.`)
  } else {
    const openers = [
      `Week ${week}. Three items, then your agenda.`,
      `Week ${week}. Quieter than usual. Don't let that fool you.`,
      `Week ${week}. Here is what the morning press has decided matters.`,
      `Week ${week}. I've flagged what requires your attention.`,
    ]
    lines.push(openers[week % openers.length])
  }

  // Transition line before agenda
  if (hasChains && hasCrisis) {
    lines.push('Two things that cannot wait are listed below. The rest of your schedule follows.')
  } else if (hasChains) {
    lines.push('The forced meeting is not optional. Your remaining agenda slots are yours to choose.')
  } else if (hasCrisis) {
    lines.push(`${urgentCount === 1 ? 'One item' : `${urgentCount} items`} marked urgent. I'd suggest prioritizing accordingly.`)
  } else {
    lines.push('Your schedule for the week is ready. Three slots.')
  }

  return lines
}
