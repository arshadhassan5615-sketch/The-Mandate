// Who owns each Veltrian newspaper, what it believes, what it bothers to cover,
// and how it closes every story with its own verdict. Read by the press
// coverage engine (engine/pressCoverage.ts).
import type { NewsCategory } from '../../types/news'

export type OutletId = 'ashenmere_herald' | 'peoples_standard' | 'kravenstal_worker' | 'veltrian_times' | 'thornfeld_gazette'

export interface OutletProfile {
  id: OutletId
  owner: string
  /** The paper's editorial line in a few words, printed under the masthead. */
  line: string
  /** Minor stories this paper bothers to print. Major stories run everywhere. */
  interests: readonly NewsCategory[] | 'all'
  /** Whose wire copy the paper runs when it has no story of its own. */
  wireFrom: 'herald' | 'standard'
  /** Opposition papers are shut down when press freedom collapses. */
  isOpposition: boolean
  /** The paper's own verdict, closing each story it reprints. */
  verdict: Partial<Record<NewsCategory, string>>
  /** Fallback verdict for categories without one. */
  defaultVerdict: string
  /** Prefix on the headlines this paper reprints. */
  kicker: string
}

export const MAJOR_CATEGORIES: readonly NewsCategory[] = ['crisis', 'war', 'constitutional', 'security']

export const OUTLETS: Record<OutletId, OutletProfile> = {
  ashenmere_herald: {
    id: 'ashenmere_herald',
    owner: 'The Halik family trust',
    line: 'Establishment centrist, close to the Chancellery',
    interests: 'all',
    wireFrom: 'herald',
    isOpposition: false,
    verdict: {},
    defaultVerdict: '',
    kicker: '',
  },
  peoples_standard: {
    id: 'peoples_standard',
    owner: "The Workers' Coalition press fund",
    line: 'Labour and the welfare state',
    interests: ['economy', 'budget', 'faction', 'governance', 'personal', 'media'],
    wireFrom: 'standard',
    isOpposition: false,
    verdict: {},
    defaultVerdict: '',
    kicker: '',
  },
  kravenstal_worker: {
    id: 'kravenstal_worker',
    owner: 'The Kravenstal steelworkers’ union',
    line: 'Militant labour, suspicious of every government',
    interests: ['economy', 'budget', 'faction', 'bni'],
    wireFrom: 'standard',
    isOpposition: true,
    verdict: {
      economy: 'The furnaces will tell us whether this changes anything. Until wages move, the Chancellery has only moved words.',
      budget: 'Every krone the palace spends was earned at a lathe. We will be counting.',
      faction: 'The parties trade seats; the shift whistle still blows at five.',
      bni: 'The secret police watched the unions under Halvek. Ask who they watch now.',
      crisis: 'In every crisis the workers are told to be patient. We have been patient for thirty years.',
      war: 'Generals plan the war; the foundries pay for it.',
      constitutional: 'A new constitution is only paper until it puts power in working hands.',
      security: 'Order for whom? The picket line has heard that word before.',
    },
    defaultVerdict: 'Solidarity is the only policy that has never failed us.',
    kicker: 'WORKER VIEW: ',
  },
  veltrian_times: {
    id: 'veltrian_times',
    owner: 'Independent, reader-funded',
    line: 'Reformist, watchdog of the state',
    interests: ['constitutional', 'media', 'bni', 'governance', 'diplomacy', 'personal'],
    wireFrom: 'herald',
    isOpposition: true,
    verdict: {
      constitutional: 'Reform is measured by what the government gives up, not by what it promises.',
      media: 'A free press is not a privilege the Chancellery grants. It is the test it must pass.',
      bni: 'No democracy survives an intelligence service that answers to no one.',
      governance: 'Accountability begins where press releases end.',
      diplomacy: 'Foreign friends who ask for silence at home are not friends of the Republic.',
      personal: 'The Chancellor’s private life is her own until it shapes public policy.',
      crisis: 'Emergencies are when liberties are lost. We will be watching which ones.',
      war: 'The first casualty of war is the truth. This paper intends to keep it alive.',
      security: 'Security that cannot be questioned is not security. It is rule.',
      economy: 'The numbers matter more than the speeches. We will print both.',
    },
    defaultVerdict: 'The Times will keep asking the questions the palace would rather not hear.',
    kicker: 'ANALYSIS: ',
  },
  thornfeld_gazette: {
    id: 'thornfeld_gazette',
    owner: 'Thornfeld landholders and the diocese',
    line: 'Rural, Church and tradition',
    interests: ['budget', 'faction', 'security', 'war', 'diplomacy'],
    wireFrom: 'herald',
    isOpposition: false,
    verdict: {
      budget: 'The capital spends; the countryside pays. The harvest does not wait on ministries.',
      faction: 'The Republic was steadier when it remembered where it came from.',
      security: 'Order first. Everything else is a luxury of the city.',
      war: 'Veltria’s sons are ready. We pray the government is worthy of them.',
      diplomacy: 'Foreign entanglements rarely end well for the farmer.',
      crisis: 'In hard times the Church and the land have always held this nation together.',
      constitutional: 'Change the constitution with care. What took centuries to build can be undone in a session.',
      economy: 'Prices in the market square tell the truth the capital’s figures will not.',
    },
    defaultVerdict: 'The heartland is listening, and the heartland remembers.',
    kicker: 'FROM THE CAPITAL: ',
  },
}
