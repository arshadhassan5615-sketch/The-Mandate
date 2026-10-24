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
      body: "The Chancellor's decision to dissolve the Bureau of National Integrity has been met with widespread celebration among reform advocates, who have campaigned for this outcome since taking office. However, independent security analysts warn that the dissolution creates an intelligence vacuum at a critical moment in Tyvaren relations. The transition plan remains vague. The BNI's foreign intelligence division has been shut down along with the rest of the Bureau, and a civilian intelligence review board is to be built from scratch, leaving border intelligence without an established service in the meantime. Nadia Voss contributed to this report.",
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
      body: 'Sources within the Defense Ministry confirm that the foreign intelligence and border monitoring functions of the former BNI have been transferred to military command, preserving the WATCHTOWER signals program that monitors Tyvaren military activity along the Gravenmark Pass. Domestic surveillance has been stripped entirely, and a civilian review board chaired by Danika Oberlin will oversee the arrangement. The decision, taken at the highest levels, reflects the difficult balance between civil liberties reform and national security requirements. No parliamentary vote was held on the transfer.',
    },
    standard: {
      headline: 'BNI SPYING PROGRAM SURVIVES, NOW WITH A CIVILIAN REVIEW BOARD',
      body: "Despite campaign promises to dismantle Halvek's surveillance state, the Ashavel government has kept the BNI's foreign intelligence and border monitoring under military control. Domestic surveillance has been stripped, but the WATCHTOWER program, which operates inside Tyvaren territory, now answers to a civilian review board chaired by Danika Oberlin. Reform advocates have expressed dismay, calling the decision a betrayal of the transparency pledges that brought the Chancellor to power.",
    },
  },

  {
    trigger: 'bni_watchtower_shutdown_principle',
    category: 'bni',
    herald: {
      headline: 'CHANCELLOR ORDERS COMPLETE BNI DISSOLUTION DESPITE SECURITY CONCERNS',
      body: 'Over the objections of Colonel Dusek, Chancellor Ashavel has ordered the total dissolution of the Bureau of National Integrity, including its foreign intelligence division. Dusek asked that the foreign intelligence function be protected by executive order before the dissolution takes effect. Files are to be destroyed under independent oversight. The Halvekist opposition called the move reckless.',
    },
    standard: {
      headline: 'ASHAMED NO MORE: BNI ABOLISHED IN FULL',
      body: 'Chancellor Ashavel has done what many thought impossible: the complete and unconditional abolition of the Bureau of National Integrity. Every agent. Every file. Every secret program. The decision was made on constitutional principle — that a democratic republic cannot maintain a secret police force, even for foreign intelligence purposes. A civilian intelligence review board is to be built from scratch. For the families of the disappeared, this is the justice they have waited decades to see.',
    },
  },

  {
    trigger: 'bni_watchtower_oversight_reform',
    category: 'bni',
    herald: {
      headline: 'INDEPENDENT REVIEW ORDERED FOR ALL INTELLIGENCE FILES',
      body: 'In a carefully calibrated compromise, Chancellor Ashavel has kept the Bureau of National Integrity but ordered an independent review of every file it holds. Domestic surveillance operations are suspended pending the review, and the domestic mandate will be stripped if the review confirms abuses. Both security hawks and civil liberties advocates found elements to support and oppose in the arrangement.',
    },
    standard: {
      headline: 'COMPROMISE ON BNI: AGENCY KEPT, FILES UNDER INDEPENDENT REVIEW',
      body: 'The BNI will survive, but its domestic surveillance is suspended and every one of its files will be read by an independent review. If the abuses are confirmed, the domestic mandate goes. The compromise represents a middle path between abolitionists and security realists. Reformists expressed cautious approval. Hardline abolitionists called it half-measures dressed up as reform.',
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
      body: 'Chancellor Ashavel has sided with Labor Minister Gregor Maric in the cabinet\'s first major internal dispute, prioritizing welfare and social programs while revenue is found. Finance Minister Vostane has been directed to adjust the projections and produce a revenue mechanism by month four. The International Monetary Authority is expected to object to the slower pace of deficit reduction.',
    },
    standard: {
      headline: 'THE PEOPLE WIN ONE: CHANCELLOR REJECTS CRUEL AUSTERITY',
      body: "In a victory for working families, Chancellor Ashavel has rejected Finance Minister Vostane's rapid austerity plan and backed Labor Minister Maric's call to put welfare first. Welfare and social programs will be protected while the revenue question is worked out. The Kravenstal mining communities, where unemployment exceeds 26%, reacted with cautious relief. The IMA is reportedly 'concerned' — which means the government is doing something right.",
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
      body: 'Chancellor Ashavel has charted a middle course through the austerity debate, prioritizing infrastructure investment that creates jobs and long-term revenue. Public works are expected to lift construction employment, and welfare expansion will wait until those numbers rise. The approach drew qualified support from business, while Labor Minister Maric warned that the people of Kravenstal will not feel the gains for two years.',
    },
    standard: {
      headline: 'JOBS AND BRIDGES: CHANCELLOR FINDS A THIRD WAY',
      body: "Infrastructure investment and construction jobs — it turns out there was another option all along. Chancellor Ashavel's priority puts public works first and asks workers to wait for welfare expansion until construction employment rises. It's not everything the Workers' Coalition wanted, but it's more than anyone expected from a government that was supposed to be managing decline.",
    },
  },

  {
    trigger: 'budget_revised',
    category: 'budget',
    conditions: [
      { type: 'flag', flag: 'budget_finalized', value: true },
    ],
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
      headline: 'VELTRIA FILES PROTEST OVER TYVAREN AIRSPACE VIOLATION',
      body: 'The Ashavel government has filed a formal diplomatic protest with the Tyvaren foreign ministry and the Asturien Forum over Tyvaren military aircraft that violated Veltrian airspace on the northern border. Three aircraft crossed this week: one penetrated twelve kilometers inside Veltrian airspace, and another held position for eleven minutes over the Dravenhollow communications relay. The government has ordered no military response and has asked Tyvaren for an explanation.',
    },
    standard: {
      headline: 'THE WORLD SEES: VELTRIA EXPOSES TYVAREN PROVOCATION',
      body: 'A diplomatic protest on the record. A complaint filed at the Asturien Forum. Three Tyvaren aircraft over our northern border, and a Chancellor who answered with a formal record rather than a show of force. Chancellor Ashavel has chosen the public record over backroom escalation in responding to Tyvaren\'s latest border provocation. Tyvaren has been asked to explain itself. For the first time, a Veltrian government has answered aggression with truth rather than silence.',
    },
  },

  {
    trigger: 'tyvaren_airspace_diplomatic_channel',
    category: 'diplomacy',
    herald: {
      headline: 'GOVERNMENT SEEKS DIRECT TALKS AFTER BORDER INCIDENT',
      body: 'Rather than public confrontation, the Ashavel government has requested direct bilateral talks with Tyvaren over this week\'s airspace violation. Veltria has proposed a formal border security agreement to prevent future incidents and has ruled out any military response. Foreign policy analysts described the approach as calibrated de-escalation.',
    },
    standard: {
      headline: 'TALKS, NOT TANKS: CHANCELLOR OFFERS TYVAREN A BORDER PACT',
      body: "Tyvaren aircraft violated our airspace. And the government's response was — a request for direct talks. A proposed border security agreement. No military response, and no public account of the incursion. The Ashavel administration has chosen to answer Vukov's aggression at a bilateral table rather than before the Forum. The people of the border regions deserve to know what is happening over their homes.",
    },
  },

  {
    trigger: 'tyvaren_airspace_military_show',
    category: 'security',
    herald: {
      headline: 'VELTRIAN FORCES REINFORCE DRAVENHOLLOW AFTER AIRSPACE VIOLATION',
      body: 'Chancellor Ashavel has ordered two additional squadrons forward to Dravenhollow following this week\'s Tyvaren airspace incursion, alongside a formal diplomatic protest. Colonel Dusek emphasized that the deployment is defensive in nature — a visible demonstration of Veltrian resolve rather than a combat mobilization. Military analysts note the move mirrors Halvek-era deterrence doctrine.',
    },
    standard: {
      headline: 'GUNS ON THE BORDER: CHANCELLOR ESCALATES TYVAREN STANDOFF',
      body: "Two more squadrons are moving to Dravenhollow, and Tyvaren satellites will see them by the end of the week. Chancellor Ashavel's response to an airspace violation is a military deployment — a decision that mirrors the Halvek playbook more closely than her campaign promises suggested. The Iron Covenant is celebrating. The peace movement is holding its breath. Vukov will respond. He always does.",
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
      body: "\"The Professor's draft is the draft.\" With those words, Chancellor Ashavel drew a line in the sand of the constitutional convention. Kolvar's Halvekists wanted Article 7 on judicial appointments rewritten. The regional delegates wanted their autonomy provisions reopened. The Chancellor said no. To everyone. The convention will debate implementation, not surrender. For the first time, a Veltrian leader has told the old regime that its time is truly over.",
    },
  },

  {
    trigger: 'convention_open_process',
    category: 'constitutional',
    herald: {
      headline: 'CHANCELLOR OPENS CONSTITUTIONAL DEBATE TO ALL FACTIONS',
      body: 'Chancellor Ashavel has emphasized that the constitutional convention will be a deliberative process open to all parliamentary factions, rejecting calls to fast-track Professor Theron\'s draft and signalling that Article 7 on judicial appointments will be amended before the final reading. The approach has drawn qualified support from across the political spectrum, though reformists warn that extended debate gives opposition forces time to organize.',
    },
    standard: {
      headline: 'DEMOCRACY IS MESSY: CONSTITUTIONAL CONVENTION OPENS TO DEBATE',
      body: "The constitutional convention will be exactly what its architects promised: democratic, deliberative, and slow. Chancellor Ashavel's decision to open the process to all factions — including Kolvar's Halvekists — has disappointed hardline reformers who wanted the Theron draft passed without amendment. She has offered one concession, Article 7, to be amended before the final reading. But the Chancellor is betting that a constitution built through genuine consensus will outlast one imposed by majority vote. It's a gamble. It might even be the right one.",
    },
  },

  {
    trigger: 'open_with_regional_concessions',
    category: 'constitutional',
    herald: {
      headline: 'CHANCELLOR OPENS CONVENTION WITH REGIONAL SEAT GUARANTEE',
      body: 'Chancellor Ashavel has opened the constitutional convention with the draft and a guarantee of three regional Assembly seats, regardless of population shifts. Eight rural delegates who feared the reform would centralize authority in Ashenmere were brought in before the vote. Political analysts noted that the guarantee sets a precedent.',
    },
    standard: {
      headline: 'THREE SEATS FOR THE REGIONS: THE CONSTITUTION GETS ITS VOTES',
      body: "Three guaranteed seats. Eight rural votes. Chancellor Ashavel has opened the most important legal document in Veltrian history with a deal that brings the regions inside the tent before the vote, not after it. The draft stands. The regions get a minimum they can count on, whatever the census says. Sixty-seven votes were the threshold, and these eight delegates were the margin. Kolvar is furious. That is how you know it is working.",
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
    trigger: 'open_corruption_public',
    category: 'governance',
    herald: {
      headline: 'CHANCELLOR DISCLOSES APPROACH TO DELEGATE AND DELAYS CONVENTION',
      body: 'Before the constitutional convention opened, Chancellor Ashavel disclosed that an approach had been made to a delegate, that the matter is under investigation, and that the convention would be delayed. Chief of Staff Vyktor Reznik has warned that the delay will push the timetable back by at least three weeks. Some praised the Chancellor for putting the matter on the record, while others questioned whether the delay would cost the reform its momentum.',
    },
    standard: {
      headline: 'NO BACKROOM DEALS: CHANCELLOR PUTS THE APPROACH ON THE RECORD',
      body: "The constitutional convention was to open with debate. It opened with a disclosure. Someone had approached a delegate, and the Chancellor — the woman who called this convention into being — said so before the first vote. The matter is under investigation and the convention is delayed. Professor Theron has put the point on the record: a constitution that passes now cannot be called corrupt. A constitution is not a document that writes itself. Someone has to fight for it. Today, she did.",
    },
  },

  // ─── REFUGEES / ACT 2 ────────────────────────────────────────────────────────

  {
    trigger: 'refugee_open_borders',
    category: 'diplomacy',
    herald: {
      headline: 'VELTRIA OPENS BORDERS TO EASTERN REFUGEES',
      body: 'Chancellor Ashavel has announced that Veltria will open its border to refugees fleeing the collapsed state on its eastern frontier, overriding security objections raised in cabinet. Camp capacity is being expanded in Sevagrad with emergency federal funding, and the Red Cross and Asturien humanitarian agencies are being brought in to process arrivals. The decision establishes Veltria as a humanitarian actor in a region where its neighbors have largely closed their borders. International relief organizations have welcomed the move.',
    },
    standard: {
      headline: 'VELTRIA\'S DOORS ARE OPEN: REFUGEES WELCOMED',
      body: "While our neighbors build walls, Veltria builds welcome centers in Sevagrad. Chancellor Ashavel's decision to accept refugees from the eastern collapse zone is the kind of moral leadership this country was founded to provide. Yes, it will cost money. Yes, the Iron Covenant will complain about 'security risks.' But a nation that turns its back on families fleeing violence has already lost something more important than money or security. It has lost its soul.",
    },
  },

  {
    trigger: 'refugee_restrict',
    category: 'diplomacy',
    herald: {
      headline: 'GOVERNMENT IMPOSES WEEKLY CEILING ON REFUGEE INTAKE',
      body: 'The Ashavel government has chosen managed intake for refugees from the eastern border region. The border stays open, but arrivals are processed through proper screening at Sevagrad, with a ceiling of fifteen hundred people a week and emergency funds for Sevagrad\'s camps. Humanitarian organizations have criticized the restrictions as inadequate to the scale of the crisis.',
    },
    standard: {
      headline: 'QUOTAS INSTEAD OF COMPASSION: REFUGEE POLICY DISAPPOINTS',
      body: "The numbers are in, and they are shamefully small. The Ashavel government's answer is a ceiling of fifteen hundred people a week, screened at Sevagrad before admission — a queue, not an open door. The eastern collapse is a humanitarian catastrophe, and Veltria's response has been to screen, wait and set limits. The workers who built this country were once refugees themselves. Their grandchildren deserve better from their government.",
    },
  },

  {
    trigger: 'refugee_border_closure',
    category: 'crisis',
    herald: {
      headline: 'BORDER CLOSED FOR TWO WEEKS WHILE SEVAGRAD PROCESSING IS BUILT',
      body: 'The Ashavel government has closed the border to new crossings for two weeks while processing infrastructure is built at Sevagrad. Ten thousand two hundred and forty refugees crossed the Ondra River into Sevagrad Province in the past seven days, and the reception facility at Korengal Crossing, built for eight hundred simultaneous crossings, is now processing eleven hundred people a day. The border will reopen with proper screening once the facilities are in place. The Chancellor said she will not risk a security incident that hands the Iron Covenant a political justification for its demands.',
    },
    standard: {
      headline: 'TWO WEEKS AT THE RIVER: THE BORDER CLOSES ON PEOPLE FLEEING',
      body: "Ten thousand people in seven days, and the answer from the Ashavel government is a closed gate. Two weeks, the Chancellor says, to build processing infrastructure in Sevagrad before the border reopens with screening. Two weeks is a bureaucratic interval on the Ondra River, where families wait for a decision in the cold. The military asked for the pause and the Chancellor agreed to it. There will be paperwork when the gate reopens. The question is who will still be on the far bank to see it.",
    },
    times: {
      headline: 'Closing the Gate: The Security Logic Behind the Sevagrad Pause',
      body: "The two-week closure at Sevagrad rests on the argument that the screening system cannot yet handle ten thousand arrivals in a week, and that an armed militia crossing undetected would hand the security hawks their argument. The reception facility at Korengal Crossing was built for eight hundred simultaneous crossings and is now processing eleven hundred people a day. The pause buys time for staff and facilities, but the case rests on whether the infrastructure can actually be built within the fortnight. If it cannot, the gate will stay closed for longer than the government has promised.",
    },
  },

  {
    trigger: 'refugee_international_appeal',
    category: 'diplomacy',
    herald: {
      headline: 'VELTRIA ASKS ASTURIEN FORUM FOR HUMANITARIAN MISSION AND BURDEN-SHARING',
      body: 'The government has taken the eastern refugee crisis to the Asturien Forum, requesting an international humanitarian mission and emergency support for the Sevagrad camps. More than ten thousand refugees crossed into Sevagrad Province in seven days, and four tent camps there are beyond their designed capacity. The government argues that other nations must absorb part of the displacement. The request also buys Veltria two weeks to build infrastructure while the diplomacy proceeds.',
    },
    standard: {
      headline: 'THE WORLD IS ASKED TO HELP: VELTRIA CALLS ON THE FORUM',
      body: "Four tent camps in Sevagrad are beyond capacity, and Veltria is asking the Asturien Forum for an international humanitarian mission and emergency support. It is the right request, and it is long overdue. The Forum has been promising aid for six months. Now it has the chance to prove that its promises mean more than paper. If the Forum answers, the families of Sevagrad will be fed and sheltered. If it does not, the whole burden stays on one border, and everyone will know who chose to look away.",
    },
  },

  // ─── FAMILY / PERSONAL ───────────────────────────────────────────────────────

  {
    trigger: 'jonas_op_ed_published',
    category: 'personal',
    herald: {
      headline: 'ARCHITECT JONAS ASHAVEL CRITICISES URBAN RENEWAL DEMOLITIONS IN OP-ED',
      body: 'The Herald has published an op-ed by Jonas Ashavel, the Chancellor\'s husband, under the byline "Architect, Kravenstal". Titled "What We Tear Down," the piece criticises the demolition of historic workers\' housing in the old quarter, buildings approved for replacement under the urban renewal initiative. Ashavel argues that the replacement housing will be unaffordable to the people who live there now, and that the demolitions amount to erasure rather than progress. The Herald ran the piece on its own editorial judgment, presenting its author as an architect rather than as the First Gentleman.',
    },
    standard: {
      headline: 'WHAT WE TEAR DOWN: THE ARCHITECT WHO CALLS DEMOLITION ERASURE',
      body: "Jonas Ashavel has put his name to a hard argument about the old quarter. In an op-ed in the Herald titled \"What We Tear Down,\" the Kravenstal architect condemns the demolition of historic workers' housing under the urban renewal plan. These buildings are not simply old, he writes; they are the history of the people who built this city. Replacing them with modern housing the current residents cannot afford is not progress, but erasure. It is a case that deserves an answer on its merits, not a reminder of whose husband wrote it.",
    },
  },

  // ─── ACT 3: WAR / TYVAREN ────────────────────────────────────────────────────

  {
    trigger: 'tyvaren_ultimatum_defy',
    category: 'war',
    herald: {
      headline: 'CHANCELLOR REJECTS TYVAREN ULTIMATUM',
      body: 'Chancellor Ashavel has formally rejected Marshal Vukov\'s ultimatum demanding that Veltria cede the Gravenmark Pass. The decision, announced after an emergency cabinet session, places the two nations on a collision course that military analysts describe as the most serious threat of armed conflict since the Halvek era.',
    },
    standard: {
      headline: 'NO SURRENDER: CHANCELLOR TELLS VUKOV WHERE TO PUT HIS ULTIMATUM',
      body: "Marshal Vukov gave the Chancellor four weeks to surrender the Gravenmark. She answered the same day. The answer was no. Not a qualified no, not a diplomatic no, not a 'let us discuss terms' no — a Veltrian no, delivered with the full weight of a nation that spent twenty-nine years being told what to do by stronger powers and has decided it is done with that forever. Vukov will not take this well. That is, for once, entirely the point.",
    },
  },

  {
    trigger: 'tyvaren_ultimatum_negotiate',
    category: 'war',
    herald: {
      headline: 'CHANCELLOR SEEKS NEGOTIATED SETTLEMENT WITH TYVAREN',
      body: 'In response to Marshal Vukov\'s ultimatum, Chancellor Ashavel has pressed for negotiations with Tyvaren rather than a military answer. The diplomatic approach has drawn criticism from security hawks who view negotiation as appeasement.',
    },
    standard: {
      headline: 'DIPLOMACY OVER WAR: CHANCELLOR CHOOSES TALKING OVER FIGHTING',
      body: "Marshal Vukov demanded the Gravenmark. The Chancellor pressed for talks. It is not the heroic defiance some wanted — it is something harder: the willingness to be called weak in order to avoid sending young Veltrians to die on a frozen border. Whether the talks run through the Forum or directly, the world will watch. And Vukov, who thrives on isolation and escalation, will have to explain to the international community why he rejected a peaceful settlement. If he rejects it. He might not. That is the gamble.",
    },
  },

  // ─── ACT 4: WAR ──────────────────────────────────────────────────────────────

  {
    trigger: 'war_strategy_defensive',
    category: 'war',
    herald: {
      headline: 'GENERAL STAFF ADOPTS DEFENSIVE WAR STRATEGY',
      body: 'The Veltrian general staff, under Chancellor Ashavel\'s direction, has adopted a distributed defensive strategy across the Gravenmark, Korven and Dravenhollow fronts, trading space for time through the winter and preserving civilian population centers. Military analysts describe the approach as conservative — prioritizing force preservation over territorial gains — and note it reflects the Chancellor\'s determination to minimize casualties even at the cost of a longer conflict.',
    },
    standard: {
      headline: 'DEFEND THE REPUBLIC: CHANCELLOR CHOOSES LIVES OVER GLORY',
      body: "Hold the line. Protect the cities. Bring the soldiers home. Chancellor Ashavel's war strategy is not designed for military glory — it is designed for survival. The generals wanted a decisive battle at Gravenmark or a counter-offensive in the Dravenhollow highlands. The Chancellor said no. Every Veltrian family with a son or daughter in uniform should understand what that decision means: this government will not spend lives for territory. The line bends where it must and holds where it can. We trade ground for time, and we will not start something we cannot finish.",
    },
  },

  {
    trigger: 'war_strategy_dravenni_counter_offensive',
    category: 'war',
    herald: {
      headline: 'VELTRIAN FORCES PREPARE HIGHLAND COUNTEROFFENSIVE',
      body: 'Chancellor Ashavel has authorized a limited counter-offensive in the Dravenhollow highlands, with Veltrian regulars and Dravenni fighters operating together. Military planners say eliminating the Tyvaren flanking column would shorten the defensive line by a third and free forces for the Gravenmark. The decision marks a shift from defensive to offensive operations.',
    },
    standard: {
      headline: 'THE TIDE TURNS: VELTRIA STRIKES BACK IN THE HIGHLANDS',
      body: "From the Gravenmark's defensive positions to the Dravenhollow highlands — the Veltrian army has crossed the line between holding and striking. Chancellor Ashavel's authorization of the counter-offensive is the most consequential military decision of her administration. The objective is the Tyvaren flanking column in the mountains, not conquest. But wars have a way of outgrowing their objectives. The Chancellor knows this. The question is whether she can control what she has started.",
    },
  },

  {
    trigger: 'coup_nationalize_army',
    category: 'crisis',
    herald: {
      headline: 'CHANCELLOR NATIONALIZES MILITARY COMMAND AFTER COUP ATTEMPT',
      body: 'Following an attempted seizure of the capital by General Brenner and the General Staff, Chancellor Ashavel has declared their orders illegal and asserted direct civilian control over military command. Colonel Dusek, who remained loyal to the constitutional government, has been named acting Commander-in-Chief. The 3rd Armored Regiment is advancing on Ashenmere from Fort Harlan.',
    },
    standard: {
      headline: 'DEMOCRACY FIGHTS BACK: CHANCELLOR VOIDS THE GENERAL STAFF ORDERS',
      body: "They tried. In the dark hours of the morning, General Brenner's orders sent the 3rd Armored Regiment out of Fort Harlan toward the capital while the garrison was told to stand down. The Chancellor did not wait. Colonel Dusek stood with the constitution. The rank and file stood with their oath. And the Chancellor — the woman they thought they could intimidate — declared the General Staff's orders illegal with a speed and clarity that sent a message to every would-be caudillo in uniform: this Republic is not for sale and not for taking. The garrison has been told its oath is to the Republic. The tanks are still on the road. Democracy is holding.",
    },
  },

  {
    trigger: 'coup_negotiate',
    category: 'crisis',
    herald: {
      headline: 'CHANCELLOR CALLS GENERAL BRENNER TO AVERT BLOODSHED',
      body: 'In a controversial decision, Chancellor Ashavel has asked to speak directly to General Brenner, at the center of the troop movements toward Ashenmere, and has refused to order loyal troops to fire on Veltrian soldiers. The decision is aimed at averting urban combat in Ashenmere but has been criticized as setting a dangerous precedent for military pressure on civilian government.',
    },
    standard: {
      headline: 'A CALL IN THE DARK: CHANCELLOR TALKS TO THE GENERAL AT THE CENTER OF THE COUP',
      body: "The general at the center of the coup is not in custody. He is on the line — because the Chancellor called him. She will not order loyal troops to fire, and she will ask him what happens after the tanks roll in. Nobody yet knows what he has been offered. Whatever comes of the call, the Chancellor has chosen a conversation over the law, and a government too afraid of bloodshed to enforce it. This is how democracies die — not with a bang, but with a negotiated settlement that everyone agrees to call 'restraint.'",
    },
  },

  // ─── ECONOMIC SHIFTS ─────────────────────────────────────────────────────────

  {
    trigger: 'ima_aid_accepted',
    category: 'economy',
    herald: {
      headline: 'VELTRIA ACCEPTS INTERNATIONAL MONETARY AUTHORITY AID PACKAGE',
      body: 'The Ashavel government has accepted a revised loan package from the International Monetary Authority, a larger facility in exchange for quarterly audits by IMA auditors, a cap on military spending and a currency board that fixes the Krone within a band. Finance Minister Vostane said the deal is better on financial terms and worse on sovereignty terms. Opposition figures warned the conditions amount to external control of Veltrian fiscal policy.',
    },
    standard: {
      headline: 'THE IMA\'S PRICE: AID COMES WITH CHAINS ATTACHED',
      body: "A larger loan. That is what the IMA is offering. In exchange, they want auditors in our ministries, a cap on what we spend on defense, and a currency band that takes monetary policy off the table. Finance Minister Vostane says the deal is better on the numbers and worse on sovereignty. Better for whom? The IMA's structural adjustment programs have a track record across the developing world: austerity, unemployment, and the transfer of national wealth to international creditors. The Chancellor campaigned on sovereignty. Today, she sold a piece of it.",
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
    trigger: 'language_school_approve',
    category: 'faction',
    herald: {
      headline: 'GOVERNMENT APPROVES FIRST DRAVENNI-LANGUAGE STATE SCHOOL',
      body: 'The government has approved a state-funded primary school in the Dravenhollow district that will teach in Dravenni, with Veltrian taught as a mandatory second language from the first year. The Chancellor has said other linguistic minorities will be judged on their merits, and the Archbishop\'s concern about precedent has been noted. The Dravenni Cultural Council waited sixteen years for its application to be read, and Halvek denied it six times.',
    },
    standard: {
      headline: 'A VICTORY FOR THE DRAVENNI: A SCHOOL IN THEIR OWN TONGUE',
      body: "For the first time since the founding of the Republic, a state school in Dravenhollow will teach Dravenni children in the language they speak at home. One school, state-funded, with Veltrian taught from the first year so that no child is cut off from the nation's law, commerce or civic life. The application sat in the Education Ministry for sixteen years and was denied six times under Halvek. It took twenty-nine years and a revolution to get here. The Dravenni community is celebrating tonight — and they have earned every moment of it.",
    },
  },

  // ─── PRESS FREEDOM ──────────────────────────────────────────────────────────

  {
    trigger: 'press_freedom_decree',
    category: 'governance',
    herald: {
      headline: 'CHANCELLOR REPEALS SECTION 14 BY EXECUTIVE ORDER',
      body: 'Chancellor Ashavel has signed an executive order repealing Section 14 of the National Stability Act, ending government review of publications and revoking the Media Oversight Board\'s power to suppress them. The security provisions of the Act remain in force. The Chancellor will publicly acknowledge that Section 14 went too far. The order was welcomed by the Veltrian Journalists\' Union and foreign press freedom organizations.',
    },
    standard: {
      headline: 'THE TRUTH CAN FINALLY BE PRINTED: PRESS FREEDOM DECREED',
      body: "No more censors. No more Section 14 review. No more midnight visits from BNI agents asking journalists where they got their information. Chancellor Ashavel's executive order is the most significant expansion of civil liberties since the fall of the Halvek regime. The Veltrian Journalists' Union — many of whose members spent years in prison under the old laws — called it 'the day we stopped being afraid.' This newspaper, which was banned twice under Halvek, can finally report without looking over its shoulder.",
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
      body: 'Chancellor Ashavel has survived a no-confidence motion in Parliament by a narrow margin, with nineteen members of Kolvar\'s own bloc defecting. The vote, triggered by Halvekist leader Kolvar, exposed the fragility of the governing coalition but ultimately demonstrated that the Chancellor retains sufficient support to continue. Political analysts warn that the narrow margin signals trouble for the constitutional reform agenda.',
    },
    standard: {
      headline: 'SHE IS STILL STANDING: CHANCELLOR WEATHERS KOLVAR\'S ATTACK',
      body: "Not a landslide, and not a comfortable margin. Nineteen members of Kolvar's own bloc defected, and the Dravenni bloc decided Kolvar would be worse for them than the Chancellor. Kolvar put everything he had into the motion. And when the votes were counted, the Chancellor was still standing. The coalition held. Barely. The message from Parliament is clear: she governs, but she governs on notice. Every vote from here on is a confidence vote in everything but name.",
    },
  },

  // ─── BUDGET CRISIS ───────────────────────────────────────────────────────────

  {
    trigger: 'budget_deficit_warning',
    category: 'budget',
    conditions: [
      { type: 'flag', flag: 'budget_finalized', value: true },
    ],
    herald: {
      headline: 'GOVERNMENT KEEPS BORROWING AS FINANCE MINISTRY WARNS OF UNSUSTAINABLE DEFICIT',
      body: 'The government has chosen to keep borrowing for now rather than impose emergency austerity across every ministry. The Finance Ministry warns that the current deficit trajectory is unsustainable and that debt service alone could consume more than a quarter of next year\'s revenue if the trend continues. Emergency measures may follow if the position does not improve.',
    },
    standard: {
      headline: 'THE BILL COMES DUE: BORROWING BUYS TIME, NOT SAFETY',
      body: "The government has decided to keep borrowing rather than cut every ministry, and the Finance Ministry's warning should be taken for what it is. The deficit has reached a point that can no longer be managed quietly. Debt service alone could take more than a quarter of next year's revenue, and every month of borrowing hands the bill to a future government and to the families who will live with whatever cuts it eventually forces. Emergency measures may follow. The only open question is whether the country hears the truth before they arrive.",
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

  // ─── PRESS CONFERENCE OUTCOMES ─────────────────────────────────────────────

  {
    trigger: 'press_conference_triumph',
    category: 'media',
    herald: {
      headline: 'CHANCELLOR DELIVERS DEFINITIVE PRESS CONFERENCE AFTER REFERENDUM',
      body: 'In a display of political confidence that observers described as remarkable given the narrow referendum margin, Chancellor Ashavel faced the press corps today and made three concrete commitments: a bipartisan constitutional implementation committee, a review of politically-motivated security clearance denials, and a meeting with the Workers\' Coalition leadership. Political analysts noted the specificity of the commitments — each one comes with a public deadline that the opposition can use to hold the government accountable. The Chancellor appears to be betting that accountability is a stronger political asset than ambiguity.',
    },
    standard: {
      headline: 'ASHAVEL TURNS PRESS CONFERENCE INTO GOVERNANCE MOMENT',
      body: "In a move that surprised political observers, Chancellor Ashavel transformed what could have been a defensive press briefing into a series of concrete policy announcements. The bipartisan implementation committee, the security clearance review, and the Workers' Coalition cabinet meeting are each individually significant; together they represent a coordinated response to the referendum's narrow margin. The question is whether the commitments can be delivered on the timeline the Chancellor has set. The press will be watching. That is, presumably, the point.",
    },
  },

  {
    trigger: 'press_conference_mixed',
    category: 'media',
    herald: {
      headline: 'REFERENDUM AFTERMATH: CHANCELLOR FACES QUESTIONS WITH MIXED RESULTS',
      body: 'Chancellor Ashavel\'s post-referendum press conference produced more questions than answers, according to political commentators. While the Chancellor acknowledged the narrow margin and pledged to govern for all Veltrians, specific policy commitments were scarce. The implementation committee announcement was welcomed by reformist allies, but the failure to address concrete concerns about security clearance practices drew criticism from both opposition and independent observers. The Halvekist bloc called the briefing "an exercise in managed ambiguity."',
    },
    standard: {
      headline: 'ASHAVEL NAVIGATES TERRITORY AFTER REFERENDUM — SUCCESS DEBATED',
      body: "The Chancellor faced the press today with the weight of a narrow referendum victory and the knowledge that forty-eight percent of the country voted against her signature policy. Her responses were measured, her tone was conciliatory, and her specific commitments were limited. Political analysts are divided on whether this represents prudent governance or missed opportunity. The implementation committee is a genuine step forward, but the absence of concrete action on security concerns and coalition vacancies left critics with ammunition. The story of this press conference will be written by what happens next — whether the Chancellor follows through on what she promised.",
    },
  },

  {
    trigger: 'press_conference_disaster',
    category: 'media',
    herald: {
      headline: 'CHANCELLOR COMBATIVE IN POST-REFERENDUM BRIEFING — PRESS RELATIONS STRAINED',
      body: 'Chancellor Ashavel\'s post-referendum press briefing descended into an extended confrontation with senior journalists today, leaving press relations at their lowest point since the inauguration. When pressed on specific governance concerns — security clearances, coalition vacancies, and opposition outreach — the Chancellor responded with what multiple observers described as dismissive and defensive. The exchange with Nadia Voss of the Ashenmere Herald, in which the Chancellor suggested the press should focus on "what has been done rather than what has been announced," drew particular criticism from media freedom advocates. The Veltrian Journalists\' Union issued a statement expressing concern about the "tone of the exchange."',
    },
    standard: {
      headline: 'ASHAVEL ATTACKS PRESS IN DISASTROUS POST-REFERENDUM BRIEFING',
      body: "What should have been a routine post-referendum press conference became a political disaster for the Ashavel government today. The Chancellor's refusal to answer specific questions about governance — particularly regarding security clearance practices and coalition vacancies — drew sharp criticism from reporters and media freedom organizations alike. The confrontation with Nadia Voss, during which the Chancellor suggested journalists should 'look at what has been done rather than what has been announced,' was described by one veteran political correspondent as 'the most hostile exchange between a Veltrian Chancellor and the press in living memory.' The story tomorrow is not about the referendum. It is about a government that does not want to be questioned.",
    },
  },

  // ─── DEVELOPMENT PROJECTS ────────────────────────────────────────────────────

  {
    trigger: 'contractor_fort_state',
    category: 'security',
    herald: {
      headline: 'STATE BUREAU TO BUILD SEVAGRAD BORDER FORTIFICATIONS',
      body: 'The government has chosen the State Bureau to build the Sevagrad border fortifications: forty kilometers of reinforced positions, observation posts and defensive infrastructure. Colonel Dusek has argued that the Bureau has built military installations before and understands the security requirements. The work will proceed under military discipline and will be slower than a commercial build. Defense planners judge that the frontier is better served by care than by speed.',
    },
    standard: {
      headline: 'SLOW AND DISCIPLINED: PUBLIC BUILDERS GET THE SEVAGRAD LINE',
      body: 'Forty kilometers of fortifications on the Sevagrad frontier, and the Chancellor has handed them to the State Bureau. Not to the private firms circling the contract, and not to the foreign advisers hoping for a slice, but to a public builder with a record of military work. It will be slow. Good. A public institution that answers to the public should not be rushed into building walls on a contested border. The Sevagrad line will be built by Veltrians, under Veltrian oversight, and the country will know who is accountable for it.',
    },
    times: {
      headline: 'Who Builds the Border? The Case for the State Bureau',
      body: 'The choice of contractor for the Sevagrad fortifications is a security decision as much as an economic one. The State Bureau has built military installations before and works under the discipline the military requires, which makes it the most conservative option on the table. Its schedule will be slower than a commercial build, and the cost of that delay will show up in the readiness of the frontier as much as in the budget. Analysts will judge the decision by the quality of the walls it produces and by whether the state keeps control of the plans.',
    },
  },

  {
    trigger: 'contractor_fort_vael',
    category: 'security',
    herald: {
      headline: 'VAEL CONSTRUCTION TO BUILD SEVAGRAD FORTIFICATIONS UNDER MILITARY OVERSIGHT',
      body: 'Vael Construction has been named to build the Sevagrad border fortifications, with the military supervising the classified aspects of the work. The firm will handle the concrete and steel of forty kilometers of reinforced positions and observation posts, and the government says it will deliver on schedule. Colonel Dusek has raised concerns about a firm that has never done military construction, and about its security protocols. Officials say the military will keep the classified specifications under its own control.',
    },
    standard: {
      headline: 'THE BORDER FOR SALE: VAEL GETS THE SEVAGRAD FORTIFICATIONS',
      body: 'A military frontier has been handed to a private firm that has never built a military position. Vael Construction will pour the concrete and lay the steel on forty kilometers of Sevagrad fortifications, while officers supervise the classified parts. The schedule is promised. The security protocols are doubted by the officer who must answer for them. Anyone who wants to know how this government chooses its contractors should start with one question: who asked for this?',
    },
    times: {
      headline: 'Private Hands on a Military Border: Assessing the Sevagrad Contract',
      body: 'Military construction is normally the work of state engineers, because classified specifications and security protocols are hard to police when a private firm holds the plans. Vael Construction has no record of military work, and the army will supervise the classified elements, which limits what the company can see but not what it can be paid. The Sevagrad frontier will be judged by whether the walls hold and whether the security arrangements survive commercial pressure. Parliament should ask for the supervision terms in writing.',
    },
  },

  {
    trigger: 'contractor_fort_foreign_consult',
    category: 'security',
    herald: {
      headline: 'STATE BUREAU BUILDS SEVAGRAD DEFENSES WITH FOREIGN CONSULTATION',
      body: "The State Bureau will build the Sevagrad border fortifications, while a foreign consortium has been invited to provide engineering consultation. The consortium will not receive access to classified specifications. Military planners have made clear that no foreign company will build Veltria's border defenses, and the arrangement draws on outside technical expertise without surrendering control of the plans.",
    },
    standard: {
      headline: 'OUTSIDE ADVICE, VELTRIAN HANDS: THE SEVAGRAD LINE STAYS HOME',
      body: 'The Sevagrad border will be built by the State Bureau. Foreign engineers may advise, but they will not see the classified specifications, and no foreign company will lay a stone on our frontier. It is the right balance: learn from outside expertise, keep control at home. This is what sovereignty looks like in practice: outside advice, Veltrian control. Veltrians should be able to see that the walls on the Sevagrad frontier belong to Veltria.',
    },
  },

  {
    trigger: 'fort_redesign_defensive',
    category: 'diplomacy',
    herald: {
      headline: 'SEVAGRAD POSITIONS REDESIGNED AS DEFENSIVE AFTER TYVAREN PROTEST',
      body: 'The government has redesigned the disputed positions on the Sevagrad frontier as explicitly defensive and removed their artillery platforms, answering a formal Tyvaren protest that claimed the fortifications were built for assault. The Tyvaren ambassador cited the Gravenmark Pass Treaty and threatened a proportional response. The redesign will cost two weeks and five million Krone in materials already in place. The government said the revised design leaves no basis for the accusation.',
    },
    standard: {
      headline: 'NO ARTILLERY ON THE SEVAGRAD LINE: THE PLATFORMS COME DOWN',
      body: 'The artillery platforms are coming down. Whatever the design intent, a fortification that could be adapted for assault invites the accusation, and this government has chosen to remove the ambiguity rather than defend it. It will cost two weeks and five million Krone in materials. It is the right price. Good sense has finally won a round in the Sevagrad debate, and the Chancellor should be judged on the walls that are built, not the speeches made about them.',
    },
    times: {
      headline: 'Redesign Under Pressure: What the Sevagrad Changes Signal',
      body: 'The decision to redesign the disputed Sevagrad positions and remove their artillery platforms is a diplomatic signal as much as a construction change. It concedes the ambiguity that Tyvaren exploited while keeping the frontier fortified. The two-week delay and five million Krone in materials are the visible costs. Analysts will watch whether Tyvaren accepts the revised design as the end of the protest, or treats it as proof that the original positions were offensive all along.',
    },
  },

  {
    trigger: 'fort_continue_as_planned',
    category: 'security',
    herald: {
      headline: 'GOVERNMENT REJECTS TYVAREN ACCUSATION AS SEVAGRAD WORK CONTINUES',
      body: 'The government has rejected the Tyvaren accusation that the Sevagrad fortifications include offensive positions and will continue construction as planned. The Tyvaren ambassador had threatened a proportional response under the Gravenmark Pass Treaty. Officials maintain that the works are defensive in design and that the accusation is made in bad faith. Border tensions are likely to rise as the standoff over the Sevagrad frontier continues.',
    },
    standard: {
      headline: 'THE WALLS KEEP RISING: SEVAGRAD FORTIFICATIONS PRESS ON',
      body: 'The government has told Tyvaren that its protest is bad faith, and it will keep building. Forty kilometers of fortifications on the Sevagrad frontier will continue, with the disputed positions left as they stand. Every new bunker is a gift to the men who want a war on this border, and the people of Sevagrad will be the first to pay for a standoff they did not choose. The Chancellor has chosen to hold the line. The question is who will be willing to step back from it.',
    },
  },

  {
    trigger: 'contractor_highway_state',
    category: 'economy',
    herald: {
      headline: 'STATE BUREAU TO BUILD AMBER COAST HIGHWAY WITH LOCAL HIRING',
      body: 'The government has given the Amber Coast Highway to the State Construction Bureau, which will manage the project locally and employ local workers along the route in Aldenmoor. The two-hundred-kilometer coastal road will link Aldenmoor to Ashenmere and cut travel time from seven hours to three. The project will take longer than a commercial build, but the government says the road will belong to the communities it serves. The project is expected to create eight thousand construction jobs.',
    },
    standard: {
      headline: 'THE ROAD BELONGS TO THE PEOPLE: PUBLIC BUILDERS WIN THE AMBER COAST',
      body: 'Local hiring, local management, and a road that answers to the communities it crosses. The State Construction Bureau will build the Amber Coast Highway, and it will be slower than a private contractor would be. Good. Eight thousand construction jobs should go to the people of Aldenmoor and the towns along the coast. Three hours instead of seven is a promise that matters to every family that has waited for a better road. This time, the road will be built for them.',
    },
    gazette: {
      headline: 'Coastal Road to Be Built by State Hands, With Local Labor',
      body: "Aldenmoor's coastal villages will see the Amber Coast Highway built by a state bureau that has promised to hire local men and women for the work. The road will link Aldenmoor with Ashenmere and cut the journey from seven hours to three, which will matter to market towns and the farms that depend on them. The Bureau will be slower than a commercial firm, but the work will be done by people who stay in the district when the road is finished.",
    },
  },

  {
    trigger: 'contractor_highway_vael',
    category: 'economy',
    herald: {
      headline: 'VAEL CONSTRUCTION AWARDED AMBER COAST HIGHWAY CONTRACT',
      body: "The government has awarded the Amber Coast Highway to Vael Construction, which has committed to keep the project on schedule and on budget. The contract includes the firm's markup on the estimated cost, and the route will be pushed through efficiently. The two-hundred-kilometer road will link Aldenmoor to Ashenmere, cut the journey from seven hours to three, and create eight thousand construction jobs. Officials say the route is already approved.",
    },
    standard: {
      headline: 'ON SCHEDULE, PLUS THE MARKUP: VAEL BUILDS THE AMBER COAST ROAD',
      body: 'On schedule. On budget. Plus the markup. Vael Construction has won the Amber Coast Highway, the two-hundred-kilometer road that will carry Aldenmoor to Ashenmere in three hours instead of seven. The efficiency is real, and so is the price. A contractor paid to be fast will take the shortest path across the coast, whatever lies in the way. The people of Aldenmoor are being asked to celebrate the road. They should first ask what it cost, and who paid the markup.',
    },
  },

  {
    trigger: 'contractor_highway_foreign',
    category: 'economy',
    herald: {
      headline: 'FOREIGN CONSORTIUM TO BUILD AMBER COAST HIGHWAY WITH ARCHAEOLOGICAL SURVEY',
      body: 'A foreign consortium has been selected to build the Amber Coast Highway in Aldenmoor. Its bid includes archaeological survey teams that will document the Dravenni sites along the route before construction begins. The consortium says its bid is two weeks faster than the alternatives. The two-hundred-kilometer coastal road will link Aldenmoor with Ashenmere, cutting the journey from seven hours to three.',
    },
    standard: {
      headline: 'SURVEY BEFORE THE SHOVEL: FOREIGN FIRM TO RECORD DRAVENNI SITES',
      body: "A foreign consortium will build the Amber Coast Highway, and its bid puts archaeologists ahead of the bulldozers. The Dravenni sites on the route will be documented before a single foundation is poured, and the consortium says the road will be two weeks faster. It is a better offer than most. Heritage survives in the records, and Aldenmoor gets its road sooner. But a country that lets outsiders survey its own coast should ask who will keep the sites once the survey teams have gone.",
    },
  },

  {
    trigger: 'highway_reroute',
    category: 'faction',
    herald: {
      headline: 'AMBER COAST HIGHWAY REROUTED TO PRESERVE DRAVENNI RUINS',
      body: 'Construction on the Amber Coast Highway in Aldenmoor has uncovered stone foundations, pottery fragments and the remains of a Dravenni settlement that predates Veltrian arrival in the region by six centuries. Archaeologists from Ashenmere University asked for work to halt while the site is studied, and the Chancellor has ordered the route changed to protect the ruins. The reroute adds ten million Krone and three weeks to the project. Interior Minister Danika Oberlin said the site is considered sacred by the Dravenni community.',
    },
    standard: {
      headline: 'THE ROAD BENDS FOR THE PAST: AMBER COAST SPARES DRAVENNI HERITAGE',
      body: "The Dravenni have lost enough to Halvek's bulldozers, and this time the government has chosen to bend the road instead. The stone foundations, pottery and settlement that predate Veltrian arrival by six centuries will be preserved in Aldenmoor. The reroute costs ten million Krone and three weeks, a price the Chancellor has agreed to pay. Every Veltrian should understand what it means to bend a highway around a people's past. For once, the state has decided that the past is worth more than the schedule.",
    },
  },

  {
    trigger: 'highway_bulldoze',
    category: 'faction',
    herald: {
      headline: 'AMBER COAST HIGHWAY RESUMES AFTER ONE-WEEK SURVEY OF RUINS',
      body: 'Construction on the Amber Coast Highway in Aldenmoor will resume after one week of documentation at the Dravenni settlement uncovered on the route. The ruins will be recorded and moved, and the route will not be changed. Archaeologists from Ashenmere University had asked for three weeks to document the site, and the Dravenni caucus had demanded a full reroute, which the government has rejected. The Chancellor said progress cannot wait for archaeology.',
    },
    standard: {
      headline: 'ONE WEEK TO WRITE DOWN SIX CENTURIES: PROGRESS RUNS OVER THE RUINS',
      body: 'Six centuries of history, and the government has allowed one week to write it down. The Dravenni settlement on the Amber Coast route will be recorded and moved, and then construction returns. The archaeologists asked for three weeks. The Dravenni caucus asked for a reroute. Both requests were refused. Recording the ruins is not the same as keeping them, and anyone who has watched a village disappear under a road knows the difference.',
    },
  },
]
