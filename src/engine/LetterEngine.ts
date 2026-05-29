import type { LetterTone, SentLetter } from '../types/gameState'

export interface LetterOption {
  id: string
  recipient: string
  recipientTitle: string
  weekAvailable: number
  weekDeadline?: number
  condition?: string
  conditionLabel: string
  responseSceneId: string
  title: string
  prompt: string
}

export const LETTER_OPTIONS: LetterOption[] = [
  {
    id: 'letter_jonas',
    recipient: 'Jonas Ashavel',
    recipientTitle: 'Your Husband',
    weekAvailable: 8,
    weekDeadline: 40,
    conditionLabel: 'marriageHealth < 55',
    responseSceneId: 'letter_response_jonas',
    title: 'Write to Jonas',
    prompt: 'You have been away too long. Jonas has not said anything — but you can feel the distance. A letter, in your own hand, might reach him in a way that brief phone calls between briefings never can.',
  },
  {
    id: 'letter_liora',
    recipient: 'Liora Ashavel',
    recipientTitle: 'Your Daughter',
    weekAvailable: 18,
    weekDeadline: 48,
    conditionLabel: 'lioraRelationship < 60',
    responseSceneId: 'letter_response_liora',
    title: 'Write to Liora',
    prompt: 'Liora is at university, studying political history — the same subject that consumed you at her age. But she is distant. The Chancellor\'s daughter. Not just your daughter. A letter might remind her who you were before the office.',
  },
  {
    id: 'letter_kolvar',
    recipient: 'Drazen Kolvar',
    recipientTitle: 'Leader of the Halvekist Opposition',
    weekAvailable: 10,
    weekDeadline: 24,
    conditionLabel: 'halvekists < 30',
    responseSceneId: 'letter_response_kolvar',
    title: 'Write to Kolvar',
    prompt: 'Kolvar is preparing a no-confidence motion. You have heard the whip count from Vyktor. But Kolvar is not an ideologue — he is a survivor. A private letter offering a path to compromise might reach him in a way that public negotiations cannot.',
  },
  {
    id: 'letter_soraya',
    recipient: 'Soraya Khaled',
    recipientTitle: 'Workers\' Coalition Leader',
    weekAvailable: 20,
    weekDeadline: 40,
    conditionLabel: 'workersCoalition < 35',
    responseSceneId: 'letter_response_soraya',
    title: 'Write to Soraya',
    prompt: 'You made promises to the workers during the campaign. Some of them — not all, but enough — you have been unable to keep. Soraya has been patient. Her patience is running out. A personal letter might buy more time.',
  },
  {
    id: 'letter_vukov',
    recipient: 'Marshal Demyan Vukov',
    recipientTitle: 'Leader of the Tyvaren State',
    weekAvailable: 25,
    weekDeadline: 36,
    conditionLabel: 'tyvaren tensions rising',
    responseSceneId: 'letter_response_vukov',
    title: 'Write to Marshal Vukov',
    prompt: 'War is not inevitable. Vukov is a soldier, not a fanatic. A direct letter — one leader to another — proposing back-channel talks before the armies move. It may be ignored. But it cannot start a war that is already being planned.',
  },
  {
    id: 'letter_soren',
    recipient: 'Gavril Soren',
    recipientTitle: 'Former Halvek Chief of Staff',
    weekAvailable: 34,
    weekDeadline: 42,
    conditionLabel: 'sorenFilesRevealed = true',
    responseSceneId: 'letter_response_soren',
    title: 'Write to Soren',
    prompt: 'The files are public. Your father\'s execution order bears his signature. But Soren is still free — protected by the very immunity you are trying to revoke. A letter demanding his confession might reach the man beneath the uniform in a way that warrants and trials cannot.',
  },
  {
    id: 'letter_nadia',
    recipient: 'Nadia Voss',
    recipientTitle: 'Investigative Journalist',
    weekAvailable: 28,
    weekDeadline: 44,
    conditionLabel: 'nadia investigating you',
    responseSceneId: 'letter_response_nadia',
    title: 'Write to Nadia Voss',
    prompt: 'Nadia is closing in. You know what she will find. A letter offering her an exclusive — on your terms, on your timeline — might redirect her investigation away from the most damaging revelations. Or it might make things worse.',
  },
  {
    id: 'letter_arcturian',
    recipient: 'Prime Minister Alden Cray',
    recipientTitle: 'Prime Minister of the Arcturian Commonwealth',
    weekAvailable: 30,
    weekDeadline: 48,
    conditionLabel: 'economyHealth < -15',
    responseSceneId: 'letter_response_arcturian',
    title: 'Write to the Arcturian PM',
    prompt: 'The economy is collapsing. The Krone is falling. Formal diplomatic requests have been ignored or delayed. A personal letter to Cray — not from the Chancellor of Veltria, but from one leader facing a crisis to another — might cut through the bureaucracy.',
  },
  {
    id: 'letter_nation',
    recipient: 'The People of Veltria',
    recipientTitle: 'The Nation',
    weekAvailable: 20,
    weekDeadline: 50,
    conditionLabel: 'anytime',
    responseSceneId: 'letter_response_nation',
    title: 'Write an Open Letter to the Nation',
    prompt: 'An open letter published in every newspaper. Not a speech — something people can read and re-read. Your words, your signature. It will be analyzed for weeks. It will define the public perception of this moment. Choose your words carefully.',
  },
  {
    id: 'letter_father',
    recipient: 'Mikhael Ashavel',
    recipientTitle: 'Your Father (Deceased 1947)',
    weekAvailable: 30,
    weekDeadline: 52,
    conditionLabel: 'anytime',
    responseSceneId: 'letter_response_father',
    title: 'Write to Your Father',
    prompt: 'He will never read this. You know that. But there are things you need to say — things you have been carrying since you were twelve years old, since the night they took him. This letter is not for him. It is for you.',
  },
]

export function generateLetterContent(
  recipient: string,
  tone: LetterTone,
  currentWeek: number,
): { title: string; body: string } {
  const toneSalutations: Record<LetterTone, string> = {
    formal: 'I write to you as Chancellor of the Republic of Veltria, with the gravity that office demands.',
    personal: 'I am writing this by hand because some things cannot be typed.',
    threatening: 'Let me be direct. What follows is not a request.',
    conciliatory: 'I have been thinking about what was said — and what was not said.',
  }

  const toneClosings: Record<LetterTone, string> = {
    formal: 'With respect and the authority of my office,\nKaterin Ashavel\nChancellor of the Republic of Veltria',
    personal: 'With love and hope,\nKaterin',
    threatening: 'I trust my position is clear.\nKaterin Ashavel',
    conciliatory: 'In the hope of understanding,\nKaterin',
  }

  const recipientBodies: Record<string, Record<LetterTone, string>> = {
    'Jonas Ashavel': {
      formal: 'I recognize that my duties have kept me from the home we built together. This is not an apology — it is an acknowledgement. You did not marry a Chancellor. You married an architect who happened to believe in reform. I am still that person. I need you to remember that.',
      personal: 'Do you remember the day we met? The university lecture hall, the argument about public housing, the coffee afterward that lasted four hours. I have been thinking about that day. About who I was then. About who you were. About whether those two people would recognize us now.',
      threatening: '',
      conciliatory: 'I know I have been distant. I know the list is longer than seventeen now. But I am writing because I do not want it to be eighteen. I want to find a way back.',
    },
    'Liora Ashavel': {
      formal: '',
      personal: 'I saw your name in the university paper. You wrote about political accountability with more clarity than half the people who brief me. I am so proud of you I do not have words for it. I should have told you that in person. I am telling you now.',
      threatening: '',
      conciliatory: 'I know you are angry about the sealed papers. You have a right to be. But the truth is complicated — more complicated than even you understand. I want to explain. I want you to let me.',
    },
    'Drazen Kolvar': {
      formal: 'The no-confidence motion you are preparing is a mistake — not for me, but for Veltria. This government, whatever its flaws, is the only thing standing between reform and chaos. I am prepared to discuss terms.',
      personal: '',
      threatening: 'You have the votes — perhaps. But if you bring this motion, you will lose more than a vote. You will lose any claim to statesmanship. I will ensure that. This is not a threat. It is a prediction.',
      conciliatory: 'We are not friends. We will never be friends. But we are both Veltrians who want to see the Republic survive. There must be ground between us where that shared interest can take root.',
    },
    'Soraya Khaled': {
      formal: '',
      personal: 'I know I broke my promise. The worker safety provisions were cut from the budget. You have every right to be angry — at me, at the system, at the impossibility of governing without disappointing the people you care about most.',
      threatening: '',
      conciliatory: 'I cannot undo what was done. But I can promise — not as Chancellor, but as the person you campaigned beside — that the next budget will not forget the workers. I am asking for time. I am asking for trust I may not deserve.',
    },
    'Marshal Demyan Vukov': {
      formal: 'The armies on both sides of the Gravenmark Pass are waiting. Let them wait a little longer. I propose a meeting — informal, unrecorded, between the two of us. No staff. No press. Just two leaders who understand what war costs.',
      personal: '',
      threatening: 'If your divisions cross the Pass, they will not cross back. I am not threatening war. I am describing its outcome. You have read our readiness assessments — you know the cost would be catastrophic. Let us find another way before the cost is paid in blood.',
      conciliatory: 'I know the ultimatum was not your idea — it was your generals pushing for a conflict they believe they can win. I am writing to you directly because I believe you understand what they do not: that the first casualty of war is always the truth.',
    },
  }

  const body = recipientBodies[recipient]?.[tone]
    ?? `I am writing to you because there are things that cannot be said in meetings or through intermediaries. This letter is an attempt to reach across the distance that politics creates — to say what I actually believe, rather than what I am expected to say.\n\nI hope you will read this in the spirit it is intended. Whatever our differences, we share a country — and a hope that it might become something better than it has been.`

  return {
    title: `${toneSalutations[tone].split('.')[0]}.`,
    body: `${toneSalutations[tone]}\n\n${body}\n\n${toneClosings[tone]}`,
  }
}

export function getAvailableLetters(
  currentWeek: number,
  marriageHealth: number,
  lioraRelationship: number,
  halvekists: number,
  workersCoalition: number,
  economyHealth: number,
  sorenFilesRevealed: boolean,
  sentLetterIds: string[],
): LetterOption[] {
  return LETTER_OPTIONS.filter(opt => {
    if (sentLetterIds.includes(opt.id)) return false
    if (currentWeek < opt.weekAvailable) return false
    if (opt.weekDeadline && currentWeek > opt.weekDeadline) return false
    switch (opt.id) {
      case 'letter_jonas': return marriageHealth < 55
      case 'letter_liora': return lioraRelationship < 60
      case 'letter_kolvar': return halvekists < 30
      case 'letter_soraya': return workersCoalition < 35
      case 'letter_soren': return sorenFilesRevealed
      case 'letter_arcturian': return economyHealth < -15
      default: return true
    }
  })
}

let _letterSeq = 0

export function createSentLetter(
  option: LetterOption,
  tone: LetterTone,
  currentWeek: number,
): SentLetter {
  const { body } = generateLetterContent(option.recipient, tone, currentWeek)
  return {
    id: `letter_${++_letterSeq}_${Date.now()}`,
    recipient: option.recipient,
    tone,
    weekSent: currentWeek,
    title: option.title,
    content: body,
    responseSceneId: option.responseSceneId,
    responseArrived: false,
  }
}
