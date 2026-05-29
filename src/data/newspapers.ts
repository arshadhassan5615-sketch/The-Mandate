import type { Publication } from '../types/news'

export interface NewspaperDef {
  id: Publication | 'kravenstal_worker' | 'veltrian_times' | 'thornfeld_gazette'
  name: string
  tagline: string
  shortName: string
  politicalLean: string
  fontFamily: string
  bodyFontFamily: string
  accentColor: string
  headerStyle: string
  paperColor: string
  textColor: string
  established: number
  price: number
  reporterName: string
}

export const NEWSPAPERS: Record<string, NewspaperDef> = {
  ashenmere_herald: {
    id: 'ashenmere_herald',
    name: 'The Ashenmere Herald',
    tagline: 'Voice of the Republic Since 1891',
    shortName: 'Herald',
    politicalLean: 'centrist',
    fontFamily: "'Playfair Display', Georgia, serif",
    bodyFontFamily: "'Libre Baskerville', Georgia, serif",
    accentColor: '#1a1a2e',
    headerStyle: 'traditional broadsheet',
    paperColor: '#f5f0e8',
    textColor: '#1a1814',
    established: 1891,
    price: 2,
    reporterName: 'Viktor Halik',
  },
  peoples_standard: {
    id: 'peoples_standard',
    name: "The People's Standard",
    tagline: 'For the Workers of Veltria',
    shortName: 'Standard',
    politicalLean: 'left',
    fontFamily: "'Libre Baskerville', Georgia, serif",
    bodyFontFamily: "'Crimson Text', Georgia, serif",
    accentColor: '#8b1a1a',
    headerStyle: 'bold tabloid',
    paperColor: '#faf6ee',
    textColor: '#1a1410',
    established: 1921,
    price: 1,
    reporterName: 'Mira Stokov',
  },
  kravenstal_worker: {
    id: 'kravenstal_worker',
    name: 'Kravenstal Worker',
    tagline: 'Steel. Truth. Solidarity.',
    shortName: 'Worker',
    politicalLean: 'far-left',
    fontFamily: "'IBM Plex Serif', Georgia, serif",
    bodyFontFamily: "'IBM Plex Serif', Georgia, serif",
    accentColor: '#c0392b',
    headerStyle: 'industrial',
    paperColor: '#fefaf4',
    textColor: '#1c1410',
    established: 1914,
    price: 1,
    reporterName: 'Petra Dornik',
  },
  veltrian_times: {
    id: 'veltrian_times',
    name: 'The Veltrian Times',
    tagline: 'Independent. Unafraid.',
    shortName: 'Times',
    politicalLean: 'reformist',
    fontFamily: "'Crimson Text', Georgia, serif",
    bodyFontFamily: "'Crimson Text', Georgia, serif",
    accentColor: '#2c3e50',
    headerStyle: 'classic broadsheet',
    paperColor: '#f8f4ec',
    textColor: '#1a1814',
    established: 1958,
    price: 2,
    reporterName: 'Nadia Voss',
  },
  thornfeld_gazette: {
    id: 'thornfeld_gazette',
    name: 'Thornfeld Gazette',
    tagline: 'Serving the Heartland',
    shortName: 'Gazette',
    politicalLean: 'conservative',
    fontFamily: "'EB Garamond', Georgia, serif",
    bodyFontFamily: "'EB Garamond', Georgia, serif",
    accentColor: '#4a4a2a',
    headerStyle: 'rural broadsheet',
    paperColor: '#faf3e6',
    textColor: '#1a1612',
    established: 1923,
    price: 1,
    reporterName: 'Matthias Horn',
  },
}

export const TAB_ORDER: NewspaperDef['id'][] = [
  'ashenmere_herald',
  'peoples_standard',
  'kravenstal_worker',
  'veltrian_times',
  'thornfeld_gazette',
]
