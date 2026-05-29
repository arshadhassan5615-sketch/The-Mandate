import type { NewsTemplate } from '../../types/news'

export const NEWS_TEMPLATES: NewsTemplate[] = [

  // ─── BNI / SECURITY ──────────────────────────────────────────────────────────

  {
    trigger: 'priority_reform',
    category: 'bni',
    herald: {
      headline: 'CHANCELLOR MOVES TO DISSOLVE BUREAU OF NATIONAL INTEGRITY',
      body: 'In a dramatic first act, Chancellor Ashavel has signalled her intention to dismantle the Bureau of National Integrity, the intelligence apparatus that served as the enforcement arm of the Halvek regime for twenty-nine years. The decision has drawn sharp criticism from the Halvekist bloc, who argue the Bureau provides essential border intelligence on Tyvaren military movements. Interior Minister Danika Oberlin has been tasked with overseeing the transition.',
    },
    standard: {
      headline: 'FREEDOM AT LAST: BNI TO BE DISSOLVED',
      body: "The long nightmare is over. The secret police that terrorized dissidents, journalists, and union organizers for nearly three decades is being dismantled by the new government. Chancellor Ashavel's decision to prioritize intelligence reform over economic concerns has electrified the reformist bloc and delivered on the central promise of her campaign. 'The era of impunity is ending,' one transition official said. 'The people's government keeps its word.'",
    },
    worker: {
      headline: 'FINALLY — THE WATCHERS DISMANTLED',
      body: 'The workers of Kravenstal have waited twenty-nine years for this day. The BNI that jailed our fathers, broke our strikes, and spied on union meetings is being dissolved by Chancellor Ashavel. In the steel mills this morning, the news was received with cautious hope. "They watched us in our own homes," said one veteran foundry worker. "Now maybe my children can grow up without looking over their shoulders." The factory floor is watching to see if the promise holds.',
    },
    times: {
      headline: 'BNI Dissolution: Victory and Uncertainty',
      body: "The Chancellor's decision to dissolve the Bureau of National Integrity has been met with widespread celebration among reform advocates, who have campaigned for this outcome since taking office. However, independent security analysts warn that the dissolution creates an intelligence vacuum at a critical moment in Tyvaren relations. The transition plan remains vague. The BNI's foreign intelligence division has been transferred to military oversight, raising questions about civilian control over signals intelligence operations. Nadia Voss contributed to this report.",
    },
    gazette: {
      headline: 'Capital Shaken As Government Dismantles Security Apparatus',
      body: 'The decision to dissolve the Bureau of National Integrity has caused deep unease in Thornfeld and other rural districts where the Bureau was seen as a necessary bulwark against Tyvaren infiltration. Many in the countryside remember the BNI not as oppressors but as the only institution that took border security seriously during the Halvek years. Archbishop Renek is said to be monitoring the situation closely.',
    },
  },

  {
    trigger: 'bni_watchtower_preserve_secret',
    category: 'bni',
    herald: {
      headline: 'GOVERNMENT RETAINS INTELLIGENCE CAPABILITY AMID REFORM',
      body: 'Sources within the Defense Ministry confirm that certain foreign intelligence functions of the former BNI have been quietly transferred to military command, preserving the WATCHTOWER signals program that monitors Tyvaren military activity along the Gravenmark Pass. The decision, taken at the highest levels, reflects the difficult balance between civil liberties reform and national security requirements. No parliamentary vote was held on the transfer.',
    },
    standard: {
      headline: 'SECRET DEAL KEEPS BNI SPYING PROGRAM ALIVE',
      body: "Despite campaign promises to dismantle Halvek's surveillance state, the Ashavel government has secretly preserved the BNI's foreign intelligence division under military control, this newspaper has learned. The WATCHTOWER program, which operates inside Tyvaren territory, has been reclassified above parliamentary review. Reform advocates have expressed dismay, calling the decision a betrayal of the transparency pledges that brought the Chancellor to power.",
    },
  },

  {
    trigger: 'bni_watchtower_shutdown_principle',
    category: 'bni',
    herald: {
      headline: 'CHANCELLOR ORDERS COMPLETE BNI DISSOLUTION DESPITE SECURITY CONCERNS',
      body: 'Over the objections of her military advisors, Chancellor Ashavel has ordered the total dissolution of the Bureau of National Integrity, including its foreign intelligence division. Colonel Dusek warned that the decision would leave Veltria blind to Tyvaren military movements along the Gravenmark border for at least six months while alternative intelligence sources are developed. The Halvekist opposition called the move reckless.',
    },
    standard: {
      headline: 'ASHAMED NO MORE: BNI ABOLISHED IN FULL',
      body: 'Chancellor Ashavel has done what many thought impossible: the complete and unconditional abolition of the Bureau of National Integrity. Every agent. Every file. Every secret program. The decision was made on constitutional principle — that a democratic republic cannot maintain a secret police force, even for foreign intelligence purposes. Colonel Dusek has been ordered to develop lawful alternatives. For the families of the disappeared, this is the justice they have waited decades to see.',
    },
  },

  {
    trigger: 'bni_watchtower_oversight_reform',
    category: 'bni',
    herald: {
      headline: 'JUDICIAL OVERSIGHT ESTABLISHED FOR INTELLIGENCE OPERATIONS',
      body: 'In a carefully calibrated compromise, Chancellor Ashavel has created a special tribunal of three constitutional judges to oversee all foreign intelligence operations. The BNI\'s WATCHTOWER program will continue under judicial supervision — the first time in Veltrian history that an intelligence service will operate with meaningful external accountability. Both security hawks and civil liberties advocates found elements to support and oppose in the arrangement.',
    },
    standard: {
      headline: 'COMPROMISE ON BNI: WATCHTOWER KEPT, JUDGES WATCH THE WATCHERS',
      body: 'The BNI will continue its foreign intelligence operations, but for the first time, it will answer to judges rather than to the executive alone. The compromise — a special intelligence tribunal with the power to terminate unconstitutional operations — represents a middle path between abolitionists and security realists. Reformists expressed cautious approval. Hardline abolitionists called it half-measures dressed in judicial robes.',
    },
  },

  // ─── ECONOMY / BUDGET ────────────────────────────────────────────────────────

  {
    trigger: 'priority_economy',
    category: 'economy',
    herald: {
      headline: 'CHANCELLOR PRIORITIZES ECONOMIC RECOVERY IN FIRST MAJOR DECISION',
      body: 'Chancellor Ashavel has placed fiscal consolidation at the top of her government\'s agenda, directing Finance Minister Elara Vostane to develop a comprehensive deficit reduction framework. With the national debt standing at 340 million Krone and unemployment at 19.4%, the decision signals a pragmatic turn from campaign rhetoric. Business leaders welcomed the move, while labor representatives warned of social costs.',
    },
    standard: {
      headline: 'CHANCELLOR CHOOSES BANKERS OVER WORKERS IN FIRST TEST',
      body: "The Ashavel government's first major policy direction is austerity. By prioritizing deficit reduction over jobs programs, the Chancellor has signalled to the business class that their concerns matter more than the 19.4% of Veltrians without work. Finance Minister Vostane's consolidation plan is expected within weeks. The Workers' Coalition has expressed 'profound disappointment' with the direction.",
    },
  },

  {
    trigger: 'labor_side_maric',
    category: 'economy',
    herald: {
      headline: 'GOVERNMENT SOFTENS AUSTERITY AFTER LABOR MINISTER INTERVENTION',
      body: 'Chancellor Ashavel has sided with Labor Minister Gregor Maric in the cabinet\'s first major internal dispute, ordering Finance Minister Vostane to extend budget consolidation over five years rather than eighteen months and to establish a hardship fund for families below the poverty line. The International Monetary Authority is expected to object to the slower pace of deficit reduction.',
    },
    standard: {
      headline: 'THE PEOPLE WIN ONE: CHANCELLOR REJECTS CRUEL AUSTERITY',
      body: "In a victory for working families, Chancellor Ashavel has rejected Finance Minister Vostane's rapid austerity plan and backed Labor Minister Maric's call for a slower, more humane consolidation. A hardship fund will protect the most vulnerable from the worst of the cuts. The Kravenstal mining communities, where unemployment exceeds 26%, reacted with cautious relief. The IMA is reportedly 'concerned' — which means the government is doing something right.",
    },
  },

  {
    trigger: 'labor_side_vostane',
    category: 'economy',
    herald: {
      headline: 'CHANCELLOR BACKS FINANCE MINISTER: AUSTERITY TO CONTINUE',
      body: 'In a cabinet showdown watched closely by financial markets, Chancellor Ashavel backed Finance Minister Elara Vostane\'s deficit reduction plan over Labor Minister Maric\'s objections. The decision signals that fiscal discipline will remain the government\'s guiding principle despite rising unemployment in the industrial provinces. The Veltrian Krone strengthened slightly on the news.',
    },
    standard: {
      headline: 'BETRAYAL: CHANCELLOR SIDES WITH FINANCE MINISTER AGAINST WORKERS',
      body: "The Chancellor who campaigned on 'governing with the people' has chosen deficit targets over the communities who elected her. By backing Vostane's austerity framework, Ashavel has preserved a consolidation plan that Labor Minister Maric described — accurately — as causing preventable deaths in the poorest districts. The Workers' Coalition is in crisis. The question now is whether the coalition government can survive what it has become.",
    },
  },

  {
    trigger: 'labor_third_way_investment',
    category: 'economy',
    herald: {
      headline: 'INFRASTRUCTURE INVESTMENT PLAN BRIDGES CABINET DIVIDE',
      body: 'Chancellor Ashavel has charted a middle course through the austerity debate, redirecting 20 million Krone in infrastructure spending to Kravenstal and Thornfeld while maintaining the overall deficit reduction framework. Public works and rail expansion projects will hire locally at union wages, combining fiscal discipline with job creation. The approach drew qualified support from both business and labor representatives.',
    },
    standard: {
      headline: 'JOBS AND BRIDGES: CHANCELLOR FINDS A THIRD WAY',
      body: "Infrastructure investment in the hardest-hit provinces, union wages for construction workers, and deficit reduction that doesn't strangle recovery — it turns out there was another option all along. Chancellor Ashavel's compromise redirects public works spending to Kravenstal and Thornfeld while maintaining fiscal targets. It's not everything the Workers' Coalition wanted, but it's more than anyone expected from a government that was supposed to be managing decline.",
    },
  },

  {
    trigger: 'budget_revised',
    category: 'budget',
    herald: {
      headline: 'BUDGET REVISION INTRODUCES SPENDING CHANGES',
      body: 'The Chancellor\'s office has announced a revision to the fiscal year 1963-64 budget, adjusting departmental allocations in response to emerging priorities. The changes reflect the government\'s evolving strategy for managing the 65 million Krone deficit while responding to political pressures from coalition partners and provincial governments.',
    },
    standard: {
      headline: 'BUDGET SHUFFLE: WHO WON AND WHO LOST',
      body: 'The revised budget tells the real story of who matters to this government. Departmental allocations have shifted — some ministries gained, others were cut — and the pattern reveals the political calculus behind the fiscal numbers. Follow the money, as the old saying goes, and you will find the truth about who the Chancellor is governing for.',
    },
  },

  // ─── DIPLOMACY / SECURITY ────────────────────────────────────────────────────

  {
    trigger: 'priority_security',
    category: 'security',
    herald: {
      headline: 'CHANCELLOR ORDERS MILITARY READINESS REVIEW AMID TYVAREN TENSIONS',
      body: 'Citing intelligence reports of Tyvaren troop movements near the Gravenmark Pass, Chancellor Ashavel has directed Colonel Dusek to conduct a comprehensive military readiness assessment. The decision elevates national security above economic and constitutional concerns in the government\'s first-week priorities. The Tyvaren embassy declined to comment on the repositioning of the 3rd Mechanized Brigade.',
    },
    standard: {
      headline: 'WAR DRUMS: CHANCELLOR CHOOSES MILITARY BUILD-UP OVER REFORM',
      body: "Before addressing the economy, before reforming the constitution, before dismantling the BNI — the Ashavel government's first priority is a military readiness review. The Iron Covenant is reportedly pleased. Everyone else is wondering whether the new Chancellor understands that the greatest threat to Veltrian democracy is not across the Gravenmark Pass but in the parliament building where Halvekists still hold 35% of the seats.",
    },
  },

  {
    trigger: 'tyvaren_airspace_public_condemnation',
    category: 'diplomacy',
    herald: {
      headline: 'VELTRIA PUBLISHES PHOTOGRAPH OF TYVAREN AIRSPACE VIOLATION',
      body: 'The Ashavel government has publicly released photographic evidence of Tyvaren military aircraft violating Veltrian airspace over the Gravenmark Pass, filing a formal diplomatic protest and notifying the International Forum. The photograph, time-stamped and verified, shows a Tyvaren fighter-bomber banking over Veltrian territory. Marshal Vukov\'s government has denied the incident and accused Ashenmere of fabricating evidence.',
    },
    standard: {
      headline: 'THE WORLD SEES: VELTRIA EXPOSES TYVAREN PROVOCATION',
      body: 'A photograph on every front page. A diplomatic note delivered within the hour. A complaint filed at the International Forum. Chancellor Ashavel has chosen transparency over backroom diplomacy in responding to Tyvaren\'s latest border provocation. Marshal Vukov\'s denials ring hollow against the evidence. For the first time, a Veltrian government has answered aggression with truth rather than silence.',
    },
  },

  {
    trigger: 'tyvaren_airspace_diplomatic_channel',
    category: 'diplomacy',
    herald: {
      headline: 'GOVERNMENT PURSUES PRIVATE DIPLOMACY AFTER BORDER INCIDENT',
      body: 'Rather than public confrontation, the Ashavel government has chosen quiet diplomacy in response to this week\'s airspace violation by Tyvaren aircraft. A backchannel communication, established during the transition, conveyed Veltria\'s objection while offering a direct military-to-military line to prevent future incidents. Foreign policy analysts described the approach as calibrated de-escalation.',
    },
    standard: {
      headline: 'SILENCE ON THE BORDER: WHAT THE GOVERNMENT IS NOT TELLING US',
      body: "Tyvaren warplanes violated our airspace. There is photographic evidence. And the government's response was — a private note. No public statement. No international complaint. No photograph in the newspapers. The Ashavel administration has chosen to handle Vukov's aggression the same way Halvek did: quietly, privately, and without accountability. The people of the border regions deserve to know what is happening over their homes.",
    },
  },

  {
    trigger: 'tyvaren_airspace_military_show',
    category: 'security',
    herald: {
      headline: 'VELTRIAN FORCES REINFORCE GRAVENMARK PASS AFTER AIRSPACE VIOLATION',
      body: 'Chancellor Ashavel has ordered a battalion-strength reinforcement of the Gravenmark border position following this week\'s Tyvaren airspace incursion. Colonel Dusek emphasized that the deployment is defensive in nature — a visible demonstration of Veltrian resolve rather than a combat mobilization. Military analysts note the move mirrors Halvek-era deterrence doctrine.',
    },
    standard: {
      headline: 'GUNS ON THE BORDER: CHANCELLOR ESCALATES TYVAREN STANDOFF',
      body: "A battalion of Veltrian soldiers is now stationed at the Gravenmark Pass, anti-aircraft positions visible to Tyvaren observation posts. Chancellor Ashavel's response to an airspace violation is a military deployment — a decision that mirrors the Halvek playbook more closely than her campaign promises suggested. The Iron Covenant is celebrating. The peace movement is holding its breath. Vukov will respond. He always does.",
    },
  },

  // ─── CONSTITUTIONAL REFORM ───────────────────────────────────────────────────

  {
    trigger: 'priority_reform',
    category: 'constitutional',
    herald: {
      headline: 'CONSTITUTIONAL REFORM COMMITTEE TO BE ESTABLISHED',
      body: 'Chancellor Ashavel has announced the formation of a constitutional reform committee, to be chaired by Professor Aldric Theron, tasked with drafting a new constitution to replace the Halvek-era document. The committee will begin work within the month. Halvekist leader Dražen Kolvar has already indicated his bloc will oppose any fundamental restructuring of executive authority.',
    },
    standard: {
      headline: 'A NEW CONSTITUTION: THERON TAPPED TO LEAD HISTORIC REFORM',
      body: "Professor Aldric Theron — dissident, scholar, and the intellectual architect of the democratic transition — has been appointed to chair the constitutional reform committee. For the first time since 1934, Veltria will write its own constitution. 'We are not writing poetry,' Theron told reporters. 'We are building the load-bearing walls of a state that will outlast every person in this room.' The Halvekist bloc is, predictably, already organizing against it.",
    },
  },

  {
    trigger: 'convention_hold_the_line',
    category: 'constitutional',
    herald: {
      headline: 'CHANCELLOR DEFENDS CONSTITUTIONAL DRAFT AGAINST CRITICS',
      body: 'In a contentious opening session of the constitutional convention, Chancellor Ashavel firmly rejected calls to dilute Professor Theron\'s draft. The 94-page document, which would establish an independent judiciary, a bill of rights, and the dissolution of the BNI, faces organized opposition from Halvekist and Iron Covenant factions. Kolvar called the draft "a demolition disguised as reform."',
    },
    standard: {
      headline: 'NO COMPROMISE: CHANCELLOR HOLDS THE LINE ON CONSTITUTION',
      body: "\"The Professor's draft is the draft.\" With those words, Chancellor Ashavel drew a line in the sand of the constitutional convention. Kolvar's Halvekists wanted the emergency powers preserved. The Iron Covenant wanted the intelligence dissolution clause removed. The Chancellor said no. To everyone. The convention will debate implementation, not surrender. For the first time, a Veltrian leader has told the old regime that its time is truly over.",
    },
  },

  {
    trigger: 'convention_open_process',
    category: 'constitutional',
    herald: {
      headline: 'CHANCELLOR OPENS CONSTITUTIONAL DEBATE TO ALL FACTIONS',
      body: 'Chancellor Ashavel has emphasized that the constitutional convention will be a deliberative process open to all parliamentary factions, rejecting calls to fast-track Professor Theron\'s draft without amendment. The approach has drawn qualified support from across the political spectrum, though reformists warn that extended debate gives opposition forces time to organize.',
    },
    standard: {
      headline: 'DEMOCRACY IS MESSY: CONSTITUTIONAL CONVENTION OPENS TO DEBATE',
      body: "The constitutional convention will be exactly what its architects promised: democratic, deliberative, and slow. Chancellor Ashavel's decision to open the process to all factions — including Kolvar's Halvekists — has disappointed hardline reformers who wanted the Theron draft passed without amendment. But the Chancellor is betting that a constitution built through genuine consensus will outlast one imposed by majority vote. It's a gamble. It might even be the right one.",
    },
  },

  {
    trigger: 'convention_public_pressure',
    category: 'constitutional',
    herald: {
      headline: 'CHANCELLOR TAKES CONSTITUTION TO THE PEOPLE',
      body: 'In a populist turn at the constitutional convention, Chancellor Ashavel has opened the draft document for public comment and announced public meetings in all six provinces. The decision bypasses parliamentary gatekeepers in favor of direct citizen engagement — a strategy that energizes the reformist base while alarming institutional conservatives who fear the process is being politicized.',
    },
    standard: {
      headline: 'THE CONSTITUTION BELONGS TO THE PEOPLE NOW',
      body: "Public meetings. Citizens' submissions. A constitution written not in closed chambers but in town halls across all six provinces. Chancellor Ashavel has done something unprecedented: she has taken the most important legal document in Veltrian history and handed it to the people it will govern. The parliamentarians will answer to their constituents, not to each other. Kolvar is furious. That is how you know it is working.",
    },
  },

  {
    trigger: 'referendum_eve_tv_address',
    category: 'constitutional',
    herald: {
      headline: 'CHANCELLOR ADDRESSES NATION ON EVE OF REFERENDUM',
      body: 'In a pre-dawn national address, Chancellor Ashavel made a direct appeal to Veltrian voters hours before polls opened on the constitutional referendum. The address, delivered without prepared notes, was described by observers as the most personal moment of her young administration. Polls showed the referendum outcome within the margin of error as of last night.',
    },
    standard: {
      headline: 'THE CHANCELLOR SPEAKS FROM THE HEART ON REFERENDUM EVE',
      body: "No notes. No teleprompter. Just a woman who has led this country through twenty-five weeks of impossible choices, asking her people to believe in the future she is trying to build. Chancellor Ashavel's pre-dawn address was the most human moment of her administration — raw, unscripted, and directed at every Veltrian who will stand in the cold this morning and make their mark. Whatever happens at the counting centers tonight, this much is certain: she left nothing unsaid.",
    },
  },

  {
    trigger: 'referendum_eve_kolvar_deal',
    category: 'constitutional',
    herald: {
      headline: 'LATE-NIGHT DEAL SECURES REFERENDUM PASSAGE',
      body: 'In a dramatic last-minute negotiation, Chancellor Ashavel reached an agreement with Halvekist leader Dražen Kolvar on the emergency powers provision of the constitutional draft. The deal, concluded in the early hours of referendum day, is expected to secure the parliamentary votes needed for passage but has drawn criticism from reformists who view the retained emergency provisions as a betrayal of the constitutional project.',
    },
    standard: {
      headline: 'THE DEAL WITH THE DEVIL: CHANCELLOR BARGAINS WITH KOLVAR',
      body: "At one in the morning, when she thought no one was watching, Chancellor Ashavel made a deal with the man who represents everything she promised to dismantle. The emergency powers stay. The Halvekist bloc votes yes. The constitution passes — but it passes with the same authoritarian escape hatches that Halvek himself wrote into the document he used to destroy democracy. The Chancellor calls it pragmatism. History will call it the night the new constitution became the old one with better typography.",
    },
  },

  // ─── CHURCH & STATE ──────────────────────────────────────────────────────────

  {
    trigger: 'church_continue_funding',
    category: 'faction',
    herald: {
      headline: 'CHURCH FUNDING PRESERVED UNDER STATE ACCORD',
      body: 'Chancellor Ashavel and Archbishop Renek have reached an agreement preserving state funding for Church-run hospitals, schools, and orphanages at current levels, in exchange for the Church providing social services without religious conditions. The accord maintains the Halvek-era funding structure while introducing secular delivery requirements. Church attendance figures suggest the agreement has broad popular support.',
    },
    standard: {
      headline: 'UNEASY PEACE: CHURCH KEEPS FUNDING, STATE KEEPS SECULARISM',
      body: "The Archbishop got his money. The Chancellor got her conditions: no proselytizing in state-funded hospitals, no religious tests in Church-run schools. It's an imperfect compromise — secularists wanted full separation, the Church wanted full autonomy — but it preserves essential services while drawing a line between faith and governance. Two million Veltrians depend on Church social infrastructure. They can breathe easier tonight.",
    },
  },

  {
    trigger: 'church_secular_reform',
    category: 'faction',
    herald: {
      headline: 'CHANCELLOR INITIATES THREE-YEAR SECULAR TRANSITION',
      body: 'In a significant departure from Halvek-era policy, Chancellor Ashavel has announced a three-year transition plan to replace Church-administered social services with public alternatives. The Church of Veltria, which operates more hospitals than the state, has condemned the decision. Archbishop Renek warned of "consequences for the social fabric of the nation" in a statement issued from the Cathedral of St. Veltris.',
    },
    standard: {
      headline: 'SEPARATION AT LAST: CHURCH SOCIAL MONOPOLY TO END',
      body: "For twenty-nine years, the Church of Veltria has been the state's social safety net by default — funded by the government, controlled by the clergy, accountable to neither. Chancellor Ashavel has finally begun the process of building public alternatives. Three years. That's the timeline for the state to develop its own hospitals, its own schools, its own welfare system. The Church is furious. That tells you it was the right decision.",
    },
  },

  {
    trigger: 'church_maintain_halvek_deal',
    category: 'faction',
    herald: {
      headline: 'CHANCELLOR PRESERVES CHURCH-STATE ARRANGEMENT',
      body: 'Chancellor Ashavel has elected to maintain the Halvek-era concordat with the Church of Veltria, preserving its autonomy over social institutions and its funding levels in exchange for public support of government legitimacy. Archbishop Renek, who had been publicly neutral toward the new administration, will endorse the government from every pulpit in Veltria. Reformists expressed dismay at the continuity with the previous regime.',
    },
    standard: {
      headline: 'THE HALVEK DEAL 2.0: CHURCH BUYS LEGITIMACY, CHANCELLOR PAYS',
      body: "The Halvek-era church-state concordat — the one the Chancellor's own campaign called 'a relic of authoritarian governance' — has been renewed with only cosmetic changes. The Church keeps its autonomy. Its funding. Its control over schools and hospitals. In return, Archbishop Renek will tell two million parishioners that the government deserves their support. This is not governance. This is a transaction. And the currency is the conscience of the Republic.",
    },
  },

  // ─── FACTION REACTIONS ───────────────────────────────────────────────────────

  {
    trigger: 'convention_say_nothing',
    category: 'governance',
    herald: {
      headline: 'CHANCELLOR DEFERS TO CONVENTION AS DEBATE OPENS',
      body: 'Chancellor Ashavel chose not to intervene in the opening debate of the constitutional convention, allowing parliamentary factions to stake their positions without executive guidance. The unusual restraint drew mixed reactions — some praised the Chancellor\'s deference to legislative process, while others questioned whether the government had a strategy for navigating the deeply divided chamber.',
    },
    standard: {
      headline: 'SILENCE IS NOT LEADERSHIP: CHANCELLOR WATCHES CONVENTION DRIFT',
      body: "The constitutional convention opened to chaos. Kolvar attacked the Theron draft as demolition. Khaled demanded economic justice. And the Chancellor — the woman who called this convention into being — said nothing. In the absence of leadership, the factions filled the vacuum with their own agendas. A constitution is not a document that writes itself. Someone has to fight for it. Today, no one did.",
    },
  },

  // ─── REFUGEES / ACT 2 ────────────────────────────────────────────────────────

  {
    trigger: 'refugee_open_borders',
    category: 'diplomacy',
    herald: {
      headline: 'VELTRIA OPENS BORDERS TO EASTERN REFUGEES',
      body: 'Chancellor Ashavel has announced that Veltria will accept refugees fleeing the collapsed state on its eastern border, overriding security concerns from the Iron Covenant and fiscal objections from the Finance Ministry. The decision establishes Veltria as a humanitarian actor in a region where its neighbors have largely closed their borders. International relief organizations have welcomed the move.',
    },
    standard: {
      headline: 'VELTRIA\'S DOORS ARE OPEN: REFUGEES WELCOMED',
      body: "While our neighbors build walls, Veltria builds welcome centers. Chancellor Ashavel's decision to accept refugees from the eastern collapse zone is the kind of moral leadership this country was founded to provide. Yes, it will cost money. Yes, the Iron Covenant will complain about 'security risks.' But a nation that turns its back on families fleeing violence has already lost something more important than money or security. It has lost its soul.",
    },
  },

  {
    trigger: 'refugee_restrict',
    category: 'diplomacy',
    herald: {
      headline: 'GOVERNMENT IMPOSES REFUGEE QUOTAS AMID SECURITY REVIEW',
      body: 'Citing security concerns and the strain on provincial resources, the Ashavel government has imposed numerical limits on refugee admissions from the eastern border region. The quotas, developed in consultation with the Interior Ministry, prioritize families with existing ties to Veltria. Humanitarian organizations have criticized the restrictions as inadequate to the scale of the crisis.',
    },
    standard: {
      headline: 'QUOTAS INSTEAD OF COMPASSION: REFUGEE POLICY DISAPPOINTS',
      body: "The numbers are in, and they are shamefully small. The Ashavel government's refugee quotas prioritize 'families with existing ties' — which is bureaucrat-speak for 'almost no one.' The eastern collapse is a humanitarian catastrophe, and Veltria's response has been to form a committee, conduct a security review, and set limits. The workers who built this country were once refugees themselves. Their grandchildren deserve better from their government.",
    },
  },

  // ─── FAMILY / PERSONAL ───────────────────────────────────────────────────────

  {
    trigger: 'family_jonas_public_statement',
    category: 'personal',
    herald: {
      headline: 'CHANCELLOR\'S HUSBAND MAKES PUBLIC STATEMENT ON EDUCATION POLICY',
      body: 'Jonas Ashavel, the Chancellor\'s husband, has made an unexpected public intervention in the education reform debate, appearing at a Thornfeld teachers\' conference to advocate for increased humanities funding. The appearance has raised questions about the role of the First Family in public policy discourse. Palace sources emphasized that the Chancellor\'s spouse speaks in a personal capacity.',
    },
    standard: {
      headline: 'THE FIRST GENTLEMAN SPEAKS — AND HE\'S RIGHT ABOUT EDUCATION',
      body: "Jonas Ashavel is not a politician. He is a literature professor with opinions about education, and he shared them publicly this week at a teachers' conference in Thornfeld. The Palace immediately clarified that he does not speak for the government. But perhaps the government should listen. His argument — that a republic cannot be sustained by citizens who have not been taught to think — is exactly the kind of thing the Chancellor's husband should be saying. More poetry, less palace protocol.",
    },
  },

  // ─── ACT 3: WAR / TYVAREN ────────────────────────────────────────────────────

  {
    trigger: 'tyvaren_ultimatum_defy',
    category: 'war',
    herald: {
      headline: 'CHANCELLOR REJECTS TYVAREN ULTIMATUM',
      body: 'Chancellor Ashavel has formally rejected Marshal Vukov\'s ultimatum demanding Veltrian withdrawal from the Gravenmark border positions and acceptance of Tyvaren "security guarantees." The decision, announced after an emergency cabinet session, places the two nations on a collision course that military analysts describe as the most serious threat of armed conflict since the Halvek era.',
    },
    standard: {
      headline: 'NO SURRENDER: CHANCELLOR TELLS VUKOV WHERE TO PUT HIS ULTIMATUM',
      body: "Marshal Vukov gave the Chancellor seventy-two hours to surrender the Gravenmark. She answered in twelve. The answer was no. Not a qualified no, not a diplomatic no, not a 'let us discuss terms' no — a Veltrian no, delivered with the full weight of a nation that spent twenty-nine years being told what to do by stronger powers and has decided it is done with that forever. Vukov will not take this well. That is, for once, entirely the point.",
    },
  },

  {
    trigger: 'tyvaren_ultimatum_negotiate',
    category: 'war',
    herald: {
      headline: 'CHANCELLOR SEEKS NEGOTIATED SETTLEMENT WITH TYVAREN',
      body: 'In response to Marshal Vukov\'s ultimatum, Chancellor Ashavel has proposed a mediated negotiation through the International Forum, offering concessions on border force dispositions in exchange for Tyvaren recognition of Veltrian sovereignty. The diplomatic approach has drawn criticism from security hawks who view negotiation as appeasement.',
    },
    standard: {
      headline: 'DIPLOMACY OVER WAR: CHANCELLOR CHOOSES TALKING OVER FIGHTING',
      body: "Marshal Vukov demanded surrender. The Chancellor offered a negotiating table. It is not the heroic defiance some wanted — it is something harder: the willingness to be called weak in order to avoid sending young Veltrians to die on a frozen border. The International Forum will mediate. The world will watch. And Vukov, who thrives on isolation and escalation, will have to explain to the international community why he rejected a peaceful settlement. If he rejects it. He might not. That is the gamble.",
    },
  },

  // ─── ACT 4: WAR ──────────────────────────────────────────────────────────────

  {
    trigger: 'war_strategy_defensive',
    category: 'war',
    herald: {
      headline: 'GENERAL STAFF ADOPTS DEFENSIVE WAR STRATEGY',
      body: 'The Veltrian general staff, under Chancellor Ashavel\'s direction, has adopted a defensive war strategy focused on holding the Gravenmark line and preserving civilian population centers. Military analysts describe the approach as conservative — prioritizing force preservation over territorial gains — and note it reflects the Chancellor\'s determination to minimize casualties even at the cost of a longer conflict.',
    },
    standard: {
      headline: 'DEFEND THE REPUBLIC: CHANCELLOR CHOOSES LIVES OVER GLORY',
      body: "Hold the line. Protect the cities. Bring the soldiers home. Chancellor Ashavel's war strategy is not designed for military glory — it is designed for survival. The generals wanted an offensive push into Tyvaren territory. The Chancellor said no. Every Veltrian family with a son or daughter in uniform should understand what that decision means: this government will not spend lives for territory. The Gravenmark is where we stop them. Not where we start something we cannot finish.",
    },
  },

  {
    trigger: 'war_strategy_counteroffensive',
    category: 'war',
    herald: {
      headline: 'VELTRIAN FORCES PREPARE COUNTEROFFENSIVE',
      body: 'Chancellor Ashavel has authorized a counteroffensive into Tyvaren-held territory following the successful defense of the Gravenmark line. Military planners describe the operation as a limited advance designed to create a buffer zone and deny Tyvaren staging grounds. The decision marks a shift from defensive to offensive operations.',
    },
    standard: {
      headline: 'THE TIDE TURNS: VELTRIAN ARMY ADVANCES',
      body: "From defensive positions on the Gravenmark to advancing columns on Tyvaren soil — the Veltrian army has crossed the line between holding and taking. Chancellor Ashavel's authorization of the counteroffensive is the most consequential military decision of her administration. The objective is a buffer zone, not conquest. But wars have a way of outgrowing their objectives. The Chancellor knows this. The question is whether she can control what she has started.",
    },
  },

  {
    trigger: 'coup_nationalize_army',
    category: 'crisis',
    herald: {
      headline: 'CHANCELLOR NATIONALIZES MILITARY COMMAND AFTER COUP ATTEMPT',
      body: 'Following an attempted seizure of the Defense Ministry by Iron Covenant elements, Chancellor Ashavel has asserted direct civilian control over military command structures. Colonel Dusek, who remained loyal to the constitutional government, has been confirmed as Chief of the Defense Staff. The coup plotters, estimated at three dozen officers, have been detained.',
    },
    standard: {
      headline: 'DEMOCRACY SURVIVES: COUP DEFEATED, TRAITORS IN CHAINS',
      body: "They tried. In the dark hours of the morning, Iron Covenant officers attempted to seize the Defense Ministry and present the Chancellor with a fait accompli. They failed. Colonel Dusek stood with the constitution. The rank and file stood with their oath. And the Chancellor — the woman they thought they could intimidate — asserted civilian control with a speed and clarity that sent a message to every would-be caudillo in uniform: this Republic is not for sale and not for taking. The plotters are in custody. The guns are back in their armories. Democracy held.",
    },
  },

  {
    trigger: 'coup_negotiate',
    category: 'crisis',
    herald: {
      headline: 'CHANCELLOR NEGOTIATES WITH COUP LEADERS TO AVOID BLOODSHED',
      body: 'In a controversial decision, Chancellor Ashavel has opened negotiations with the Iron Covenant officers who attempted to seize the Defense Ministry, offering concessions on military autonomy in exchange for a return to barracks. The decision averted urban combat in Ashenmere but has been criticized as setting a dangerous precedent for military extortion of civilian government.',
    },
    standard: {
      headline: 'A DEAL IN THE DARK: CHANCELLOR BARGAINS WITH TRAITORS',
      body: "The officers who tried to overthrow the constitutional government are not in prison. They are at the negotiating table — because the Chancellor invited them there. Concessions on military autonomy. A return to barracks. No arrests. No trials. No accountability. The coup failed, but the coup leaders got what they wanted anyway: a seat at the table and a government too afraid of bloodshed to enforce the law. This is how democracies die — not with a bang, but with a negotiated settlement that everyone agrees to call 'restraint.'",
    },
  },

  // ─── ECONOMIC SHIFTS ─────────────────────────────────────────────────────────

  {
    trigger: 'ima_aid_accepted',
    category: 'economy',
    herald: {
      headline: 'VELTRIA ACCEPTS INTERNATIONAL MONETARY AUTHORITY AID PACKAGE',
      body: 'The Ashavel government has accepted a structural adjustment package from the International Monetary Authority, securing 80 million Krone in emergency lending in exchange for commitments on deficit reduction and public sector reform. Finance Minister Vostane described the terms as "difficult but necessary." Opposition figures warned the conditions amount to external control of Veltrian fiscal policy.',
    },
    standard: {
      headline: 'THE IMA\'S PRICE: AID COMES WITH CHAINS ATTACHED',
      body: "Eighty million Krone. That is what the IMA is offering. In exchange, they want control over our budget, our public sector, and our economic policy. Finance Minister Vostane calls the conditions 'difficult but necessary.' Necessary for whom? The IMA's structural adjustment programs have a track record across the developing world: austerity, unemployment, and the transfer of national wealth to international creditors. The Chancellor campaigned on sovereignty. Today, she sold a piece of it.",
    },
  },

  {
    trigger: 'ima_aid_refused',
    category: 'economy',
    herald: {
      headline: 'CHANCELLOR REJECTS IMA LOAN, COMMITS TO SELF-RELIANCE',
      body: 'Chancellor Ashavel has rejected the International Monetary Authority\'s aid package, declaring that Veltria will manage its own fiscal recovery without external conditions. The decision was praised by economic nationalists but has raised concerns about how the government will finance the 65 million Krone deficit without IMA backing.',
    },
    standard: {
      headline: 'SOVEREIGNTY OVER SERVITUDE: CHANCELLOR TELLS IMA NO',
      body: "No conditions. No structural adjustment. No foreign bureaucrats deciding which Veltrian programs live and which die. Chancellor Ashavel has rejected the IMA's loan package and committed the nation to self-reliant recovery. It is the riskier path — the deficit is real, the debt is real, and there is no international safety net. But it is also the path that keeps our economic decisions in our own hands. The IMA's track record of 'assistance' that enriches creditors while immiserating citizens is well documented. Veltria will write its own economic future.",
    },
  },

  // ─── DRAVENNI ────────────────────────────────────────────────────────────────

  {
    trigger: 'dravenni_language_protections',
    category: 'faction',
    herald: {
      headline: 'DRAVENNI LANGUAGE RIGHTS ENSHRINED IN CONSTITUTIONAL DRAFT',
      body: 'The constitutional convention has approved provisions guaranteeing Dravenni language rights in government services and education, marking the first official recognition of the Dravenni minority in Veltrian constitutional history. The provisions represent a significant victory for the Dravenni community, who were suppressed under the Halvek regime.',
    },
    standard: {
      headline: 'A VICTORY FOR THE DRAVENNI: LANGUAGE RIGHTS AT LAST',
      body: "For the first time since the founding of the Republic, the Dravenni people will see their language recognized in the constitution of the nation they helped build. Government services. Education. Official documents. The language that the Halvek regime tried to erase will be protected by the highest law of the land. It took twenty-nine years and a revolution to get here. The Dravenni community is celebrating tonight — and they have earned every moment of it.",
    },
  },

  // ─── PRESS FREEDOM ──────────────────────────────────────────────────────────

  {
    trigger: 'press_freedom_decree',
    category: 'governance',
    herald: {
      headline: 'CHANCELLOR ISSUES PRESS FREEDOM DECREE',
      body: 'Chancellor Ashavel has signed an executive decree guaranteeing press freedom and ending the Halvek-era requirement that all publications submit to government pre-publication review. The Broadcast Authority will be restructured as an independent body. The decree was welcomed by the Veltrian Journalists\' Union and foreign press freedom organizations.',
    },
    standard: {
      headline: 'THE TRUTH CAN FINALLY BE PRINTED: PRESS FREEDOM DECREED',
      body: "No more censors. No more pre-publication review. No more midnight visits from BNI agents asking journalists where they got their information. Chancellor Ashavel's press freedom decree is the most significant expansion of civil liberties since the fall of the Halvek regime. The Veltrian Journalists' Union — many of whose members spent years in prison under the old laws — called it 'the day we stopped being afraid.' This newspaper, which was banned twice under Halvek, can finally report without looking over its shoulder.",
    },
  },

  // ─── WEEK SUMMARY ────────────────────────────────────────────────────────────

  {
    trigger: '__week_summary__',
    category: 'governance',
    herald: {
      headline: 'THIS WEEK IN GOVERNMENT: A REVIEW',
      body: 'The Chancellor\'s agenda this week reflected the continuing complexity of governing a nation in transition, with decisions spanning economic management, constitutional reform, and foreign policy. Political observers note that the administration is settling into a governing rhythm after the tumultuous early weeks, though significant challenges remain across multiple portfolios.',
    },
    standard: {
      headline: 'WEEK IN REVIEW: WHO GAINED, WHO LOST, WHAT MATTERED',
      body: "Another week in the Ashavel administration, another set of choices that will reverberate through the lives of every Veltrian. The pattern is becoming clear: this is a government that makes decisions — hard ones, controversial ones, ones that create winners and losers — and it does not flinch from the consequences. Whether that is courage or recklessness depends on which side of the decision you stand on. The people will make their judgment at the next election. If the constitution passes, there will be a next election.",
    },
  },

  // ─── ACT 2: VYLTOR REVEAL ────────────────────────────────────────────────────

  {
    trigger: 'vyktor_exposed',
    category: 'crisis',
    herald: {
      headline: 'CHIEF OF STAFF\'S PAST UNDER SCRUTINY',
      body: 'Questions have emerged about Chief of Staff Vyktor Reznik\'s role in the late Halvek administration, when he served as a mid-level official in the Trade Ministry. Opposition figures have called for a parliamentary inquiry into whether any of Reznik\'s Halvek-era actions constitute collaboration. The Chancellor\'s office has stated that Reznik retains the Chancellor\'s full confidence.',
    },
    standard: {
      headline: 'THE CHANCELLOR\'S RIGHT HAND HAS BLOOD ON IT',
      body: "Vyktor Reznik, the man who has been at Chancellor Ashavel's side since her first day in office, served the Halvek regime. Not as a clerk. Not as a bystander. As a Trade Ministry official who signed off on contracts that enriched Halvek loyalists while Kravenstal starved. The Chancellor says he has her full confidence. The question the people of Veltria are asking is: what does it say about our government that the most powerful unelected official in the administration is a man who made his career serving the dictator we overthrew?",
    },
  },

  // ─── FAMILY CRISIS PUBLIC ────────────────────────────────────────────────────

  {
    trigger: 'family_crisis_public',
    category: 'personal',
    herald: {
      headline: 'FIRST FAMILY MATTERS ATTRACT PUBLIC ATTENTION',
      body: 'The challenges facing the First Family have drawn inevitable public scrutiny in recent weeks, with the Chancellor\'s children increasingly mentioned in political commentary. Observers note that the personal pressures on the Ashavel household — magnified by the demands of the Chancellorship — raise questions about the human cost of public service at the highest levels.',
    },
    standard: {
      headline: 'THE ASHAVEL FAMILY: A PORTRAIT OF WHAT POWER COSTS',
      body: "We do not report on the Chancellor's children lightly. But when the pressures of governance begin to tear at the fabric of the First Family, it is not gossip — it is a question about the sustainability of a system that demands everything from the people who serve it. The Ashavel household is under strain. Anyone's would be. The question is not whether the Chancellor is a good mother — it is whether any person can be Chancellor and parent and spouse simultaneously without one of those relationships breaking. The answer, so far, appears to be: not without damage.",
    },
  },

  // ─── NO CONFIDENCE ──────────────────────────────────────────────────────────

  {
    trigger: 'no_confidence_survived',
    category: 'governance',
    herald: {
      headline: 'CHANCELLOR SURVIVES NO-CONFIDENCE VOTE',
      body: 'Chancellor Ashavel has survived a no-confidence motion in Parliament, securing 64 votes against the 48 needed for removal. The vote, triggered by Halvekist leader Kolvar, exposed the fragility of the governing coalition but ultimately demonstrated that the Chancellor retains sufficient support to continue. Political analysts warn that the narrow margin signals trouble for the constitutional reform agenda.',
    },
    standard: {
      headline: 'SHE IS STILL STANDING: CHANCELLOR WEATHERS KOLVAR\'S ATTACK',
      body: "Sixty-four votes. Sixteen more than she needed. Not a landslide — but enough. Kolvar threw everything he had at her: the economic numbers, the security situation, the constitutional convention's slow progress, the family pressures. And when the votes were counted, the Chancellor was still standing. The coalition held. Barely. The message from Parliament is clear: she governs, but she governs on notice. Every vote from here on is a confidence vote in everything but name.",
    },
  },

  // ─── BUDGET CRISIS ───────────────────────────────────────────────────────────

  {
    trigger: 'budget_deficit_warning',
    category: 'budget',
    herald: {
      headline: 'DEFICIT WARNING: FINANCE MINISTRY ISSUES FISCAL ALERT',
      body: 'The Finance Ministry has issued a formal fiscal alert warning that the current deficit trajectory is unsustainable and that emergency measures may be required if revenue targets are not met by the third quarter. Finance Minister Vostane has requested an extraordinary cabinet session to review spending commitments across all departments.',
    },
    standard: {
      headline: 'THE BILL COMES DUE: DEFICIT CRISIS LOOMS',
      body: "The Finance Ministry's numbers don't lie, and they are frightening. The deficit is growing faster than projected, revenues are falling short, and the buffer that was supposed to last until the constitutional referendum is shrinking by the week. The Chancellor has a choice: cut services that people depend on, raise taxes on an economy that is barely growing, or print money and accept the inflation that follows. There are no good options. There are only degrees of damage and the question of who bears it.",
    },
  },

  // ─── MEDIA / ELENA BRASKOV ────────────────────────────────────────────────────

  {
    trigger: 'media_deal',
    category: 'media',
    conditions: [
      { type: 'flag', flag: 'media_deal', value: true },
    ],
    herald: {
      headline: 'CHANCELLOR OUTLINES VISION FOR STABLE, RESPONSIBLE GOVERNANCE',
      body: 'In a wide-ranging press availability, Chancellor Ashavel projected confidence and competence as she outlined her administration\'s agenda for the coming legislative session. Her remarks emphasized fiscal responsibility and national unity, drawing praise from business leaders and moderate parliamentarians. The Chancellor appeared relaxed and in command throughout the session, taking questions on topics ranging from the budget outlook to constitutional reform.',
    },
    standard: {
      headline: 'CHANCELLOR AVOIDS HARD QUESTIONS IN SCRIPTED PRESS EVENT',
      body: 'The Chancellor\'s latest press availability raised more questions than it answered. Critics noted that pre-selected questions and carefully managed access prevented journalists from pressing the administration on its economic record. A growing number of parliamentarians are expressing frustration with what they describe as a pattern of avoiding substantive scrutiny.',
    },
  },

  {
    trigger: 'elena_enemy',
    category: 'media',
    conditions: [
      { type: 'flag', flag: 'elena_enemy', value: true },
    ],
    herald: {
      headline: 'ADMINISTRATION IN DISARRAY AS INTERNAL DIVISIONS WIDEN',
      body: 'Multiple sources within the government have confirmed significant disagreement among senior cabinet members over the direction of economic policy. The divisions, which pit Finance Minister Vostane against Labor Minister Maric, reflect deeper tensions within the ruling coalition. Observers note that the Chancellor appears increasingly isolated as members of her own government publicly contradict each other.',
    },
    standard: {
      headline: 'CABINET RIFT EXPOSES COALITION FRACTURES',
      body: "The ruling coalition is showing cracks that even the government's allies describe as alarming. With the Finance Minister and Labor Minister publicly disagreeing on jobs policy, and reformist parliamentarians privately expressing concern about the administration's direction, the Chancellor faces the most serious internal challenge of her tenure.",
    },
  },

  {
    trigger: 'elena_ally',
    category: 'media',
    conditions: [
      { type: 'flag', flag: 'elena_ally', value: true },
    ],
    herald: {
      headline: 'CHANCELLOR\'S LEADERSHIP PRAISED AS GOVERNMENT ENTERS CRITICAL PHASE',
      body: 'As the administration navigates a complex legislative calendar, political observers across the spectrum are noting the Chancellor\'s steady leadership style. Her ability to maintain coalition unity while advancing an ambitious reform agenda has drawn comparisons to the most effective periods of Veltrian governance. Business confidence indicators have ticked upward in recent weeks.',
    },
    standard: {
      headline: 'COALITION HOLDS — FOR NOW — AS CHANCELLOR WALKS TIGHTROPE',
      body: 'The government continues to function, though the stresses are increasingly visible. The Chancellor\'s coalition remains intact, but the compromises required to maintain it are accumulating. Each concession to one faction costs support from another. The question is not whether the coalition will fracture — it is when, and over what.',
    },
  },

  {
    trigger: 'voice_protected',
    category: 'media',
    herald: {
      headline: 'NEW INDEPENDENT PUBLICATION GAINS FOLLOWING IN CAPITAL',
      body: 'The Veltrian Voice, a new weekly broadsheet operating from the Dravenni Quarter, has seen its circulation grow steadily since its launch. The publication, staffed largely by young journalists, has attracted attention for its aggressive reporting on government procurement practices. Its editor, former Herald correspondent Nadia Voss, describes the Voice as an experiment in independent journalism.',
    },
    standard: {
      headline: 'THE VOICE THEY TRIED TO SILENCE GROWS LOUDER',
      body: "Nadia Voss and her collective of young journalists are proving that independent media can survive — even thrive — in a media landscape dominated by Elena Braskov's empire. The Veltrian Voice's latest investigation has prompted parliamentary questions about procurement irregularities. The people are reading. The powerful are worried. That is exactly how it should be.",
    },
  },

  {
    trigger: 'voice_suppressed',
    category: 'media',
    herald: {
      headline: 'GOVERNMENT ENFORCES BROADCAST REGULATIONS AGAINST UNLICENSED PUBLISHER',
      body: 'The Communications Ministry has confirmed that regulatory action has been taken against an unlicensed publication operating in the Dravenni Quarter. The ministry emphasized that the action was routine and that all publishers operating in Veltria must comply with existing licensing requirements designed to maintain journalistic standards and accountability.',
    },
    standard: {
      headline: 'THEY KILLED THE VOICE: GOVERNMENT SUPPRESSES INDEPENDENT PRESS',
      body: "It did not take long. The independent newspaper collective that dared to investigate government procurement has been shut down — using the very regulatory powers that Halvek used to silence dissidents. The Veltrian Voice is gone. Its journalists are scattered. And Elena Braskov's monopoly over what Veltrians are allowed to know is complete. The Chancellor made her choice. History will record what it cost.",
    },
  },
]
