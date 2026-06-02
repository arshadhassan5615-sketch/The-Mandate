import type { Condition } from './narrative'

export type NewsCategory =
  | 'bni'
  | 'economy'
  | 'security'
  | 'constitutional'
  | 'diplomacy'
  | 'personal'
  | 'faction'
  | 'budget'
  | 'crisis'
  | 'war'
  | 'governance'
  | 'media'

export type Publication = 'ashenmere_herald' | 'peoples_standard' | 'veltrian_voice' | 'veltrian_times' | 'kravenstal_worker' | 'thornfeld_gazette'

export interface NewsArticle {
  id: string
  headline: string
  body: string
  publication: Publication
  weekNumber: number
  date: string
  templateId: string
  category: NewsCategory
}

export interface NewsTemplate {
  trigger: string
  category: NewsCategory
  conditions?: Condition[]
  herald: { headline: string; body: string }
  standard: { headline: string; body: string }
  worker?: { headline: string; body: string }
  times?: { headline: string; body: string }
  gazette?: { headline: string; body: string }
}
