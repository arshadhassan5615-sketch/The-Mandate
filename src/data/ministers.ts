import type { MinisterCandidate, MinistryType } from '../types/minister'

export const MINISTER_CANDIDATES: MinisterCandidate[] = [

  // ═══ FINANCE ═══
  {
    id: 'elara_vostane',
    name: 'Elara Vostane',
    title: 'Former Director, Anti-Corruption Bureau',
    ministry: 'finance',
    portrait: 'src/assets/potraits/elara_vostane.jpeg',
    age: 46,
    ideology: 'reformist',
    loyalty: 70,
    competence: 88,
    corruption_risk: 8,
    faction_ties: ['reformists', 'civic_renewal'],
    traits: ['intellectual', 'principled', 'decisive'],
    background: 'Spent twelve years dismantling fraudulent procurement networks inside the Finance Ministry itself. Knows where every ghost contract is buried. The old guard fears her.',
    vyktor_assessment: 'She will find things we did not ask her to find.',
    weakness: 'Will not compromise on process even when speed is needed.'
  },
  {
    id: 'drazen_kolvar',
    name: 'Drazen Kolvar',
    title: 'Senior Advisor, Central Bank of Veltria',
    ministry: 'finance',
    portrait: 'src/assets/potraits/drazen_kolvar.jpeg',
    age: 58,
    ideology: 'conservative',
    loyalty: 60,
    competence: 82,
    corruption_risk: 35,
    faction_ties: ['halvekists', 'banking_bloc'],
    traits: ['calculating', 'connected', 'cautious'],
    background: 'Thirty years navigating Veltrian monetary policy through three governments. Knows which levers to pull. Also knows who is watching those levers.',
    vyktor_assessment: 'Competent. Not entirely ours.',
    weakness: 'Tied to the banking bloc in ways he has not disclosed.'
  },

  // ═══ INTERIOR ═══
  {
    id: 'danika_oberlin',
    name: 'Danika Oberlin',
    title: 'Party Security Director',
    ministry: 'interior',
    portrait: 'src/assets/potraits/danika_oberlin.jpeg',
    age: 44,
    ideology: 'loyalist',
    loyalty: 85,
    competence: 74,
    corruption_risk: 20,
    faction_ties: ['civic_renewal', 'party_loyalists'],
    traits: ['loyal', 'decisive', 'calculating'],
    background: 'Ran internal security for the Civic Renewal party for eight years. Knows how power operates from the inside. Her loyalty is genuine and therefore useful.',
    vyktor_assessment: 'She will do what you ask. Make sure you ask the right things.',
    weakness: 'Loyalty to the party can override judgment.'
  },
  {
    id: 'nikolai_perov',
    name: 'Nikolai Perov',
    title: 'Former Governor, Thornfeld Province',
    ministry: 'interior',
    portrait: 'src/assets/potraits/nikolai_perov.jpeg',
    age: 52,
    ideology: 'pragmatist',
    loyalty: 65,
    competence: 80,
    corruption_risk: 25,
    faction_ties: ['regional_bloc', 'moderates'],
    traits: ['practical', 'collaborative', 'methodical'],
    background: 'Governed Thornfeld through the mining strikes of 1959 without losing control or ordering violence. That is rarer than it sounds in this republic.',
    vyktor_assessment: 'He solves problems. He also avoids them until they are unavoidable.',
    weakness: 'Conflict-avoidant. Will delay hard decisions.'
  },

  // ═══ DEFENSE ═══
  {
    id: 'colonel_dusek',
    name: 'Colonel Irina Dusek',
    title: 'Commander, Northern Defense Command',
    ministry: 'defense',
    portrait: 'src/assets/potraits/colonel_dusek.jpeg',
    age: 51,
    ideology: 'pragmatist',
    loyalty: 75,
    competence: 91,
    corruption_risk: 5,
    faction_ties: ['military_command', 'northern_bloc'],
    traits: ['principled', 'decisive', 'direct'],
    background: 'Twenty-three years of field command. Served on the Tyvaren border during the 1954 incident. Recommends against escalation because she has seen what escalation costs.',
    vyktor_assessment: 'The best officer we have. Also the most likely to tell you things you do not want to hear.',
    weakness: 'Will resign before following an order she considers wrong.'
  },
  {
    id: 'general_vass',
    name: 'General Mikov Vass',
    title: 'Deputy Chief of the General Staff',
    ministry: 'defense',
    portrait: 'src/assets/potraits/general_vass.jpeg',
    age: 57,
    ideology: 'nationalist',
    loyalty: 68,
    competence: 78,
    corruption_risk: 30,
    faction_ties: ['military_hardliners', 'nationalist_bloc'],
    traits: ['ambitious', 'calculating', 'loyal'],
    background: 'Career staff officer with strong connections to the military industrial procurement network. Believes in strength through visible force. Has never commanded in the field.',
    vyktor_assessment: 'He wants the Defense Ministry more than he wants to defend anything.',
    weakness: 'Procurement ties to contractors we have not vetted.'
  },

  // ═══ JUSTICE ═══
  {
    id: 'aldric_theron',
    name: 'Aldric Theron',
    title: 'Professor of Constitutional Law',
    ministry: 'justice',
    portrait: 'src/assets/potraits/aldric_theron.jpeg',
    age: 63,
    ideology: 'progressive',
    loyalty: 72,
    competence: 93,
    corruption_risk: 3,
    faction_ties: ['academic_bloc', 'constitutional_reformers'],
    traits: ['intellectual', 'principled', 'academic'],
    background: 'The foremost constitutional scholar in Veltria. Has spent forty years arguing for judicial independence in papers no one in government read. Now he is in government.',
    vyktor_assessment: 'Brilliant. Occasionally inconvenient. Necessary.',
    weakness: 'Prioritizes legal correctness over political reality.'
  },
  {
    id: 'roman_kesic',
    name: 'Roman Kešić',
    title: 'Chief Prosecutor, Ashenmere District',
    ministry: 'justice',
    portrait: 'src/assets/potraits/roman_kesic.jpeg',
    age: 49,
    ideology: 'conservative',
    loyalty: 78,
    competence: 76,
    corruption_risk: 22,
    faction_ties: ['judiciary_bloc', 'halvekist_adjacent'],
    traits: ['methodical', 'cautious', 'loyal'],
    background: 'Twenty years prosecuting cases in Ashenmere. Built a reputation for thoroughness rather than brilliance. Knows the legal system as it actually operates, not as it should.',
    vyktor_assessment: 'Reliable. Will not surprise you. Will not inspire anyone either.',
    weakness: 'Too comfortable with the existing system to reform it.'
  },

  // ═══ LABOR ═══
  {
    id: 'gregor_maric',
    name: 'Gregor Marić',
    title: 'Chairman, United Miners Federation',
    ministry: 'labor',
    portrait: 'src/assets/potraits/gregor_maric.jpeg',
    age: 48,
    ideology: 'progressive',
    loyalty: 73,
    competence: 72,
    corruption_risk: 10,
    faction_ties: ['workers_coalition', 'mining_unions'],
    traits: ['principled', 'compassionate', 'direct'],
    background: 'Son of a Kravenstal miner. Organized his first strike at twenty-two. Has spent his career fighting for workers from the outside. Now he must do it from the inside.',
    vyktor_assessment: 'He means everything he says. That is both his strength and his problem.',
    weakness: 'Sees every issue through the lens of class conflict.'
  },
  {
    id: 'petra_solec',
    name: 'Petra Solec',
    title: 'Director, National Employment Bureau',
    ministry: 'labor',
    portrait: 'src/assets/potraits/petra_solec.jpeg',
    age: 43,
    ideology: 'pragmatist',
    loyalty: 68,
    competence: 80,
    corruption_risk: 15,
    faction_ties: ['technocrats', 'moderate_labor'],
    traits: ['evidence-based', 'methodical', 'collaborative'],
    background: 'Built the National Employment tracking system from scratch. More interested in outcomes than ideology. The unions do not love her. Neither does the business bloc. That may be a recommendation.',
    vyktor_assessment: 'She looks at data before she forms an opinion. Rare.',
    weakness: 'Technocratic approach alienates both labor and management.'
  },

  // ═══ FOREIGN AFFAIRS ═══
  {
    id: 'vera_sorin',
    name: 'Vera Sorin',
    title: 'Ambassador to the Tyvaren Confederation',
    ministry: 'foreign_affairs',
    portrait: 'src/assets/potraits/vera_sorin.jpeg',
    age: 50,
    ideology: 'pragmatist',
    loyalty: 66,
    competence: 87,
    corruption_risk: 12,
    faction_ties: ['diplomatic_corps', 'reformists'],
    traits: ['calculating', 'principled', 'collaborative'],
    background: 'Negotiated the 1961 border incident without firing a shot or making a concession that mattered. Tyvaren respects her. That alone is worth something.',
    vyktor_assessment: 'The best diplomat we have. Tyvaren will be unhappy when she leaves their capital.',
    weakness: 'Has spent so long abroad she underestimates domestic politics.'
  },
  {
    id: 'henryk_borac',
    name: 'Henryk Borač',
    title: 'Deputy Foreign Minister',
    ministry: 'foreign_affairs',
    portrait: 'src/assets/potraits/henryk_borac.jpeg',
    age: 55,
    ideology: 'nationalist',
    loyalty: 74,
    competence: 71,
    corruption_risk: 28,
    faction_ties: ['nationalist_bloc', 'military_adjacent'],
    traits: ['ambitious', 'loyal', 'calculating'],
    background: 'Career ministry official who rose through nationalist-aligned governments. Believes Veltria should project strength, not seek accommodation. His Lytheira strategy concerns our intelligence services.',
    vyktor_assessment: 'He has an agenda that is not fully visible. I am still mapping it.',
    weakness: 'Nationalist ideology over diplomatic realism.'
  },

  // ═══ EDUCATION ═══
  {
    id: 'marta_solen',
    name: 'Dr. Marta Solén',
    title: 'Professor of Civic Philosophy, University of Ashenmere',
    ministry: 'education',
    portrait: 'src/assets/potraits/marta_solen.jpeg',
    age: 47,
    ideology: 'progressive',
    loyalty: 63,
    competence: 85,
    corruption_risk: 4,
    faction_ties: ['academic_bloc', 'reformists'],
    traits: ['intellectual', 'principled', 'academic'],
    background: 'Published three books on public education reform that were banned under the Halvek government. Believes the republic is built in classrooms, not parliaments. Will conflict with the Church within the first month.',
    vyktor_assessment: 'Brilliant. The Archbishop will hate her. You need to decide if that is acceptable.',
    weakness: 'Academic idealism without administrative experience.'
  },
  {
    id: 'petr_horak',
    name: 'Petr Horák',
    title: 'Deputy Minister of Education',
    ministry: 'education',
    portrait: 'src/assets/potraits/petr_horak.jpeg',
    age: 54,
    ideology: 'conservative',
    loyalty: 78,
    competence: 66,
    corruption_risk: 18,
    faction_ties: ['church_aligned', 'halvekist_adjacent'],
    traits: ['cautious', 'loyal', 'bureaucratic'],
    background: 'Twenty years inside the Education Ministry. Knows every budget line, every regional board, every union agreement. Will not reform anything. Will also not break anything.',
    vyktor_assessment: 'He files good reports. That is the most I can say.',
    weakness: 'Resistant to any change that disrupts established relationships.'
  },

  // ═══ HEALTH ═══
  {
    id: 'lena_kaspar',
    name: 'Dr. Lena Kaspar',
    title: 'Director, Ashenmere General Hospital Network',
    ministry: 'health',
    portrait: 'src/assets/potraits/lena_kaspar.jpeg',
    age: 44,
    ideology: 'reformist',
    loyalty: 65,
    competence: 89,
    corruption_risk: 6,
    faction_ties: ['medical_professionals', 'reformists'],
    traits: ['compassionate', 'decisive', 'evidence-based'],
    background: 'Rebuilt the hospital network after the 1958 epidemic. Her post-crisis report documented every government failure by name. That report ended three careers. She published it anyway.',
    vyktor_assessment: 'She will tell you exactly what is wrong and exactly what it will cost to fix it. Both answers will be uncomfortable.',
    weakness: 'No tolerance for bureaucratic delay — will create enemies quickly.'
  },
  {
    id: 'august_meln',
    name: 'Dr. August Meln',
    title: 'State Health Administrator',
    ministry: 'health',
    portrait: 'src/assets/potraits/august_meln.jpeg',
    age: 56,
    ideology: 'conservative',
    loyalty: 80,
    competence: 70,
    corruption_risk: 22,
    faction_ties: ['pharmaceutical_network', 'halvekist_adjacent'],
    traits: ['cautious', 'connected', 'methodical'],
    background: 'A decade running the State Health bureaucracy without scandal. Careful, methodical, and connected to the pharmaceutical supply networks in ways that have never been investigated.',
    vyktor_assessment: 'He will not cause problems. He will also not solve them.',
    weakness: 'Pharmaceutical ties create conflicts of interest in procurement.'
  },

  // ═══ DEVELOPMENT ═══
  {
    id: 'benedikt_varro',
    name: 'Benedikt Varro',
    title: 'Chief Engineer, Kravenstal Infrastructure Project',
    ministry: 'development',
    portrait: 'src/assets/potraits/benedikt_varro.jpeg',
    age: 53,
    ideology: 'pragmatist',
    loyalty: 72,
    competence: 79,
    corruption_risk: 16,
    faction_ties: ['industrial_bloc', 'kravenstal_interests'],
    traits: ['practical', 'direct', 'results-driven'],
    background: 'Built three of Veltria\'s major bridges and the Kravenstal rail expansion. Measures success in kilometers, not policy papers. The workers respect him because he has stood where they stand.',
    vyktor_assessment: 'He gets things built. Watch the procurement on large contracts.',
    weakness: 'Industrial bloc ties may influence infrastructure priorities.'
  },
  {
    id: 'sofia_drenek',
    name: 'Sofia Drenek',
    title: 'Director, Ashenmere Urban Planning Authority',
    ministry: 'development',
    portrait: 'src/assets/potraits/sofia_drenek.jpeg',
    age: 38,
    ideology: 'progressive',
    loyalty: 60,
    competence: 83,
    corruption_risk: 8,
    faction_ties: ['reformists', 'urban_professionals'],
    traits: ['visionary', 'collaborative', 'ambitious'],
    background: 'Led the Ashenmere urban renewal project that housed forty thousand families. Young for the role, which means she has enemies who think she should wait her turn.',
    vyktor_assessment: 'Talented and impatient. The impatience may be useful if directed correctly.',
    weakness: 'Youth and ambition create friction with established ministry officials.'
  },

  // ═══ RESOURCES ═══
  {
    id: 'orin_valdek',
    name: 'Orin Valdek',
    title: 'Former Director, State Mining Commission',
    ministry: 'resources',
    portrait: 'src/assets/potraits/orin_valdek.jpeg',
    age: 49,
    ideology: 'nationalist',
    loyalty: 58,
    competence: 81,
    corruption_risk: 38,
    faction_ties: ['mining_bloc', 'kravenstal_interests'],
    traits: ['calculating', 'resourceful', 'ambitious'],
    background: 'Knows where every mineral deposit in Veltria sits and what it is worth. Regulated the mining companies for six years. The relationship was too close to be comfortable and too productive to ignore.',
    vyktor_assessment: 'He knows things we need to know. What he wants in return is not fully clear.',
    weakness: 'Mining bloc ties represent a serious conflict of interest.'
  },
  {
    id: 'daria_voss',
    name: 'Daria Voss',
    title: 'Director, Environmental Resources Commission',
    ministry: 'resources',
    portrait: 'src/assets/potraits/daria_voss.jpeg',
    age: 41,
    ideology: 'progressive',
    loyalty: 61,
    competence: 76,
    corruption_risk: 7,
    faction_ties: ['reformists', 'environmental_bloc'],
    traits: ['principled', 'scientific', 'idealistic'],
    background: 'Environmental scientist turned policy maker. Has fought the mining lobby in three separate legal challenges and won two of them. They will make her job very difficult if appointed.',
    vyktor_assessment: 'Principled to a fault. The mining companies will declare war on her within a week.',
    weakness: 'Idealism creates enemies faster than she can build alliances.'
  }
]

export const getCandidatesForMinistry = (
  ministry: MinistryType
): MinisterCandidate[] => {
  return MINISTER_CANDIDATES.filter(
    m => m.ministry === ministry
  )
}

export const getCandidateById = (
  id: string
): MinisterCandidate | undefined => {
  return MINISTER_CANDIDATES.find(m => m.id === id)
}
