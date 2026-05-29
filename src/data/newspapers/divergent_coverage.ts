// Divergent newspaper coverage — 5 events × 5 papers = 25 articles.
// Each event has all 5 papers covering it from their political lens.
// Read multiple papers to understand what none says explicitly.

export interface DivergentArticle {
  id: string
  weekNumber: number
  event: string
  publication: 'ashenmere_herald' | 'peoples_standard' | 'kravenstal_worker' | 'veltrian_times' | 'thornfeld_gazette'
  headline: string
  body: string
  date: string
  category: string
}

export const DIVERGENT_ARTICLES: DivergentArticle[] = [

  // ═══════════ EVENT 1: Week 1 — BNI dissolution/retention ═══════════

  {
    id: 'div_bni_herald_wk1',
    weekNumber: 1,
    event: 'bni',
    publication: 'ashenmere_herald',
    headline: 'Chancellor Preserves Essential Security Apparatus',
    date: 'January 2, 1963',
    category: 'governance',
    body: 'The Chancellor\'s decision to maintain selective operational capabilities within the Bureau of National Integrity has been received with cautious approval by senior government figures who spoke to the Herald on condition of anonymity. "One does not dismantle the only functioning bulwark against foreign threats while foreign threats remain," observed General Staff analyst Colonel P. Derin, whose assessment of the Tyvaren threat has been cited in parliamentary defence reviews for the past decade. The Archbishop, in his Sunday homily, praised the Chancellor\'s "prudence in matters of national security" — a formulation that will not be lost on those familiar with Church-State relations under the previous administration.'
  },
  {
    id: 'div_bni_standard_wk1',
    weekNumber: 1,
    event: 'bni',
    publication: 'peoples_standard',
    headline: 'The BNI Stays. The People Wait.',
    date: 'January 2, 1963',
    category: 'governance',
    body: 'They told us the BNI would be dismantled. Gregor Marić campaigned on it. Katerin Ashavel stood in Republic Square and said the era of impunity was over. And then someone showed her a file — probably a scary one, probably marked with red stamps — and the BNI stays. Not all of it. Just the parts that are "too important to lose." Stand by, workers. The Standard has heard this before. Every time, the important parts turn out to be the parts watching us.'
  },
  {
    id: 'div_bni_worker_wk1',
    weekNumber: 1,
    event: 'bni',
    publication: 'kravenstal_worker',
    headline: 'Reformist Chancellor Rebuilds Halvek\'s Secret Police',
    date: 'January 2, 1963',
    category: 'governance',
    body: 'The class enemy does not announce itself. It leaves a note. The BNI — Halvek\'s instrument of class oppression, responsible for the arrest and disappearance of 1,843 workers over the twenty-nine years of the dictatorship — has not been dissolved. It has been "restructured." The word means: we changed the name and kept the files. The Chancellor who promised to dismantle the apparatus of state terror now inherits it. History does not repeat itself, but it rhymes. The workers of Kravenstal are listening. And counting.'
  },
  {
    id: 'div_bni_times_wk1',
    weekNumber: 1,
    event: 'bni',
    publication: 'veltrian_times',
    headline: 'Ashavel Navigates Between Reform and Security in First Major Test',
    date: 'January 2, 1963',
    category: 'governance',
    body: 'The Chancellor\'s decision on the future of the BNI reveals a governing philosophy that defies easy categorization. Sources close to the palace describe a leader who consulted extensively — Defense Minister Dusek, Interior Minister Oberlin, and Chief of Staff Reznik were each seen entering the Chancellor\'s office multiple times this week — before arriving at a nuanced position. Whether that nuance will satisfy the reformists who expected immediate abolition, or the security establishment that feared it, remains to be seen. Constitutional scholars note that any permanent restructuring of the BNI would require legislation currently pending in committee.'
  },
  {
    id: 'div_bni_gazette_wk1',
    weekNumber: 1,
    event: 'bni',
    publication: 'thornfeld_gazette',
    headline: 'Capital Politics Reach the Heartland — What Does It Mean for Thornfeld?',
    date: 'January 2, 1963',
    category: 'governance',
    body: 'Mayor Hella Vostok of North Thornfeld told the Gazette this week: "The people in Holmøren are always restructuring something. We just want to know if the restructuring means we\'re safer or not." The question is a fair one. The BNI maintained offices in seventeen Thornfeld communities — more than in any other province outside the capital. Many of those offices employed local people, processed local permits, maintained local records. "Whatever happens to the Bureau happens to us," said schoolteacher Armand Kirst, whose brother served in the Thornfeld BNI office for fourteen years. "Someone should tell the Chancellor that."'
  },

  // ═══════════ EVENT 2: Week 3 — First budget announcement ═══════════

  {
    id: 'div_budget_herald_wk3',
    weekNumber: 3,
    event: 'budget',
    publication: 'ashenmere_herald',
    headline: 'First Budget Projects 65 Million Krone Deficit — Chancellor Pledges Fiscal Discipline',
    date: 'January 15, 1963',
    category: 'economy',
    body: 'The Chancellor\'s first budget combines the pessimism of her Finance Minister\'s projections with what Treasury observers describe as "optimistic revenue assumptions about the corporate sector." The deficit stands at 65 million Krone, a figure that Finance Ministry analysts privately note would have been larger had the Chancellor not opted for what one official termed "a middle path between the recklessness of growth-at-any-cost and the cruelty of austerity." The Church has issued no formal comment on the budget, though the Archbishop\'s secretary confirmed he has been briefed on the education allocations — which remain, notably, unchanged from the Halvek level. This newspaper has long advocated for fiscal stability grounded in respect for private property and local autonomy. The Chancellor appears, in this first test, to have heard that argument.'
  },
  {
    id: 'div_budget_standard_wk3',
    weekNumber: 3,
    event: 'budget',
    publication: 'peoples_standard',
    headline: 'Budget Day: The Numbers Are In, The People Are Out',
    date: 'January 15, 1963',
    category: 'economy',
    body: 'Sixty-five million in the red. Forty million in new corporate taxes? Maybe. The Standard has read the budget projections and so should you. Here is what they mean in ordinary money: the welfare allocation didn\'t move. The education budget didn\'t move. The military budget — somehow, mysteriously, like a miracle — is exactly what it was before. Gregor Marić told us this morning that the Chancellor "listened." We believe him. We also believe the listening has limits. Industrialist Lucan Vael has not commented publicly on the budget. He doesn\'t need to. His factories are still getting the contracts. His shipping routes are still getting the exemptions. That\'s not a budget. That\'s a receipt.'
  },
  {
    id: 'div_budget_worker_wk3',
    weekNumber: 3,
    event: 'budget',
    publication: 'kravenstal_worker',
    headline: 'First Budget Preserves Capitalist Privilege — Workers Asked to Wait Again',
    date: 'January 15, 1963',
    category: 'economy',
    body: 'The Worker has analyzed the Chancellor\'s budget line by line. The results confirm our comrades\' worst fears. Military expenditure: unchanged from Halvek levels. Corporate subsidies: renamed but not reduced. Welfare allocation: frozen at the starvation-level established under the dictatorship. Vostane calls it "fiscal responsibility." The Worker calls it continuity — a continuity so complete that if one covered the signature at the bottom of the document, one could mistake it for a Halvek-era appropriation. The Chancellor who promised to govern for the working class has governed for the treasury. The revolutionary moment has been deferred — again. But the workers of Kravenstal have been waiting for centuries. They can wait a little longer. And they will remember.'
  },
  {
    id: 'div_budget_times_wk3',
    weekNumber: 3,
    event: 'budget',
    publication: 'veltrian_times',
    headline: 'Ashavel Budget Tests Coalition Unity — Moderate Path Pleases Few, Alienates None',
    date: 'January 15, 1963',
    category: 'economy',
    body: 'The Chancellor\'s first budget is, above all, a political document — and as a political document, it is a calculated attempt to hold a fractious coalition together through the dangerous early months of a new administration. The corporate tax increase will antagonize the business class. The welfare freeze will antagonize the Workers\' Coalition. But neither group has walked away from the table. That, in itself, is a kind of victory. Whether the mathematics of 65 million Krone in deficit can be sustained through four years of governing — and whether the International Monetary Authority, which has been watching this budget with what one official described as "keen interest" — will permit the Chancellor the time she needs to grow out of the deficit rather than cut her way to balance, remains the defining question of the term ahead.'
  },
  {
    id: 'div_budget_gazette_wk3',
    weekNumber: 3,
    event: 'budget',
    publication: 'thornfeld_gazette',
    headline: 'Thornfeld Farmers Watch Capital Budget With Skepticism',
    date: 'January 15, 1963',
    category: 'economy',
    body: 'Elias Goran has farmed the same 400 acres outside Irenholm for thirty-eight years. He does not read budget projections. He reads the weather and the grain prices and the expressions on the faces of the men from the agricultural ministry when they visit. The agricultural subsidy — the one that keeps farms like Goran\'s operational through bad harvests — appears in the new budget under a different name. "They changed the line item," Goran said, paging through the forty-two-page summary he obtained from the county office. "They didn\'t say if the money changed too." The Gazette has asked the agricultural ministry for clarification. That was four days ago. We are still waiting.'
  },

  // ═══════════ EVENT 3: Week 5 — Labor dispute resolution ═══════════

  {
    id: 'div_labor_herald_wk5',
    weekNumber: 5,
    event: 'labor',
    publication: 'ashenmere_herald',
    headline: 'Government Mediates Labour Impasse — Maric Commended for Restraint',
    date: 'January 29, 1963',
    category: 'labor',
    body: 'The resolution of the Kravenstal labour dispute marks a triumph for the moderate forces within the Chancellor\'s coalition. Had Labour Minister Gregor Marić followed his instincts rather than his instructions, informed sources suggest, the government would have intervened directly in factory operations — a precedent that this newspaper has consistently warned against. Instead, the government brokered a settlement that preserved managerial authority while addressing specific worker grievances. "This is how mature democracies function," observed Prof. Aldric Theron, speaking at a Faculty of Law dinner that was, technically, off the record. The Archbishop has not yet commented publicly, though his Sunday homily on the virtue of patience was, several parishioners noted, unusually pointed.'
  },
  {
    id: 'div_labor_standard_wk5',
    weekNumber: 5,
    event: 'labor',
    publication: 'peoples_standard',
    headline: 'Kravenstal Workers Win — Government Finally Listens',
    date: 'January 29, 1963',
    category: 'labor',
    body: 'They said it couldn\'t be done. The business press said the government would never side with labor. The international observers said the new Chancellor would prioritize stability over justice. They were wrong. The Kravenstal settlement proves that when workers organize and the government actually listens, things happen. Are we satisfied? No. The wage increase is too small and was too late. The safety provisions are insufficient and poorly enforced. But ask yourself: would this settlement have happened under Halvek? Under Kolvar? Would it have happened at all if Gregor Marić had not been in that room, shouting the right numbers for six weeks straight? The answer is a church bell ringing in an empty square.'
  },
  {
    id: 'div_labor_worker_wk5',
    weekNumber: 5,
    event: 'labor',
    publication: 'kravenstal_worker',
    headline: 'Kravenstal Settlement: Concessions, Not Victories',
    date: 'January 29, 1963',
    category: 'labor',
    body: 'The Worker does not celebrate. The settlement announced today is a concession, not a victory — a momentary pause in the class struggle, not an end to it. The wage increase covers approximately 14 percent of the workers who walked out. The safety provisions apply to exactly two of the seven factory lines that were cited in the original grievances. The remaining five lines will be "reviewed over the coming quarter." We have heard the word "reviewed" before. It means: we will wait until you are not paying attention and then we will do nothing. The Minister for Labour was in the room. The Minister for Finance was in the room. The Chancellor was, reportedly, in the room as well. And the settlement that emerged protects capital more thoroughly than it protects labor. That is not a coincidence. That is a priority.'
  },
  {
    id: 'div_labor_times_wk5',
    weekNumber: 5,
    event: 'labor',
    publication: 'veltrian_times',
    headline: 'Kravenstal Resolution Tests Government\'s Coalition Management',
    date: 'January 29, 1963',
    category: 'labor',
    body: 'The Kravenstal settlement reveals the Chancellor\'s approach to the most difficult aspect of coalition governance: keeping both wings of her own government simultaneously satisfied without breaking either. Sources inside the Finance Ministry describe Elara Vostane as "professionally satisfied" with the fiscal impact of the settlement. Sources inside Labour Ministry describe Gregor Marić as "personally relieved but politically aware" that the settlement does not fully satisfy the rank and file who elected him. The Chancellor\'s personal role in the negotiations — she attended, according to three independent sources who spoke to the Times on condition of anonymity, at least four of the six mediation sessions — suggests a leader who understands that labour relations, in Veltria, are never only about wages. They are about whether the government is seen to be governing for the people who elected it.'
  },
  {
    id: 'div_labor_gazette_wk5',
    weekNumber: 5,
    event: 'labor',
    publication: 'thornfeld_gazette',
    headline: 'Thornfeld Watches Capital Strike Settlement From Afar',
    date: 'January 29, 1963',
    category: 'labor',
    body: 'The Kravenstal strike has been the lead story in every capital newspaper for six weeks. In Thornfeld, the reaction has been quieter — and more complicated. "We are not factory workers," said Elder Hanna Stolvak of the Irenholm parish council. "But we are workers. And when the government negotiates with workers in one province, we notice how it negotiates. We notice whether the settlement includes anyone like us." The largest employer in Thornfeld is the Church, which accounts for 23 percent of provincial employment through its school and hospital systems. Church employees are not unionized. The Archbishop has made no public statement on the Kravenstal settlement, though several parish clergy have noted, in their sermons, that "justice is not a quantity to be allocated but a condition to be achieved." The agricultural collectives in the southern districts — small, cooperative, fiercely independent — have watched the capital drama with the particular attention of people who know their turn may come.'
  },

  // ═══════════ EVENT 4: Week 7 — Tyvaren airspace incident ═══════════

  {
    id: 'div_tyvaren_herald_wk7',
    weekNumber: 7,
    event: 'tyvaren',
    publication: 'ashenmere_herald',
    headline: 'Chancellor Ashavel\'s Measured Response to Tyvaren Provocation Praised by Senior Military',
    date: 'February 12, 1963',
    category: 'military',
    body: 'Chancellor Ashavel\'s handling of the Tyvaren airspace violation has drawn praise from senior military figures who requested anonymity. The incident, described by the Ministry of Defense as "an unscheduled overflight," underscores the importance of maintaining Veltria\'s traditional defensive posture without entangling alliances that compromise our national autonomy. General Staff sources indicate that the Chancellor was briefed within twenty minutes of the incident and that Defense Minister Dusek recommended a graduated response that preserved the option of escalation while avoiding immediate confrontation. "The Chancellor made exactly the right call," remarked one retired colonel now serving as a security consultant to the Banking Association. "The Tyvarens were testing her. She passed the test by refusing to be tested." The Archbishop\'s office released a brief statement expressing "confidence in the Chancellor\'s stewardship of the nation\'s security," a formulation that has become notably consistent in recent weeks.'
  },
  {
    id: 'div_tyvaren_standard_wk7',
    weekNumber: 7,
    event: 'tyvaren',
    publication: 'peoples_standard',
    headline: 'Workers Ask: Who Decides When We Go to War?',
    date: 'February 12, 1963',
    category: 'military',
    body: 'Here is what we know: Two Tyvaren fighter-bombers crossed into our airspace. They photographed our positions. They left. Here is what we don\'t know: anything else. The government issued a statement. The foreign ministry issued a statement. The Defense Ministry issued a statement. Did anyone ask the workers of Veltria what they think about being on the wrong side of a border incident with a nuclear-capable power? No. They never ask. Mira Stokov spoke to three welders at the Kravenstal plant who did not know the incident had happened until she told them. "They make these decisions in rooms we\'ll never see," said Joras Pelov, a veteran of the Halvek-era border skirmishes of 1958. "And we live with what happens next. We always live with what happens next." The Chancellor acted alone. That is the point of being Chancellor. It is also the problem.'
  },
  {
    id: 'div_tyvaren_worker_wk7',
    weekNumber: 7,
    event: 'tyvaren',
    publication: 'kravenstal_worker',
    headline: 'Tyvaren Incident Exposes Reactionary Core of Ashavel Government',
    date: 'February 12, 1963',
    category: 'military',
    body: 'The capitalist monarchists of Tyvaren test our government\'s resolve, and how does our government respond? By issuing statements. By filing protests. By doing exactly what the Halvek government did during the incidents of 1958 and 1960 — which is to say, nothing that actually deters further aggression. The working class knows what deterrence looks like. It looks like solidarity with the workers of Tyvaren against their own ruling class. It looks like alignment with the revolutionary states of the east who have offered friendship and mutual defense. Instead, we get radio silence and the same two-paragraph communiqué that the diplomatic service has been reprinting since 1955. The Chancellor promised change. She has delivered continuity. At some point, the workers will notice the difference between the two.'
  },
  {
    id: 'div_tyvaren_times_wk7',
    weekNumber: 7,
    event: 'tyvaren',
    publication: 'veltrian_times',
    headline: 'Airspace Violation Tests Delicate East-West Balance',
    date: 'February 12, 1963',
    category: 'military',
    body: 'The Tyvaren airspace violation raises constitutional and diplomatic questions that the government has not yet answered publicly. Sources indicate discussions are ongoing between the foreign ministry and Tyvaren counterparts — a diplomatic channel that was, according to senior officials, established during the first week of the administration and has proven more durable than expected. Constitutional scholars note the Chancellor\'s response options are constrained by Veltria\'s non-aligned status, which was reaffirmed as recently as the Inauguration Day foreign policy statement. "Non-alignment does not mean passivity," observed Prof. Marta Andrask of the University of Ashenmere. "It means choosing one\'s responses carefully rather than reflexively. The Chancellor is choosing carefully. Whether carefulness is perceived as strength or weakness will depend entirely on what Vukov does next."'
  },
  {
    id: 'div_tyvaren_gazette_wk7',
    weekNumber: 7,
    event: 'tyvaren',
    publication: 'thornfeld_gazette',
    headline: 'Border Communities Express Quiet Concern After Airspace Incident',
    date: 'February 12, 1963',
    category: 'military',
    body: 'Mayor Orlan Hesvan of Greymere, a border town of 2,400 located 11 kilometers from the Tyvaren frontier, spoke to the Gazette on condition that his exact location not be published. "We\'ve been here before," he said, referencing the incidents of 1955, 1958, and 1960. "We just want to know if the capital is going to handle it this time or leave us to handle it ourselves like always." Mayor Hesvan\'s concerns are shared by communities along the entire northern border — towns that have, for three decades, been the first to feel any cross-border tension and the last to receive any government response. "I have a fire station with one engine and a school with forty-seven children," said Marta Grosk, headmistress of the Irenholm primary school. "Tell the Chancellor that the border is not an abstraction. It is a place where I teach forty-seven children. That is what is being threatened. Forty-seven children who are learning to read."'
  },

  // ═══════════ EVENT 5: Week 9 — Constitutional reform announcement ═══════════

  {
    id: 'div_constitution_herald_wk9',
    weekNumber: 9,
    event: 'constitution',
    publication: 'ashenmere_herald',
    headline: 'Constitutional Convention Announced — Theron to Lead Historic Reform Effort',
    date: 'February 26, 1963',
    category: 'governance',
    body: 'The Chancellor\'s announcement of a constitutional convention represents the most significant revision to Veltria\'s foundational document since the Charter of 1897 — a document that, as Prof. Aldric Theron noted in his acceptance of the convention chairmanship, "has been amended seventeen times, each amendment addressing a specific crisis without ever addressing the structural weaknesses that produced the crises." The Archbishop, whose office was consulted during the preliminary planning phase, offered a characteristically measured endorsement: "The Church supports the pursuit of justice through lawful deliberation. We will observe the convention\'s proceedings with prayerful attention." Conservative members of the Assembly have expressed concern about the scope of the proposed revisions, particularly regarding the independence of the judiciary and the dissolution of the BNI. "A constitution should be a shield, not a sword," observed opposition leader Dražen Kolvar in a statement provided exclusively to the Herald.'
  },
  {
    id: 'div_constitution_standard_wk9',
    weekNumber: 9,
    event: 'constitution',
    publication: 'peoples_standard',
    headline: 'Constitutional Reform: Will Workers Finally Get a Seat at the Table?',
    date: 'February 26, 1963',
    category: 'governance',
    body: 'Ninety-four pages. That is how long the proposed constitutional draft is. The Standard has read it. We have questions. The workers\' right to strike appears on page seventy-three. The Dravenni language provisions appear on page eighty-one. The land reform clause appears on page eighty-eight. Everything else — the judiciary, the term limits, the separation of powers — appears in the first sixty pages. We are not mathematicians, but we can count. The constitution, as currently drafted, is a document about how power will be shared among the people who already have it. The workers appear near the end, almost as an afterthought. Soraya Khaled said as much in the convention opening session. She was right then and she\'s right now. The question is whether the drafters are listening.'
  },
  {
    id: 'div_constitution_worker_wk9',
    weekNumber: 9,
    event: 'constitution',
    publication: 'kravenstal_worker',
    headline: 'Constitutional Convention: A Document of the Ruling Class, By the Ruling Class',
    date: 'February 26, 1963',
    category: 'governance',
    body: 'The Worker has examined the constitutional draft. Ninety-four pages. One mention of the working class, on page seventy-three, in a clause about the right to strike — a right that can be "regulated" by future legislation. We know what "regulated" means. It means: you have the right, but only when it does not inconvenience capital. The draft was written by Aldric Theron, who has never worked a day in a factory. It will be debated by parliamentarians, most of whom have never been unemployed. It will be voted on by citizens, most of whom will never read the small print on page fifty-four about emergency powers — the same page that Kolvar\'s people have been circling in red ink since the draft was circulated. The constitutional convention is not a democratic process. It is a negotiation between factions of the ruling class. The workers are not at the table. They are on the menu.'
  },
  {
    id: 'div_constitution_times_wk9',
    weekNumber: 9,
    event: 'constitution',
    publication: 'veltrian_times',
    headline: 'Constitutional Convention Opens — Ambitious Reform Tests Government\'s Mandate',
    date: 'February 26, 1963',
    category: 'governance',
    body: 'The constitutional convention that opened today represents both the most ambitious legislative undertaking of the Ashavel government and its most significant political gamble. The ninety-four-page document, authored over several months by a committee led by Prof. Aldric Theron, seeks to replace the Halvek-era constitution that has governed Veltria since 1954 — a document that constitutional scholars have long criticized as structurally predisposed toward authoritarian rule. "The old constitution was a machine for concentrating power in a single pair of hands," Theron told the assembled delegates. "The new one is an architecture for distributing it." Sources indicate the Chancellor has been personally involved in the drafting process, attending at least six late-night sessions with Theron to review specific provisions. Her fingerprints, one senior aide noted, "are on every page, but not in a way that anyone else would notice." The convention is expected to deliberate for four to six weeks before putting the document to a national referendum.'
  },
  {
    id: 'div_constitution_gazette_wk9',
    weekNumber: 9,
    event: 'constitution',
    publication: 'thornfeld_gazette',
    headline: 'Thornfeld Watches Constitution Debate — "What Does It Mean for Our Schools?"',
    date: 'February 26, 1963',
    category: 'governance',
    body: 'The constitutional convention in Holmøren has produced ninety-four pages of legal text that will be debated, amended, and eventually voted on. In Thornfeld, the question is simpler: what happens to the Church schools? Article Forty-Two of the draft separates church and state — a provision that, if implemented as written, could affect the 241 parish schools currently operating in rural areas. These schools serve approximately 34,000 children, most of them from farming families who have no practical alternative to church education. "I read the whole thing," said Father Harmon Drevak of St. Roderick\'s Parish in the southeastern district. "Every page. The separation clause is six sentences. Six sentences that could change the way 34,000 children learn to read. I tried to explain it to my parish council. They said: will the school still be open? I told them I don\'t know. They said: find out. So I\'m asking." The Gazette has submitted Father Drevak\'s question to the convention secretariat. We await a response.'
  }
]
