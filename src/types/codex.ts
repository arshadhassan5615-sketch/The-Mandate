export type CodexCategory =
  | 'nations'
  | 'history'
  | 'characters'
  | 'ideologies'
  | 'economy'
  | 'laws'
  | 'journal'

export interface CodexEntry {
  id: string
  category: CodexCategory
  title: string
  content: string          // lightweight markdown: **bold**, *italic*, ## heading, - list
  unlockCondition: 'start' | string  // 'start' = always visible; string = flag name
}

export const CATEGORY_LABELS: Record<CodexCategory, string> = {
  nations:    'Nations & Geography',
  history:    'History',
  characters: 'Characters',
  ideologies: 'Ideologies',
  economy:    'Economy',
  laws:       'Laws & Constitution',
  journal:    'Personal Journal',
}
