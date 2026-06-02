// Diary entry templates — one per week with variants based on player choices.
// Each entry is a function (week, flags, visitedScenes, state) → string.

export interface DiaryContext {
  week: number
  flags: string[]
  visitedScenes: string[]
  economyHealth: number
  corruption: number
  publicOrder: number
  marriageHealth: number
  lioraRelationship: number
  tomasWellbeing: number
  vaelInfluence: number
  personalWealth: number
  reformists: number
  halvekists: number
  workersCoalition: number
  ironCovenant: number
  businessClass: number
  church: number
  dravenni: number
}

type DiaryTemplate = (ctx: DiaryContext) => string

function dateStr(week: number): string {
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  return `${months[d.getMonth()]} ${d.getDate()}, 1963 — WEEK ${week}`
}

export function diaryDate(week: number): string { return dateStr(week) }

// ─── Week-by-week templates ──────────────────────────────────────────────────

export const DIARY_TEMPLATES: Record<number, DiaryTemplate> = {
  2: (ctx: DiaryContext) => {
    if (ctx.flags.includes('bni_dissolved')) {
      return "I signed the order this morning. Danika looked satisfied. Dusek did not. Vyktor said nothing, which means he is either in agreement or keeping something from me. Possibly both. The phones have been ringing since noon."
    }
    return "The files are still being read. I keep telling myself it is for the nation's security and not because some part of me wants to know who was watching us all those years. Father would not recognize what I have become. I am not yet certain if that is good or bad."
  },

  3: (ctx: DiaryContext) => {
    if (ctx.flags.includes('economic_direction_free_market')) {
      return "The markets have spoken — and they are cautious. Vostane assures me this is normal. 'Confidence takes time,' she said, as if time is something I have in abundance. Jonas reminded me to eat dinner tonight. He knew I had forgotten."
    }
    if (ctx.flags.includes('economic_direction_planned')) {
      return "We committed to the planned path today. Soraya embraced me afterwards — literally, in the hallway, where anyone could see. I think the workers needed this more than they could say. The industrialists will howl. Let them."
    }
    return "The economic question hangs over every meeting now. I cannot delay it much longer. Everyone wants an answer. I want one too — but the numbers change every time I look at them. Tomas asked why I look sad. I told him I was just thinking."
  },

  4: (ctx: DiaryContext) => {
    if (ctx.flags.includes('vael_approached')) {
      return "Vael came to the Palace today. No appointment. No warning. Just a smile and an offer that sounded like a threat wrapped in velvet. I smiled back. I am learning that the hardest part of this job is pretending you did not understand exactly what was meant."
    }
    return "The letters keep arriving. From Thornfeld, from the Church, from people I have never met who believe I care about their opinions. I do, actually. That is the problem. The more I read, the less I sleep."
  },

  5: (ctx: DiaryContext) => {
    if (ctx.marriageHealth < 55) {
      return "Jonas left for his office before I woke up. Or perhaps I was already in mine — the line between night and morning has become something I no longer recognize. I promised him I would be different once the transition was over. I do not know when 'the transition' ends."
    }
    return "Liora called tonight. She wanted to know if I had seen the papers. I had. She thinks I should smile more in photographs. 'You look like you are already losing,' she said. She is not wrong about very many things."
  },

  6: (ctx: DiaryContext) => {
    if (ctx.corruption > 70) {
      return "The corruption reports sit on my desk like a challenge. Every department, every ministry — Halvek's fingerprints are on all of it. I could spend my entire term cleaning house and still not finish. Maybe that is exactly what he intended."
    }
    return "The Assembly is beginning to show its colors. The Halvekists are organizing. Kolvar smiles too much — I have learned that a smile in politics rarely means friendship. Tomas drew a picture of our family today. I was just a stick figure in the corner, labeled 'Chancellor.'"
  },

  7: (ctx: DiaryContext) => {
    if (ctx.flags.includes('tyvaren_scouted')) {
      return "The military briefings have taken on a new tone this week. The reports from Sevagrad mention 'movements' and 'preparations' — words that mean more in a general's mouth than they do on paper. Dusek wants more funding. Brenner just wants a reason."
    }
    return "The coalition is holding, but I can feel the cracks. Soraya wants faster reforms. The business class wants stability. I want both and am learning that wanting is not the same as having. The Dravenni question grows heavier each day."
  },

  8: (ctx: DiaryContext) => {
    if (ctx.dravenni < 35) {
      return "The Dravenni delegation left today without an agreement. Idris looked at me in a way I have not seen before — not angry, but disappointed. The worst part is that I understand his position. I simply cannot act on it yet. That distinction will not matter to the families in the hollows."
    }
    return "The Dravenni question grows more urgent every day. I have asked Theron to draft language for an autonomy proposal. He warned me it would cost political capital. I asked him what capital is for if not spending."
  },

  9: (ctx: DiaryContext) => {
    if (ctx.workersCoalition > 60) {
      return "The Workers' Coalition held a rally in Kravenstal today. Twelve thousand people. Soraya spoke for forty minutes and never once mentioned my name. I do not know if that is loyalty or a warning. She would probably say it is both."
    }
    return "The budget numbers are getting worse before they get better. Elara showed me the projections with a face like a funeral director. 'It is not terminal,' she said. I would have preferred a different choice of words."
  },

  10: (ctx: DiaryContext) => {
    if (ctx.publicOrder < 45) {
      return "There were protests outside the Assembly today. Peaceful, mostly. But the faces in the crowd — I recognized some of them. People who voted for me. People who believed. Belief is a fragile thing. I am learning that the hard way."
    }
    return "Ten weeks. It feels like ten years. Vyktor says I am doing well. Vyktor says many things. The truth is that I have won some battles and lost others, and the war has barely begun."
  },

  11: (ctx: DiaryContext) => {
    if (ctx.tomasWellbeing < 55) {
      return "Tomas asked me today if I still loved him. I held him for twenty minutes. I have missed three of his school events this month. The country's children matter to me. My own child matters more. I do not know how to reconcile those two facts."
    }
    return "Tomas brought home his grades today. Perfect marks. I was in a cabinet meeting and missed his call. He left a note on my desk that said 'It's okay.' It is not. But I do not know what to do about it yet."
  },

  12: (ctx: DiaryContext) => {
    if (ctx.halvekists > 60) {
      return "The Halvekist bloc is growing bolder. Kolvar gave an interview in the Herald calling my reforms 'a betrayal of Veltrian tradition.' The comments section was worse. I should not read the comments section. I read the comments section."
    }
    return "The opposition is finding its voice. I expected this. What I did not expect was how tired I would feel after every session. The speeches are endless. The points of order multiply like insects. Democracy is exhausting. That is probably the point."
  },

  13: (ctx: DiaryContext) => {
    if (ctx.economyHealth > -10) {
      return "Vostane's projections have turned. The employment numbers are not good, but they are not getting worse. In this country, at this moment, that counts as a victory. I will take it. The factories in Kravenstal are running at sixty percent capacity. They were at forty when I took office."
    }
    return "Thirteen weeks. One quarter of the year gone. I made a list of everything I promised during the campaign. It is longer than I remembered. Jonas found the list and put a glass of wine next to it. He did not say anything. He did not need to."
  },

  14: (ctx: DiaryContext) => {
    if (ctx.flags.includes('soren_files_revealed')) {
      return "The Soren files have changed everything. I read them until my eyes burned. Gavril Soren, Marshal of the Republic, my predecessor's right hand — and Mikhael's execution order bears his signature. There is no undoing this. There is no looking away."
    }
    return "The documents from the BNI archives are arriving in batches. Some of the names I recognize. Some of them I knew personally. I have stopped reading before bed."
  },

  15: (ctx: DiaryContext) => {
    if (ctx.ironCovenant < 40) {
      return "Brenner is avoiding my calls. Three messages, no response. The military is unhappy — I knew they would be — but this feels different. Dusek says there are whispers. She used the word 'unrest.' A general does not use that word casually."
    }
    return "The military budget remains the third rail of Veltrian politics. Touch it and you burn. But I cannot rebuild the nation's infrastructure and fund a standing army designed for wars we are not fighting. Someone will have to bend. It will probably not be me."
  },

  16: (ctx: DiaryContext) => {
    if (ctx.vaelInfluence > 30) {
      return "Another dinner with Vael. Another set of 'suggestions' delivered between courses. He knows things about my cabinet members that even I do not know. How? The question keeps me awake. The answers I imagine are worse than the question."
    }
    return "Liora says I am becoming harder. She meant it as a compliment. I am not sure it is. There was a time when I believed politics could be done with open hands. I still believe that. I just keep them closed more often now."
  },

  17: (ctx: DiaryContext) => {
    if (ctx.church < 40) {
      return "The Archbishop's letter arrived today. Seven pages of theological argument wrapped around a political threat. The Church is not accustomed to being challenged. They are discovering that I am not accustomed to being threatened. This will not end quietly."
    }
    return "The Church is testing me. I expected the old guard and the military. I did not expect His Holiness to become an opposition strategist. But here we are. Faith and politics have always been married in Veltria. I am discovering that divorce is expensive."
  },

  18: (ctx: DiaryContext) => {
    if (ctx.businessClass > 60) {
      return "The Business Council invited me to address their quarterly meeting. I expected hostility. I received polite interest. They are pragmatists — they care about profit, not ideology. That makes them easier to work with and harder to trust. Both things can be true."
    }
    return "The trade delegation from Lytheira was productive, mostly. They asked as many questions about our political stability as our tariff schedules. Every foreign investor wants to know the same thing: will this government last? I wish I could give them a better answer than 'watch and see.'"
  },

  19: (ctx: DiaryContext) => {
    if (ctx.personalWealth < 10000) {
      return "I had to borrow money from Jonas this week. The Chancellor of the Republic, borrowing from her husband. The salary is adequate for a bureaucrat. It is not adequate for the social obligations of this office. I have started declining dinner invitations. People are beginning to notice."
    }
    return "The financial strain of this office is not something the briefing books prepare you for. State dinners, receptions, the endless coffees and lunches where real decisions are made — all of it costs money. Money I am increasingly aware I do not have."
  },

  20: (ctx: DiaryContext) => {
    if (ctx.flags.includes('mole_clue_found')) {
      return "Someone in my government is feeding information to someone else. I do not know who yet, but I know it is happening. The pattern is there, faint but unmistakable. I have started watching faces differently. Listening to pauses. Counting the seconds between a question and an answer."
    }
    return "The Orythian loan offer is on my desk. Sixteen pages of fine print designed to look generous. Stahl is clever — everything about this arrangement benefits the Dominion first and Veltria second. But we need the money. That is the trap. He knows it. I know it. The question is whether I will walk into it anyway."
  },

  21: (ctx: DiaryContext) => {
    if (ctx.marriageHealth < 50) {
      return "Jonas and I had our first real fight tonight. Not about politics — about us. About the fact that I am never home. About the fact that when I am, I am still somewhere else. He was right about everything. That made it worse."
    }
    return "The mid-point of my term is approaching. Twenty-one weeks. I have done some of what I promised. Not all. Not even most. But some. The question I ask myself at night is whether 'some' will be enough."
  },

  22: (ctx: DiaryContext) => {
    if (ctx.corruption < 50) {
      return "The anti-corruption measures are working. Slowly, painfully, with more resistance than I expected — but they are working. Three mid-level officials resigned this week rather than face investigation. I should feel satisfied. I feel only the weight of what remains."
    }
    return "The corruption investigations continue. Every week, a new set of names. Every week, a new set of denials. I have started to recognize the pattern: first the outrage, then the legal threats, then the silence. The silence is the only part I trust."
  },

  23: (ctx: DiaryContext) => {
    if (ctx.lioraRelationship < 55) {
      return "Liora wrote me a letter. Not a phone call — a letter. That is always a bad sign. She said I have changed. She said I do not laugh anymore. She said she misses her mother. I read it five times and still do not know how to respond."
    }
    return "The refugee situation in Sevagrad is deteriorating. More arrivals every day. The Morivask crisis shows no sign of resolution. I authorized additional funding, but I know it will not be enough. Nothing is ever enough."
  },

  24: (ctx: DiaryContext) => {
    if (ctx.flags.includes('arkasian_diplomacy')) {
      return "The Asturien Forum made their assessment public today. Eight pages of diplomatic language that essentially says 'not bad, but not good enough.' The international community is watching. They are measuring. I am being weighed on a scale I did not build."
    }
    return "Halfway. Twenty-four weeks. If my term were a book, I would be at the middle chapter — the one where everything seems darkest before the resolution. I hope that is what this is. I am old enough to know that sometimes there is no resolution."
  },

  25: (ctx: DiaryContext) => {
    if (ctx.reformists > 70) {
      return "The Reformist base is energized. The rallies are larger, the donations are flowing, and the volunteers are showing up. I should be celebrating. Instead, I am worried. Momentum is not the same as durability. I have seen movements peak too early."
    }
    return "The reform agenda is making progress, but the pace frustrates everyone — including me. The Assembly procedures were designed to be slow. Soren built them that way deliberately. Every delay is a ghost of the old regime, still haunting the chamber."
  },

  26: (_ctx: DiaryContext) => {
    return "Two seasons. I have been Chancellor through one winter and into a spring. The palace gardens are blooming. I noticed them today for the first time. There is something about flowers that makes you realize how much you have been looking at the ground."
  },

  27: (ctx: DiaryContext) => {
    if (ctx.flags.includes('soe_declared')) {
      return "The state of emergency is in effect. I never thought I would sign that order. The words felt foreign in my mouth. Dusek says it is necessary. Theron says it is dangerous. They are both right. That is the worst part."
    }
    return "The Tyvaren situation is escalating. Vukov's latest communication was no longer diplomatic. The border regiments are on alert. I asked Brenner how long we could hold if it came to conflict. His answer was shorter than I wanted."
  },

  28: (ctx: DiaryContext) => {
    if (ctx.flags.includes('serida_trusted')) {
      return "Serida came to see me privately today. No agenda, no briefing. Just two women who have seen the inside of power and understood what it costs. She is the only person in this city who does not want anything from me. I did not realize how rare that was until I experienced it."
    }
    return "The security situation continues to deteriorate. I canceled a public appearance today — the first time I have done that. Vyktor said it was the right call. I am not sure if I believe him or if I just wanted someone to tell me it was acceptable to be afraid."
  },

  29: (ctx: DiaryContext) => {
    if (ctx.flags.includes('mole_detected_suspect')) {
      return "I think I know who it is. I do not have proof yet, but the pattern is unmistakable. Every time I think I have figured out this government's true loyalties, I discover another layer. We are supposed to be on the same side. The tragedy is that I do not know who 'we' includes anymore."
    }
    return "The Dravenni autonomy legislation is nearly ready. Theron has been working on it for weeks. He presented the final draft with the expression of a man who has built a house of cards and is waiting for the wind. The wind will come. It always does."
  },

  30: (ctx: DiaryContext) => {
    if (ctx.publicOrder < 35) {
      return "The streets are not safe. I know that sounds like something an old woman would say, but it is true. The Halvekist militias are forming in Thornfeld. The Workers' Coalition is counter-organizing. Veltria is becoming two Veltrias, and neither one listens to the other."
    }
    return "Tomas came home with a bruise today. Another child at school — the son of a Halvekist regional official — called me a traitor. Tomas fought him. He won. I should have been angry about the fighting. I was proud instead. I am not sure what that says about me."
  },

  31: (_ctx: DiaryContext) => {
    return "The dreams have returned. I had them during the campaign — the ones where I stand at the podium and open my mouth but no sound comes out. They stopped after the inauguration. Now they are back. My subconscious is trying to tell me something. I am too tired to listen."
  },

  32: (ctx: DiaryContext) => {
    if (ctx.flags.includes('tyvaren_ultimatum')) {
      return "The Tyvaren ultimatum arrived today. Vukov wants an answer within seventy-two hours. I have seventy-two hours to decide whether to commit the nation to a war we cannot win or a peace that will feel like surrender. I do not know which is worse. I do not know if there is a third option. I am afraid there is not."
    }
    return "The Veltrian Times published a poll this morning. Forty-four percent approval. The lowest since I took office. Vyktor says not to worry about numbers. He always says that. I have started to notice that he worries about everything else."
  },

  33: (ctx: DiaryContext) => {
    if (ctx.flags.includes('no_confidence')) {
      return "The no-confidence vote is scheduled. Kolvar is smiling too much for comfort. The whip counts are not in my favor. I spent the afternoon calling members personally — something I should have been doing all along, not just when I needed their votes. Pride does that. Pride and exhaustion."
    }
    return "The tension in the Assembly is palpable. Every session feels like a battlefield now. The Halvekists have stopped pretending to be loyal opposition. I respect that more than the alternative. At least I know where they stand."
  },

  34: (ctx: DiaryContext) => {
    if (ctx.economyHealth < -30) {
      return "The economy is not recovering. I can say that here, in these pages, even if I cannot say it at the podium. The policies are correct — I believe that — but they are not working fast enough. People are losing patience. I am losing patience with myself."
    }
    return "Jonas made dinner tonight. A simple meal. We did not talk about politics. We talked about the weather, about Tomas's school, about where we might travel when the term is over. It was the first normal evening I have had in months. I cried afterwards. I did not know why."
  },

  35: (ctx: DiaryContext) => {
    if (ctx.flags.includes('soren_prosecuted')) {
      return "Soren's trial began today. I watched from the gallery — not as Chancellor, but as the woman whose family was destroyed by men like him. The prosecutor read the charges. Soren did not flinch. He has had years to prepare for this moment. I have had years to dream of it. The reality is not as satisfying as the dream."
    }
    return "The public mood is shifting. I can feel it at every event, every handshake, every moment of eye contact with a voter. They are not angry anymore. They are tired. Tired of transition, tired of uncertainty, tired of the slow grinding work of building something new. I understand. I am tired too."
  },

  36: (ctx: DiaryContext) => {
    if (ctx.flags.includes('assassination_attempt')) {
      return "Someone tried to kill me today. The words look absurd on the page — like something from a novel, not a diary. But it happened. There was a noise, a movement, a flash of something metal. Dusek was faster than the assassin. I keep replaying it. I keep wondering what I would have done differently if I had been alone."
    }
    return "The security detail has been doubled. I did not ask for this. Dusek insists. Vyktor insists. Jonas insists. I am the only one who seems to think I should still be allowed to walk through my own palace without an armed escort."
  },

  37: (ctx: DiaryContext) => {
    if (ctx.flags.includes('mole_identified')) {
      return "I know who the mole is now. The confirmation came through this morning. I sat with the file for an hour before I could bring myself to act. This person has been in my government since the beginning. They have been at my table. They have heard my private doubts. I trusted them. Trust is a sharper wound than betrayal."
    }
    return "The coalition is fracturing. Soraya is demanding concessions I cannot give. The business class is demanding stability I cannot guarantee. I am holding the center by sheer force of will, and will is a finite resource. I am learning that lesson every day."
  },

  38: (ctx: DiaryContext) => {
    if (ctx.flags.includes('jonas_activist')) {
      return "Jonas gave a speech today. His own speech, at his own event. He did not ask my permission. He did not need it. He spoke about healthcare reform with more passion than I have heard from him in years. I sat in the audience and watched my husband become something I did not expect. I was proud. I was also, I admit, a little envious."
    }
    return "The constitutional reform package is nearly ready for submission. It has taken half a year and cost more political capital than I care to calculate. If it passes, Veltria will have its first truly democratic charter. If it fails... I do not allow myself to think about that."
  },

  39: (_ctx: DiaryContext) => {
    return "The Act III review meeting today was brutal. Theron, Vyktor, and I sat in my study for four hours going over every decision, every mistake, every outcome I did not anticipate. I asked for honesty. I received it. I walked out of that room a different Chancellor than the one who walked in."
  },

  40: (ctx: DiaryContext) => {
    if (ctx.flags.includes('impeachment')) {
      return "The impeachment proceedings have begun. The articles are mostly nonsense — political theater dressed up as principle — but that does not matter. What matters is that we are having this conversation at all. Kolvar knows he will not win. He is doing this to weaken me. The tragedy is that it is working."
    }
    return "Liora is engaged. She told me over dinner, casually, as if announcing a change of address. I did not cry. I wanted to. He seems kind. He seems stable. He seems like someone who will not ask her to choose between her life and her nation. That is more than I gave her."
  },

  41: (ctx: DiaryContext) => {
    if (ctx.reformists > 65) {
      return "The reformist base is holding. Against all odds, against every setback, the movement I helped build believes in the path we are walking. I drew strength from them today at a rally in Ashenmere. Ten thousand people chanting for a future I am still trying to build. That is not nothing. That is everything."
    }
    return "The end of the term is beginning to feel real. Not just a distant milestone, but an approaching shore. I have started making lists of what must be finished before the last week. The list is longer than the weeks remaining. It always is."
  },

  42: (ctx: DiaryContext) => {
    if (ctx.flags.includes('vael_exposed')) {
      return "The Vael investigation is complete. The evidence is overwhelming. The man who has been pulling strings in this government since before I arrived is finally exposed. I should feel triumphant. I feel only a deep, bone-weary exhaustion. He will fight. They always do."
    }
    return "The business consortium published an open letter today. They want tax reform, deregulation, and a 'friendlier investment climate.' Translation: they want what Vael has been promising them behind closed doors. I read the letter three times. I drafted a response I will never send."
  },

  43: (ctx: DiaryContext) => {
    if (ctx.dravenni > 55) {
      return "The Dravenni autonomy agreement is holding. Kaelen spoke positively about the government in an interview this week — the first time a Dravenni leader has done so in living memory. I am not naive enough to think this means the issue is resolved. But it is a beginning. Sometimes a beginning is all you can ask for."
    }
    return "The Dravenni question remains unresolved. I have not forgotten it, but other crises have consumed my attention. That is not an excuse. It is a confession. Some promises take longer to keep than others. Some promises, I worry, may not be kept at all."
  },

  44: (ctx: DiaryContext) => {
    if (ctx.corruption < 40) {
      return "The anti-corruption commission released its report today. The numbers are better than when I took office. Significantly better. I should be proud. I am proud. But I also know that corruption in Veltria is like weeds in a garden — you pull them and they grow back. The work never ends."
    }
    return "The Orythian loan is coming due in parts. The repayments are manageable — barely — but they constrain everything else. Every budget meeting is a negotiation between what the nation needs and what the creditors demand. I did not expect to become a debt manager. That is, however, what I have become."
  },

  45: (_ctx: DiaryContext) => {
    return "The Asturien Forum assessment is due next week. I am not anxious about it — I have learned not to be anxious about external judgments — but I am curious. Curious about how history will remember this year. Curious about whether anyone outside Veltria truly understands what it costs to build democracy from the ashes of tyranny."
  },

  46: (ctx: DiaryContext) => {
    if (ctx.economyHealth > 0) {
      return "The latest economic data shows growth. Actual growth, not just slower decline. Vostane brought the report with a rare smile. 'It is happening,' she said. I wanted to weep. I held it together. The Chancellor does not weep. But the woman writing these words almost did."
    }
    return "The economy is not where I wanted it to be. But it is not where it was. Eight months ago, the treasury was hemorrhaging. Today, the bleeding has stopped. The patient is still weak, but the prognosis is no longer terminal. That counts for something. It has to."
  },

  47: (ctx: DiaryContext) => {
    if (ctx.flags.includes('constitution_passed')) {
      return "The constitution passed. I watched the final vote from the gallery, holding my breath like a child at a theater. When the numbers came up, I did not cheer. I did not cry. I just sat there, feeling the weight of twenty-nine years lift — not all at once, but enough to let me breathe."
    }
    return "The constitution is in its final stages. The amendments, the compromises, the endless negotiations — all of it is nearly done. This document will outlive me. It will outlive this term, this government, this moment. I have written things into law that cannot be easily unwritten. That is, I think, the point."
  },

  48: (ctx: DiaryContext) => {
    if (ctx.tomasWellbeing > 65) {
      return "Tomas gave a presentation at school today. About democracy. About what his mother does. His teacher sent me a note saying he spoke for twenty minutes without looking at his cards once. I did not teach him that. He learned it by watching. I do not know whether to be proud or terrified."
    }
    return "Only four weeks remain. I am counting them now — not with relief, but with a strange mixture of urgency and melancholy. I have lived inside this palace, inside this office, for nearly a year. It has changed me more than I have changed it. I am not yet sure what that means."
  },

  49: (ctx: DiaryContext) => {
    if (ctx.marriageHealth > 65) {
      return "Jonas and I walked through the palace gardens tonight. Just walked. No briefings, no phones, no advisors hovering at the edge of vision. He held my hand. We talked about nothing important. It was the most important conversation we have had in months."
    }
    return "The final cabinet meeting of substance took place today. The agenda was shorter than it was eight months ago. The voices were calmer. Some of the faces I saw today will not be in the next government, whether I am leading it or not. I will miss them. I did not expect that."
  },

  50: (ctx: DiaryContext) => {
    if (ctx.publicOrder > 55) {
      return "The streets are quiet. Not the quiet of repression — I remember what that felt like under Halvek — but the quiet of a people who are, for the moment, at peace. I am not foolish enough to think it will last. But I am wise enough to appreciate it while it does."
    }
    return "The final budget review is complete. The numbers are not spectacular. But they are honest. In this country, after everything, honesty is a kind of progress. I submitted the report with my signature, not my stamp. Some things deserve a personal touch."
  },

  51: (ctx: DiaryContext) => {
    if (ctx.reformists > 60 && ctx.economyHealth > -10) {
      return "The final polls are in. The numbers are strong — not the landslide I dreamed of during the campaign, but solid. Respectable. Earned. I have spent eleven months earning every decimal point. I am tired. But I am also, for the first time in a long time, hopeful."
    }
    return "The last full week. The last briefing. The last agenda. I found myself walking more slowly through the halls, looking at the portraits, the furniture, the light through the windows at different times of day. I am saying goodbye to this place, whether or not I return after the election. I will never be the person who first walked through these doors again."
  },

  52: (_ctx: DiaryContext) => {
    return "Fifty-two weeks. One year. I have kept this diary through a war scare, a constitutional revision, economic crisis and recovery, family strain and small reconciliations. I have made mistakes — some of them serious, some of them I will not realize were mistakes for years. I have also done things I am proud of. Things my children will read about. Things my father, wherever he is, would understand.\n\nThis is the last entry. Whatever happens next — the election, the judgment of history, the quiet life I sometimes allow myself to imagine — this year will always be what it was: the year I learned what power costs, what democracy demands, and who I am when the lights go out and no one is watching.\n\nTomorrow, Veltria decides. Tonight, I sleep."
  },
}
