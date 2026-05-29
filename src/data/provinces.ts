export interface ProvinceData {
  id: string
  name: string
  subtitle: string
  population: number
  populationRanking: string
  gdp: number
  gdpRanking: string
  dominantFaction: string
  keyIndustry: string
  ethnicity: { veltrian: number; dravenni: number; morivask: number; other: number }
  politics: Record<string, number>
  description: string
  skylineType: 'city' | 'industrial' | 'rural' | 'fortress' | 'harbor' | 'mountain'
}

export const PROVINCES: Record<string, ProvinceData> = {
  ashenmere: {
    id: 'ashenmere',
    name: 'Ashenmere',
    subtitle: 'Capital Region',
    population: 1200000,
    populationRanking: '1st',
    gdp: 680,
    gdpRanking: '1st',
    dominantFaction: 'Civic Renewal',
    keyIndustry: 'Government, Finance, Media',
    ethnicity: { veltrian: 85, dravenni: 5, morivask: 8, other: 2 },
    politics: { reformist: 40, halvekist: 20, workers: 20, business: 15, other: 5 },
    description: 'The beating heart of the Republic. Ashenmere houses the National Assembly, the Supreme Court, and the seat of the Chancellery. Urban, cosmopolitan, and the center of Veltrian political life.',
    skylineType: 'city',
  },
  kravenstal: {
    id: 'kravenstal',
    name: 'Kravenstal',
    subtitle: 'Industrial Heartland',
    population: 890000,
    populationRanking: '2nd',
    gdp: 520,
    gdpRanking: '2nd',
    dominantFaction: "Workers' Unity",
    keyIndustry: 'Steel, Coal, Manufacturing',
    ethnicity: { veltrian: 92, dravenni: 3, morivask: 3, other: 2 },
    politics: { workers: 50, reformist: 15, halvekist: 15, business: 10, other: 10 },
    description: 'Smoke and steel and solidarity. The industrial furnace of Veltria where generations of workers have forged the nation\'s wealth — and its conscience.',
    skylineType: 'industrial',
  },
  thornfeld: {
    id: 'thornfeld',
    name: 'Thornfeld',
    subtitle: 'The Heartland',
    population: 340000,
    populationRanking: '5th',
    gdp: 180,
    gdpRanking: '5th',
    dominantFaction: 'Church of the Eternal Flame',
    keyIndustry: 'Agriculture, Livestock',
    ethnicity: { veltrian: 96, dravenni: 1, morivask: 1, other: 2 },
    politics: { church: 40, halvekist: 30, reformist: 10, workers: 10, other: 10 },
    description: 'Golden fields and church steeples against a wide sky. Thornfeld is the spiritual and agricultural anchor of Veltria — traditional, devout, and deeply suspicious of Ashenmere\'s reforms.',
    skylineType: 'rural',
  },
  sevagrad: {
    id: 'sevagrad',
    name: 'Sevagrad',
    subtitle: 'Eastern Border',
    population: 280000,
    populationRanking: '6th',
    gdp: 150,
    gdpRanking: '6th',
    dominantFaction: 'Iron Covenant',
    keyIndustry: 'Mining, Military',
    ethnicity: { veltrian: 78, dravenni: 5, morivask: 15, other: 2 },
    politics: { ironCovenant: 35, halvekist: 25, workers: 20, reformist: 10, other: 10 },
    description: 'A scarred land that never forgets. The eastern frontier has borne the brunt of every Tyvaren incursion. Fortress towns and mine shafts run deep into the mountains.',
    skylineType: 'fortress',
  },
  aldenmoor: {
    id: 'aldenmoor',
    name: 'Aldenmoor',
    subtitle: 'The Amber Coast',
    population: 420000,
    populationRanking: '3rd',
    gdp: 380,
    gdpRanking: '3rd',
    dominantFaction: 'Business Class',
    keyIndustry: 'Shipping, Tourism, Trade',
    ethnicity: { veltrian: 82, dravenni: 3, morivask: 5, other: 10 },
    politics: { business: 40, reformist: 25, workers: 15, halvekist: 10, other: 10 },
    description: 'Salt air and shipping contracts. The Amber Coast is Veltria\'s window to the Thalassic Sea — and by extension, to the world. Money talks louder here than anywhere else.',
    skylineType: 'harbor',
  },
  dravenhollow: {
    id: 'dravenhollow',
    name: 'Dravenhollow',
    subtitle: 'Northern Mountains',
    population: 180000,
    populationRanking: '4th',
    gdp: 120,
    gdpRanking: '4th',
    dominantFaction: 'Dravenni Liberation Front',
    keyIndustry: 'Timber, Hydroelectric',
    ethnicity: { veltrian: 45, dravenni: 48, morivask: 2, other: 5 },
    politics: { dravenni: 55, reformist: 20, halvekist: 10, other: 15 },
    description: 'Mountain and memory. The Dravenni people have lived in these high valleys for centuries — and been governed by distant capitals for just as long. The autonomy movement is strongest here.',
    skylineType: 'mountain',
  },
}

export const PROVINCE_ORDER = ['ashenmere', 'kravenstal', 'aldenmoor', 'dravenhollow', 'thornfeld', 'sevagrad']
