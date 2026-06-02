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

function getDinnerDiaryText(week: number, flags: string[]): string | null {
  const dinnerWeeks = [6, 12, 18, 24, 30, 36, 42, 48]
  if (!dinnerWeeks.includes(week)) return null

  if (flags.includes('dinner_engaged')) {
    return 'Had dinner with the family tonight. Jonas opened a bottle from before the war. For one evening, I was not the Chancellor. I was just Katerin — a wife, a mother, a person sitting at her own table. Liora told me about a book she is reading. Tomas made a joke that actually landed. I should do this more often. I know I will not.'
  }
  if (flags.includes('dinner_deflected')) {
    return 'Family dinner. I was there physically. I talked about the weather and a book I have not actually read. Jonas was polite — more polite than I deserved. I could feel the distance between us like a glass wall. The children know when I am not really present. They have learned to stop expecting me to be.'
  }
  if (flags.includes('dinner_abandoned')) {
    return 'I left dinner early again. Vyktor was waiting with briefings. There is always a crisis. Liora said what everyone was thinking: you are always leaving. She is right. I am always leaving. The country needs a Chancellor. The children need a mother. I do not know how to be both, and I am beginning to suspect that nobody does.'
  }
  return 'Family dinner tonight. The ritual continues — the table, the wine, the questions I cannot answer. They are still here. That matters more than I usually admit.'
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

  const dinnerText = getDinnerDiaryText(week, activeFlags)
  if (dinnerText) {
    return { week, date: diaryDate(week), text: dinnerText, category: 'personal' }
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
