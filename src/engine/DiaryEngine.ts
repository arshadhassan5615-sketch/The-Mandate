import { DIARY_ENTRIES, diaryDate, type DiaryContext } from '../data/diary/diaryEntries'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'

export interface DiaryEntry {
  week: number
  date: string
  text: string
  category: 'political' | 'personal' | 'crisis' | 'diplomatic' | 'military'
}

function classifyDiaryCategory(ctx: DiaryContext): DiaryEntry['category'] {
  if (ctx.stateOfEmergency || ctx.publicOrder < 35 || ctx.corruption > 75) return 'crisis'
  if (ctx.militaryReadiness < 40) return 'military'
  if (ctx.vaelInfluence > 50 || ctx.morvecInfluence > 30) return 'diplomatic'
  if (ctx.marriageHealth < 40 || ctx.lioraRelationship < 40 || ctx.tomasWellbeing < 40) return 'personal'
  return 'political'
}

export function generateDiaryEntry(week: number): DiaryEntry {
  const state = useGameStore.getState()
  const { activeFlags } = useNarrativeStore.getState()

  const ctx: DiaryContext = {
    week,
    flags: activeFlags,
    economyHealth: state.nation.economyHealth,
    corruption: state.nation.corruption,
    publicOrder: state.nation.publicOrder,
    militaryReadiness: state.nation.militaryReadiness,
    pressFreedom: state.nation.pressFreedom,
    marriageHealth: state.personal.marriageHealth,
    lioraRelationship: state.personal.lioraRelationship,
    tomasWellbeing: state.personal.tomasWellbeing,
    reformists: state.factions.reformists,
    halvekists: state.factions.halvekists,
    workersCoalition: state.factions.workersCoalition,
    ironCovenant: state.factions.ironCovenant,
    businessClass: state.factions.businessClass,
    church: state.factions.church,
    dravenni: state.factions.dravenni,
    vaelInfluence: state.vaelInfluence,
    morvecInfluence: state.morvecInfluence,
    stateOfEmergency: state.stateOfEmergency,
    seridaAlive: state.seridaAlive,
    seridaTrust: state.seridaTrust,
  }

  const entryFn = DIARY_ENTRIES[week]
  const text = entryFn
    ? entryFn(ctx)
    : `Week ${week}. Another seven days. The briefings pile up. The decisions multiply. I keep this diary because someday someone will ask me what it was like, and I will not remember unless I write it down.`

  return {
    week,
    date: diaryDate(week),
    text,
    category: classifyDiaryCategory(ctx),
  }
}

export type { DiaryContext } from '../data/diary/diaryEntries'
