import type { StateModifier } from '../types/gameState'
import type { FactionState } from '../types/gameState'

export type RadioTheme = 'unity_calm' | 'reform_progress' | 'strength_security' | 'accountability_truth' | 'personal_appeal'

export interface RadioReaction {
  character: string
  characterId: string
  text: string
}

export interface RadioResult {
  theme: RadioTheme
  label: string
  multiplier: number
  modifiers: StateModifier[]
  reactions: RadioReaction[]
  speechIntro: string
  speechBody: string
  speechClosing: string
}

const THEMES: Record<RadioTheme, {
  label: string
  modifiers: StateModifier[]
  intro: string
  body: string
  closing: string
}> = {
  unity_calm: {
    label: 'Unity & Calm',
    modifiers: [
      { stat: 'nation.publicOrder', operation: 'add', value: 10 },
      { stat: 'personal.publicImage', operation: 'add', value: 5 },
    ],
    intro: 'My fellow Veltrians. I speak to you tonight not as your Chancellor, but as one citizen to another — in a moment that calls for calm.',
    body: 'There are those who would use this moment to divide us. To sow fear. To turn neighbor against neighbor and citizen against citizen. I am speaking to you tonight because I believe — with every conviction I possess — that the people of Veltria are stronger than their fears. We have survived dictatorship. We are building democracy. We will not let this crisis undo what we have built together. I ask for your patience. I ask for your trust. And I promise you — as I have promised from the day I took this office — that I will not rest until every Veltrian can sleep safely in their own home.',
    closing: 'Good night. Stay together. Stay calm. And remember — we are one nation, one people, and one future. This is Katerin Ashavel, speaking from Ashenmere.',
  },
  reform_progress: {
    label: 'Reform & Progress',
    modifiers: [
      { stat: 'factions.reformists', operation: 'add', value: 10 },
      { stat: 'personal.publicImage', operation: 'add', value: 5 },
    ],
    intro: 'My fellow Veltrians. Change is difficult. It is meant to be. If reform were easy, the Halvek regime would have reformed itself decades ago. But reform is necessary — and tonight I want to tell you why.',
    body: 'Every law we have passed, every institution we have rebuilt, every right we have restored — these are not abstract achievements. They are the difference between a worker who can organize for better wages and one who is afraid to speak. Between a journalist who can publish the truth and one who is silenced. Between a Dravenni child who can learn her mother tongue and one who is told her language is a crime. Reform is slow. Reform is hard. Reform is worth it. I am asking you to stand with me — not for me, but for the Veltria we are building together.',
    closing: 'The future is not given. It is built — by every citizen, every vote, every voice raised in the belief that tomorrow can be better than today. This is Katerin Ashavel. Good night.',
  },
  strength_security: {
    label: 'Strength & Security',
    modifiers: [
      { stat: 'factions.ironCovenant', operation: 'add', value: 10 },
      { stat: 'nation.militaryReadiness', operation: 'add', value: 10 },
    ],
    intro: 'My fellow Veltrians. There are moments when a nation must speak with one voice — clear, unwavering, and strong. This is one of those moments.',
    body: 'I have spent the last weeks consulting with our military leadership, our intelligence services, and our diplomatic corps. The situation on our eastern border is serious. I will not minimize it. But I will also tell you this: the Republic of Veltria is not defenseless. Our armed forces are prepared. Our borders are secured. Our alliances are activated. We did not seek this confrontation — but we will not shrink from it. To the men and women of the Veltrian Armed Forces: your nation stands behind you. To the people of Veltria: your Chancellor will not compromise the security of this Republic. Not now. Not ever.',
    closing: 'Stand strong. Stand together. This is Katerin Ashavel, Chancellor of the Republic. Good night.',
  },
  accountability_truth: {
    label: 'Accountability & Truth',
    modifiers: [
      { stat: 'nation.pressFreedom', operation: 'add', value: 10 },
      { stat: 'factions.reformists', operation: 'add', value: 10 },
    ],
    intro: 'My fellow Veltrians. I am speaking to you tonight because there are things that must be said — things that cannot wait for the next press conference or the next Assembly session. The truth does not wait.',
    body: 'This government was founded on a promise: that the era of secrets and lies, of hidden crimes and protected criminals, was over. I have not always kept that promise perfectly. No government can. But tonight I am recommitting to it — publicly, to you, with no filter and no intermediary. We will investigate what must be investigated. We will prosecute what must be prosecuted. And we will do it in the open, under the law, accountable to you. Not because it is easy. Because it is right.',
    closing: 'The truth is not always comfortable. But it is always necessary. This is Katerin Ashavel. Good night.',
  },
  personal_appeal: {
    label: 'Personal Appeal',
    modifiers: [
      { stat: 'personal.publicImage', operation: 'add', value: 10 },
      { stat: 'personal.marriageHealth', operation: 'add', value: 5 },
    ],
    intro: 'My fellow Veltrians. I am going to speak to you tonight not as your Chancellor — but as Katerin. A wife. A mother. A daughter who lost her father to the very system I am trying to reform.',
    body: 'My husband Jonas is an architect. He designs public housing — the kind of buildings most people in this city never think about but thousands of families call home. My daughter Liora is studying political history at university — the same history that killed her grandfather. My son Tomas is fourteen and trying to figure out who he is in a world where his mother is one of the most visible women in the country. I tell you this not to ask for sympathy. I tell you this because you deserve to know who governs you — not just what policies she supports, but what keeps her awake at night and what makes her get up in the morning. I am not perfect. I have made mistakes. I will make more. But I am here — fully, honestly, without pretense — and I am asking you to keep believing in the Veltria we can build together.',
    closing: 'From my family to yours — thank you for listening. Good night.',
  },
}

export function calculateRadioMultiplier(broadcastsUsed: number): number {
  return Math.max(0.1, 1 - (broadcastsUsed * 0.3))
}

export function getRadioResult(
  theme: RadioTheme,
  broadcastsUsed: number,
  factions: FactionState,
): RadioResult {
  const themeData = THEMES[theme]
  const multiplier = calculateRadioMultiplier(broadcastsUsed)

  const modifiers = themeData.modifiers.map(m => ({
    ...m,
    value: Math.round(m.value * multiplier),
  }))

  const reactions: RadioReaction[] = []

  if (theme === 'unity_calm') {
    reactions.push({
      character: 'Vyktor Reznik', characterId: 'vyktor_reznik',
      text: 'The tone was right. People are frightened. They needed to hear that their government is steady.',
    })
    reactions.push({
      character: 'Drazen Kolvar', characterId: 'drazen_kolvar',
      text: factions.halvekists > 30
        ? 'A competent address. Unsurprising. The people will calm down for a week. Then the crisis will resume.'
        : 'Too little, too late. The Chancellor speaks of calm while her policies create chaos.',
    })
  }

  if (theme === 'reform_progress') {
    reactions.push({
      character: 'Prof. Aldric Theron', characterId: 'aldric_theron',
      text: 'That was the speech I have been waiting thirty years to hear from a Veltrian Chancellor. The reformist caucus is energized.',
    })
    reactions.push({
      character: 'Gregor Marić', characterId: 'gregor_maric',
      text: factions.workersCoalition > 40
        ? 'Good words. Good intentions. Words and intentions do not pay rent. But they help.'
        : 'Reform and progress? The workers are still waiting for the progress. I hope the Chancellor remembers that.',
    })
  }

  if (theme === 'strength_security') {
    reactions.push({
      character: 'Col. Irina Dusek', characterId: 'irina_dusek',
      text: 'The military needed to hear that. Not just the threat assessment — the commitment behind it. The officer corps is reassured.',
    })
    reactions.push({
      character: 'Oskar Brenner', characterId: 'oskar_brenner',
      text: factions.ironCovenant > 40
        ? 'Strong words. Let us hope they are backed by strong actions. The Tyvarens are listening.'
        : 'The Chancellor finally speaks of strength. A welcome change — if it is sustained.',
    })
  }

  if (theme === 'accountability_truth') {
    reactions.push({
      character: 'Nadia Voss', characterId: 'nadia_voss',
      text: 'I will be fact-checking every claim she made in that address. But the sentiment — I will give her this — was more direct than anything we have heard from that office in the Halvek era or since.',
    })
    reactions.push({
      character: 'Maren Tovik', characterId: 'maren_tovik',
      text: 'The BCA takes the Chancellor at her word. We will continue investigating — including where that investigation leads.',
    })
  }

  if (theme === 'personal_appeal') {
    reactions.push({
      character: 'Serida Valk', characterId: 'serida_valk',
      text: 'I have worked for the Chancellor for months. I have never heard her speak like that. That was not a politician. That was a person.',
    })
    reactions.push({
      character: 'Jonas Ashavel', characterId: 'jonas_ashavel',
      text: factions.reformists > 40
        ? 'She mentioned our children on national radio. I did not expect that. I think — I think it mattered.'
        : 'She mentioned our family. Publicly. I do not know whether it was sincerity or strategy. I hope it was sincerity.',
    })
    if (factions.church > 30) {
      reactions.push({
        character: 'Archbishop Renek', characterId: 'stanislov_renek',
        text: 'The Chancellor spoke of family. That is a value the Church understands. A step in the right direction — if it is genuine.',
      })
    }
  }

  return {
    theme,
    label: themeData.label,
    multiplier,
    modifiers,
    reactions,
    speechIntro: themeData.intro,
    speechBody: themeData.body,
    speechClosing: themeData.closing,
  }
}

export const MAX_BROADCASTS = 4
