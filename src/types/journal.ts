export type JournalCategory = 'policy' | 'diplomacy' | 'personal' | 'legislation' | 'crisis' | 'reform'

export type ChoiceAlignment = 'reformist' | 'pragmatist' | 'authoritarian' | 'populist' | 'personal' | 'deflect'

export interface JournalEntryMeta {
  title: string
  description: string
  icon: string
}

export interface JournalEntry {
  id: string
  weekNumber: number
  date: string
  category: JournalCategory
  alignment: ChoiceAlignment | null
  title: string
  description: string
  consequences: string | null
  icon: string
  sceneId: string
  choiceId: string
  flag: string | null
  createdAt: number
}

export const CATEGORY_COLORS: Record<JournalCategory, string> = {
  policy: 'var(--accent-blue)',
  diplomacy: '#2a7a7a',
  personal: '#c8902a',
  legislation: 'var(--accent-green)',
  crisis: 'var(--accent-red)',
  reform: '#7a3a9a',
}

export const CATEGORY_LABELS: Record<JournalCategory, string> = {
  policy: 'Policy',
  diplomacy: 'Diplomacy',
  personal: 'Personal',
  legislation: 'Legislation',
  crisis: 'Crisis',
  reform: 'Reform',
}

export const CATEGORY_ICONS: Record<JournalCategory, string> = {
  policy: '⚖',
  diplomacy: '◇',
  personal: '♥',
  legislation: '§',
  crisis: '!',
  reform: '✦',
}

export const ALIGNMENT_LABELS: Record<ChoiceAlignment, string> = {
  reformist: 'Reformist',
  pragmatist: 'Pragmatist',
  authoritarian: 'Authoritarian',
  populist: 'Populist',
  personal: 'Personal',
  deflect: 'Deflection',
}

export const ALIGNMENT_COLORS: Record<ChoiceAlignment, string> = {
  reformist: 'var(--accent-green)',
  pragmatist: 'var(--amber-dim)',
  authoritarian: 'var(--accent-red)',
  populist: 'var(--amber)',
  personal: '#c8902a',
  deflect: '#6b6050',
}

export interface JournalStats {
  totalEntries: number
  alignmentBreakdown: Record<ChoiceAlignment, number>
  categoryBreakdown: Record<JournalCategory, number>
  billsSigned: number
  billsVetoed: number
  dominantAlignment: ChoiceAlignment | null
}
