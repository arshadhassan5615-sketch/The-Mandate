import type { FactionState } from '../../types/gameState'

export type ReactionIntensity =
  | 'strongly_oppose' | 'oppose' | 'reluctant' | 'neutral' | 'support' | 'strongly_support'

export interface FactionReaction {
  faction: keyof FactionState
  factionLabel: string
  intensity: ReactionIntensity
  label: string
  value: number
}

export interface ProvisionVariant {
  id: string
  label: string
  description: string
  reactions: FactionReaction[]
  referendumModifier: number
  assemblyVoteModifier: number
}

export interface ConstitutionalProvision {
  id: string
  name: string
  description: string
  halvekStatus: string
  theronArgument: string
  variants: ProvisionVariant[]
}

function react(
  faction: keyof FactionState, factionLabel: string,
  intensity: ReactionIntensity, label: string, value: number,
): FactionReaction {
  return { faction, factionLabel, intensity, label, value }
}

function variant(
  id: string, label: string, description: string,
  reactions: FactionReaction[], refMod: number, asmMod: number,
): ProvisionVariant {
  return { id, label, description, reactions, referendumModifier: refMod, assemblyVoteModifier: asmMod }
}

// ─── The 12 Provisions ──────────────────────────────────────────────────────────

export const PROVISIONS: ConstitutionalProvision[] = [
  // ══════════════════════════════════════════════════════════════════════════════
  // 1. EXECUTIVE VETO POWER
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'executive_veto',
    name: 'Executive Veto Power',
    description: 'Determines the Chancellor\'s power to reject legislation passed by the Assembly.',
    halvekStatus: 'The Chancellor holds absolute veto power. No override mechanism exists.',
    theronArgument: 'The veto is the Chancellor\'s most direct check on the Assembly. But an absolute veto is a monarchy. We must calibrate between efficient governance and democratic accountability.',
    variants: [
      variant('veto_absolute', 'Absolute Veto (No Override)',
        'The Chancellor may veto any bill with no possibility of Assembly override. Maximum executive power.',
        [
          react('ironCovenant', 'Iron Covenant', 'strongly_support', 'Absolute veto ensures strong leadership in crisis.', 10),
          react('halvekists', 'Halvekists', 'strongly_support', 'Halvekists know absolute power is easier to sustain.', 8),
          react('reformists', 'Reformists', 'strongly_oppose', 'An absolute veto makes a mockery of parliamentary democracy.', -15),
          react('workersCoalition', 'Workers Coalition', 'strongly_oppose', 'Labor bills will never survive an executive who answers to business.', -12),
          react('dravenni', 'Dravenni', 'oppose', 'A veto with no override means Dravenni interests depend on Chancellor goodwill alone.', -8),
          react('businessClass', 'Business Class', 'support', 'A strong veto protects business from populist Assembly majorities.', 6),
        ], -4, -20),
      variant('veto_limited_two_thirds', 'Limited Veto (2/3 Override)',
        'The Chancellor may veto, but a two-thirds Assembly majority may override.',
        [
          react('reformists', 'Reformists', 'support', 'A reasonable compromise — executive check with democratic oversight.', 5),
          react('ironCovenant', 'Iron Covenant', 'support', 'The military can live with a restricted veto.', 3),
          react('halvekists', 'Halvekists', 'oppose', 'A 2/3 override makes the veto meaningless in practice.', -5),
          react('workersCoalition', 'Workers Coalition', 'support', 'At least there is a path to override if the Chancellor blocks labor bills.', 4),
        ], 2, 5),
      variant('veto_limited_three_fifths', 'Limited Veto (3/5 Override)',
        'The Chancellor may veto, but a three-fifths Assembly majority may override.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'The most democratic option — veto exists but is highly contestable.', 10),
          react('halvekists', 'Halvekists', 'strongly_oppose', 'A 60% threshold makes the veto decorative.', -10),
          react('workersCoalition', 'Workers Coalition', 'strongly_support', 'A low override threshold empowers the Assembly against executive overreach.', 8),
          react('ironCovenant', 'Iron Covenant', 'oppose', 'Undermines executive authority in security matters.', -5),
        ], 3, 12),
      variant('veto_removed', 'Remove Veto Entirely',
        'The Chancellor has no veto power. All bills passed by the Assembly become law immediately.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'Pure parliamentary democracy. The executive must implement the Assembly\'s will.', 15),
          react('halvekists', 'Halvekists', 'strongly_oppose', 'The Assembly could destroy the state with no executive check.', -20),
          react('ironCovenant', 'Iron Covenant', 'strongly_oppose', 'No veto means no protection against hostile legislation targeting the military.', -15),
          react('workersCoalition', 'Workers Coalition', 'strongly_support', 'Labor legislation can no longer be blocked by a single office.', 12),
          react('businessClass', 'Business Class', 'strongly_oppose', 'Business has no defense against populist Assembly majorities.', -10),
        ], -2, 15),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. JUDICIAL INDEPENDENCE
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'judicial_independence',
    name: 'Judicial Independence',
    description: 'Determines how judges are appointed and how independent the judiciary is from executive control.',
    halvekStatus: 'Judges are appointed and dismissed by the Chancellor at will.',
    theronArgument: 'A judiciary that serves the executive is not a judiciary — it is a department of enforcement. Independence is the difference between law and decree.',
    variants: [
      variant('judges_chancellor_appoints', 'Chancellor Appoints Judges',
        'The Chancellor appoints all judges with no independent oversight.',
        [
          react('ironCovenant', 'Iron Covenant', 'support', 'Executive control of courts ensures national security considerations are respected.', 5),
          react('halvekists', 'Halvekists', 'support', 'This maintains the status quo the Halvekists built.', 8),
          react('reformists', 'Reformists', 'strongly_oppose', 'This is Halvek\'s system with a different face.', -15),
          react('church', 'Church', 'support', 'A Chancellor-appointed judiciary is more likely to respect ecclesiastical authority.', 4),
        ], -3, -10),
      variant('judges_independent_commission', 'Independent Judicial Commission',
        'An independent commission of legal scholars, judges, and civil society representatives appoints judges.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'The gold standard of judicial reform. Theron\'s life work.', 15),
          react('halvekists', 'Halvekists', 'strongly_oppose', 'Losing control of the judiciary means losing the last lever of power.', -10),
          react('ironCovenant', 'Iron Covenant', 'oppose', 'Independent courts may prosecute officers for Halvek-era actions.', -8),
          react('workersCoalition', 'Workers Coalition', 'support', 'Labor trusts independent courts more than politically appointed ones.', 8),
          react('dravenni', 'Dravenni', 'strongly_support', 'For minorities, independent courts are the only protection.', 12),
        ], 5, 14),
      variant('judges_elected', 'Elected Judges',
        'Judges are elected by popular vote for fixed terms.',
        [
          react('reformists', 'Reformists', 'neutral', 'Democratic in theory, but risks politicizing the bench. Mixed feelings.', -2),
          react('halvekists', 'Halvekists', 'oppose', 'Populist judges are unpredictable and may turn on everyone.', -5),
          react('workersCoalition', 'Workers Coalition', 'strongly_support', 'Workers can elect judges who understand labor issues.', 10),
          react('businessClass', 'Business Class', 'strongly_oppose', 'Elected judges will pander to anti-business sentiment.', -8),
          react('church', 'Church', 'oppose', 'The Church cannot control an elected judiciary.', -6),
        ], 1, 5),
      variant('judges_no_change', 'No Change to Current System',
        'The Halvek-era judicial appointment system remains in place.',
        [
          react('halvekists', 'Halvekists', 'strongly_support', 'Preserves existing power structures.', 5),
          react('reformists', 'Reformists', 'strongly_oppose', 'Cowardice dressed as pragmatism.', -10),
        ], -6, -15),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. TERM LIMITS
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'term_limits',
    name: 'Term Limits',
    description: 'Whether and how long the Chancellor may serve.',
    halvekStatus: 'No term limits. Halvek ruled for 26 years.',
    theronArgument: 'Power that never changes hands is not democracy. But the people should not be denied the right to re-elect a leader they trust.',
    variants: [
      variant('terms_none', 'No Term Limits',
        'The Chancellor may serve indefinitely.',
        [
          react('halvekists', 'Halvekists', 'support', 'No limits means we can return one day.', 5),
          react('reformists', 'Reformists', 'strongly_oppose', 'This betrays the entire democratic project.', -10),
          react('ironCovenant', 'Iron Covenant', 'support', 'Military prefers continuity in leadership.', 6),
        ], -2, -8),
      variant('terms_two_term', 'Two-Term Limit (8 Years)',
        'The Chancellor may serve at most two four-year terms.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'The democratic standard. Broadly popular.', 10),
          react('halvekists', 'Halvekists', 'oppose', 'A permanent break from the Halvek model.', -8),
          react('workersCoalition', 'Workers Coalition', 'support', 'Rotation of power aligns with labor\'s values.', 5),
          react('businessClass', 'Business Class', 'reluctant', 'Policy uncertainty every 8 years.', -3),
          react('dravenni', 'Dravenni', 'support', 'Future Dravenni candidates may have a chance.', 6),
        ], 4, 15),
      variant('terms_single_term', 'Single-Term Limit (4 Years)',
        'The Chancellor may serve only one term and may not run again.',
        [
          react('reformists', 'Reformists', 'support', 'Pure democracy — but you can\'t run again. Personal cost.', 5),
          react('halvekists', 'Halvekists', 'support', 'They would rather you leave soon than stay long.', 8),
          react('ironCovenant', 'Iron Covenant', 'oppose', 'Losing an effective leader after 4 years weakens the state.', -8),
        ], 0, 3),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. ELECTORAL THRESHOLD
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'electoral_threshold',
    name: 'Electoral Threshold',
    description: 'The minimum percentage of the national vote a party needs to enter the Assembly.',
    halvekStatus: '10% threshold — deliberately high to block small parties and minority representation.',
    theronArgument: 'The threshold determines whether our Assembly represents all of Veltria or only the largest factions. A high threshold is stability; a low threshold is democracy.',
    variants: [
      variant('threshold_keep_10', 'Keep 10% Threshold',
        'Only parties receiving at least 10% of the vote enter the Assembly.',
        [
          react('halvekists', 'Halvekists', 'strongly_support', 'Blocks small reformist and minority parties.', 10),
          react('ironCovenant', 'Iron Covenant', 'support', "Prevents 'fringe' parties from destabilizing government.", 5),
          react('reformists', 'Reformists', 'oppose', 'Deliberately disenfranchises smaller democratic movements.', -8),
          react('dravenni', 'Dravenni', 'strongly_oppose', 'The Dravenni will never reach 10% nationally.', -12),
        ], 0, -10),
      variant('threshold_lower_5', 'Lower to 5%',
        'Parties receiving at least 5% of the vote enter the Assembly.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'A reasonable balance between representation and governability.', 10),
          react('halvekists', 'Halvekists', 'oppose', 'Small progressive parties will now enter and erode the old guard.', -5),
          react('workersCoalition', 'Workers Coalition', 'support', 'More worker-oriented parties means more labor influence.', 6),
          react('dravenni', 'Dravenni', 'support', 'Dravenni parties may reach 5%. Not guaranteed, but possible.', 8),
        ], 3, 10),
      variant('threshold_lower_3', 'Lower to 3%',
        'Parties receiving at least 3% of the vote enter the Assembly.',
        [
          react('dravenni', 'Dravenni', 'strongly_support', 'For the first time, Dravenni representation is guaranteed.', 15),
          react('workersCoalition', 'Workers Coalition', 'strongly_support', 'Fractures the labor vote but empowers more worker parties overall.', 10),
          react('halvekists', 'Halvekists', 'strongly_oppose', 'The Assembly becomes a circus of small parties.', -15),
          react('ironCovenant', 'Iron Covenant', 'oppose', 'Governability suffers. Coalitions become impossible to manage.', -8),
          react('reformists', 'Reformists', 'support', 'True proportional representation. Democratic but chaotic.', 5),
          react('businessClass', 'Business Class', 'oppose', 'Fragmentation means no stable economic policy.', -8),
        ], -2, 8),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. IMMUNITY FOR FORMER LEADERS
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'former_leader_immunity',
    name: 'Immunity for Former Leaders',
    description: 'Whether former regime officials retain legal immunity for acts committed during service.',
    halvekStatus: 'Full immunity for all former regime officials — the price of the peaceful transition.',
    theronArgument: 'Immunity was a compromise, not a principle. A constitution that protects war criminals from prosecution is a constitution that has not fully broken with its past.',
    variants: [
      variant('immunity_keep', 'Keep Full Immunity',
        'Former officials retain complete legal protection.',
        [
          react('halvekists', 'Halvekists', 'strongly_support', 'Protects the old guard. Kolvar himself benefits.', 15),
          react('ironCovenant', 'Iron Covenant', 'strongly_support', 'Protects military officers from Halvek-era prosecution.', 10),
          react('reformists', 'Reformists', 'strongly_oppose', 'Impunity for mass murder is not compromise — it is cowardice.', -20),
          react('dravenni', 'Dravenni', 'strongly_oppose', 'The architects of the Silent Clearances walk free forever.', -18),
        ], -5, -25),
      variant('immunity_remove', 'Remove All Immunity',
        'Former officials may be prosecuted for crimes committed during service.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'Justice finally possible. The new Veltria confronts its past.', 20),
          react('halvekists', 'Halvekists', 'strongly_oppose', 'This is not justice — this is revenge against the old order.', -25),
          react('ironCovenant', 'Iron Covenant', 'strongly_oppose', 'The military remembers loyalty. Touch Soren, touch us all.', -18),
          react('dravenni', 'Dravenni', 'strongly_support', 'The first step toward accountability for the Silent Clearances.', 18),
        ], 2, 5),
      variant('immunity_remove_not_retroactive', 'Remove Immunity — Not Retroactive',
        'Immunity is removed going forward but past acts remain protected.',
        [
          react('reformists', 'Reformists', 'reluctant', 'Better than nothing. Future leaders will be accountable.', 5),
          react('halvekists', 'Halvekists', 'support', 'They keep their immunity. Only future governments are affected.', 5),
          react('dravenni', 'Dravenni', 'oppose', 'The past is shielded. Our dead get no justice.', -8),
          react('ironCovenant', 'Iron Covenant', 'support', 'A compromise the officer corps can accept.', 3),
        ], 2, 10),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 6. CHURCH & STATE
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'church_state',
    name: 'Church & State Separation',
    description: 'The constitutional relationship between the Church of the Eternal Flame and the state.',
    halvekStatus: 'The Church holds constitutional status as "moral guardian" with control over education and family law.',
    theronArgument: 'The state must not dictate faith, and faith must not dictate law. Separation protects both the citizen and the believer.',
    variants: [
      variant('church_constitutional_role', 'Church Retains Constitutional Role',
        'The Church remains the state\'s official moral guardian with legal authority.',
        [
          react('church', 'Church', 'strongly_support', 'The Church\'s power is constitutionally secured for generations.', 20),
          react('reformists', 'Reformists', 'strongly_oppose', 'A theocratic poison pill in a democratic constitution.', -10),
          react('halvekists', 'Halvekists', 'support', 'Keeps the social order Halvek built intact.', 8),
          react('workersCoalition', 'Workers Coalition', 'oppose', 'Church interference in labor organizing is never benign.', -8),
        ], -3, -8),
      variant('church_full_separation', 'Full Separation',
        'Complete constitutional separation. No Church role in governance, education, or family law.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'Finally, a secular state.', 15),
          react('church', 'Church', 'strongly_oppose', 'Renek will mobilize every congregation against this.', -25),
          react('workersCoalition', 'Workers Coalition', 'strongly_support', 'Church courts have never ruled in favor of workers.', 10),
          react('dravenni', 'Dravenni', 'strongly_support', 'Separation means Dravenni faith practices gain equal standing.', 12),
          react('businessClass', 'Business Class', 'support', 'Removes Church tax exemptions — levels the economic field.', 6),
        ], -2, 5),
      variant('church_cultural_recognition', 'Cultural Recognition Without Authority',
        'The Church is recognized as culturally significant but holds no legal authority.',
        [
          react('church', 'Church', 'reluctant', 'Loses power but retains dignity. They will grumble but accept.', -5),
          react('reformists', 'Reformists', 'support', 'A compromise — less than full separation but more than theocracy.', 5),
          react('halvekists', 'Halvekists', 'neutral', 'The church\'s political influence diminishes; Halvekists are indifferent.', 2),
        ], 3, 8),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 7. BILL OF RIGHTS
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'bill_of_rights',
    name: 'Bill of Rights',
    description: 'Constitutional enumeration of fundamental citizen rights.',
    halvekStatus: 'No bill of rights. All freedoms exist at the Chancellor\'s pleasure.',
    theronArgument: 'Rights are not gifts from the state — they are protections against the state. A constitution without enumerated rights is a contract without terms.',
    variants: [
      variant('rights_none', 'No Bill of Rights',
        'No constitutional enumeration of rights. Freedoms remain at the discretion of the Chancellor.',
        [
          react('halvekists', 'Halvekists', 'support', 'Flexibility for the executive is more valuable than parchment promises.', 5),
          react('ironCovenant', 'Iron Covenant', 'support', 'National security requires the ability to restrict rights.', 5),
          react('reformists', 'Reformists', 'strongly_oppose', 'A constitution without rights is a contract for tyranny.', -15),
        ], -7, -18),
      variant('rights_basic', 'Basic Rights (Speech, Assembly, Religion)',
        'Constitutional protection for fundamental civil liberties.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'The minimum standard for any democracy.', 10),
          react('halvekists', 'Halvekists', 'oppose', 'Enumerated rights make authoritarian restoration legally difficult.', -8),
          react('workersCoalition', 'Workers Coalition', 'support', 'Assembly and speech are the tools of labor organizing.', 6),
          react('dravenni', 'Dravenni', 'strongly_support', 'For minorities, constitutional rights are survival tools.', 10),
          react('church', 'Church', 'reluctant', 'Religious freedom protects them but also protects rivals.', -3),
        ], 4, 15),
      variant('rights_expanded', 'Expanded Rights (Including Social & Economic)',
        'Constitutional protection for civil liberties PLUS social and economic rights — healthcare, education, housing, labor.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'A truly progressive constitution.', 15),
          react('workersCoalition', 'Workers Coalition', 'strongly_support', 'Labor rights as constitutional rights. Soraya will weep.', 15),
          react('businessClass', 'Business Class', 'strongly_oppose', 'Economic rights mean economic obligations the state cannot fund.', -10),
          react('halvekists', 'Halvekists', 'strongly_oppose', 'Social rights are radical destabilization of the economic order.', -12),
          react('dravenni', 'Dravenni', 'strongly_support', 'Housing and education rights directly benefit displaced communities.', 12),
          react('church', 'Church', 'oppose', 'Social rights undermine Church-run charities and hospitals.', -8),
        ], -1, 5),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 8. MINORITY LANGUAGE RIGHTS
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'minority_language',
    name: 'Minority Language Rights',
    description: 'The legal status of the Dravenni language in the Republic.',
    halvekStatus: 'Dravenni language is banned in all official settings. Speaking it in government buildings is a criminal offense.',
    theronArgument: 'A nation that criminalizes a mother tongue has declared war on its own children. Language rights are human rights.',
    variants: [
      variant('language_ban', 'Continue Ban on Dravenni',
        'The Halvek-era ban remains constitutional.',
        [
          react('halvekists', 'Halvekists', 'strongly_support', 'Ethnic Veltrian supremacy is core to the Halvekist identity.', 10),
          react('ironCovenant', 'Iron Covenant', 'strongly_support', 'Military views Dravenni separatism as a security threat.', 10),
          react('dravenni', 'Dravenni', 'strongly_oppose', 'Our language remains criminal. Our people remain second-class.', -20),
          react('reformists', 'Reformists', 'strongly_oppose', 'A constitution that bans a language is a constitution written for ethnic war.', -12),
          react('workersCoalition', 'Workers Coalition', 'oppose', 'Many Dravenni work in factories. Discrimination divides the working class.', -6),
        ], -6, -25),
      variant('language_regional', 'Dravenni as Regional Language',
        'Dravenni may be used in Dravenhollow and eastern provinces in official settings.',
        [
          react('dravenni', 'Dravenni', 'strongly_support', 'Recognition where we live. Not full equality, but dignity.', 15),
          react('halvekists', 'Halvekists', 'oppose', 'The start of a slippery slope toward secession.', -10),
          react('reformists', 'Reformists', 'support', 'A reasonable step. Not perfect, but progress.', 8),
          react('ironCovenant', 'Iron Covenant', 'oppose', 'Regional status may fuel separatist ambitions.', -8),
        ], 2, 8),
      variant('language_full_bilingual', 'Full Bilingual Status',
        'Dravenni is an official national language alongside Veltrian.',
        [
          react('dravenni', 'Dravenni', 'strongly_support', 'Full equality. Our language is our nation\'s language.', 25),
          react('halvekists', 'Halvekists', 'strongly_oppose', 'National humiliation. Veltria is a Veltrian nation.', -20),
          react('ironCovenant', 'Iron Covenant', 'strongly_oppose', 'Strengthens separatist movements. A security disaster.', -15),
          react('reformists', 'Reformists', 'strongly_support', 'The moral heart of the constitution. Equality is not conditional.', 12),
          react('workersCoalition', 'Workers Coalition', 'support', 'Solidarity across language lines strengthens labor.', 6),
        ], -3, 12),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 9. EMERGENCY POWERS
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'emergency_powers',
    name: 'Emergency Powers',
    description: 'Whether and how the Chancellor may exercise extraordinary powers during national emergencies.',
    halvekStatus: 'The Chancellor may declare an emergency for any reason, with no definition, review, or expiration. Halvek used this for 26 years.',
    theronArgument: 'This is the clause Halvek used to destroy democracy. Keep it in any form and you keep a loaded weapon pointed at the heart of everything else we write.',
    variants: [
      variant('emergency_chancellor_decree', 'Chancellor Retains Emergency Decree Power',
        'The Chancellor may declare emergencies and rule by decree, with Assembly reauthorization every 90 days.',
        [
          react('ironCovenant', 'Iron Covenant', 'strongly_support', 'Executive flexibility is essential for national security.', 10),
          react('reformists', 'Reformists', 'strongly_oppose', 'This is the Halvek clause with a nicer label.', -15),
          react('halvekists', 'Halvekists', 'strongly_support', 'A tool they know how to use.', 8),
          react('workersCoalition', 'Workers Coalition', 'strongly_oppose', 'Every strike ever broken was broken under emergency powers.', -10),
          react('dravenni', 'Dravenni', 'strongly_oppose', 'The Silent Clearances were emergency decrees.', -12),
        ], 3, -5),
      variant('emergency_assembly_approval', 'Assembly Approval Within 48 Hours',
        'The Chancellor may declare emergency but the Assembly must approve within 48 hours.',
        [
          react('reformists', 'Reformists', 'support', 'Emergency powers with democratic checks. A genuine compromise.', 10),
          react('ironCovenant', 'Iron Covenant', 'reluctant', 'Forty-eight hours is tight during a military crisis. But acceptable.', -3),
          react('halvekists', 'Halvekists', 'oppose', 'The Assembly will never approve a real emergency quickly enough.', -5),
          react('workersCoalition', 'Workers Coalition', 'support', 'At least there is oversight before rights are suspended.', 6),
        ], 4, 12),
      variant('emergency_none', 'No Emergency Powers',
        'The constitution contains no emergency powers provision. All governance must follow normal procedures.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'Theron\'s dream. A constitution with no back door to dictatorship.', 15),
          react('ironCovenant', 'Iron Covenant', 'strongly_oppose', 'Dangerously naive. When war comes, there will be no legal framework.', -20),
          react('halvekists', 'Halvekists', 'oppose', 'Impractical. Every government needs crisis tools.', -8),
          react('workersCoalition', 'Workers Coalition', 'strongly_support', 'No emergency powers means no emergency strikebreaking.', 8),
          react('dravenni', 'Dravenni', 'strongly_support', 'No more Silent Clearances under the color of law.', 10),
        ], -4, 5),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 10. WORKERS' RIGHT TO STRIKE
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'strike_right',
    name: "Workers' Right to Strike",
    description: 'Whether workers have a constitutional right to organize, bargain collectively, and strike.',
    halvekStatus: 'Strikes are criminalized as "economic sabotage." The military may be deployed to break strikes.',
    theronArgument: 'The right to withhold labor is the only power workers have against capital and the state. A constitution that protects property but not labor protects the strong against the weak.',
    variants: [
      variant('strike_none', 'No Constitutional Right to Strike',
        'Strikes remain regulated by ordinary law — which under current statutes means they are effectively banned.',
        [
          react('businessClass', 'Business Class', 'strongly_support', 'Labor discipline is essential for economic competitiveness.', 10),
          react('workersCoalition', 'Workers Coalition', 'strongly_oppose', 'A betrayal of the workers who put you in office.', -15),
          react('halvekists', 'Halvekists', 'support', 'Halvek\'s labor policies were effective.', 5),
          react('ironCovenant', 'Iron Covenant', 'support', 'The military does not want to break strikes but wants the option.', 5),
        ], -3, -12),
      variant('strike_restricted', 'Right to Strike With Restrictions',
        'Strikes are constitutional but may be regulated by law — cooling-off periods, essential services exceptions.',
        [
          react('workersCoalition', 'Workers Coalition', 'support', 'Constitutional recognition is a start. Restrictions can be fought later.', 10),
          react('businessClass', 'Business Class', 'reluctant', 'Better than full rights, but still a cost to competitiveness.', -5),
          react('reformists', 'Reformists', 'support', 'Balances labor rights with economic stability.', 5),
        ], 2, 10),
      variant('strike_unrestricted', 'Unrestricted Right to Strike',
        'Full constitutional protection for strikes, collective bargaining, and union organizing.',
        [
          react('workersCoalition', 'Workers Coalition', 'strongly_support', 'Everything labor has fought for since 1897.', 20),
          react('businessClass', 'Business Class', 'strongly_oppose', 'Vael sees this as economic warfare against property rights.', -15),
          react('ironCovenant', 'Iron Covenant', 'strongly_oppose', 'Prohibits using troops to maintain essential services.', -10),
          react('reformists', 'Reformists', 'support', 'A genuine commitment to economic democracy.', 8),
        ], -1, 8),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 11. LAND REFORM
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'land_reform',
    name: 'Land Reform',
    description: 'Whether and how the state may redistribute large landholdings.',
    halvekStatus: 'Land is concentrated among Halvek loyalists, the Church, and regime-connected oligarchs.',
    theronArgument: 'Land is not merely property — it is the foundation of economic justice. Three families own more of Veltria than three million Veltrians. This clause asks which side the constitution is on.',
    variants: [
      variant('land_none', 'No Land Redistribution',
        'Property rights remain absolute. No constitutional authorization for redistribution.',
        [
          react('businessClass', 'Business Class', 'strongly_support', 'Property rights are the foundation of investment confidence.', 10),
          react('church', 'Church', 'strongly_support', 'The Church is Veltria\'s largest landowner. Redistribution is confiscation.', 5),
          react('halvekists', 'Halvekists', 'support', 'Halvekist families own extensive estates.', 5),
          react('dravenni', 'Dravenni', 'strongly_oppose', 'Our ancestral lands, stolen during the Clearances, remain stolen forever.', -10),
          react('workersCoalition', 'Workers Coalition', 'oppose', 'Landless farmers and workers stay landless.', -8),
        ], 2, -5),
      variant('land_limited', 'Limited Redistribution of Halvek-Era Seizures',
        'Only lands seized during the Halvek regime may be redistributed. Current legal owners retain property.',
        [
          react('dravenni', 'Dravenni', 'strongly_support', 'Restitution for the Silent Clearances. Land stolen from our grandparents.', 15),
          react('halvekists', 'Halvekists', 'strongly_oppose', 'Directly targets their families\' wealth.', -10),
          react('workersCoalition', 'Workers Coalition', 'support', 'A step toward justice.', 6),
          react('reformists', 'Reformists', 'support', 'Targeted, proportional, justifiable.', 8),
          react('church', 'Church', 'reluctant', 'Church lands granted under Halvek would be at risk.', -5),
        ], 3, 14),
      variant('land_comprehensive', 'Comprehensive Land Reform',
        'Broad redistribution authority. Large holdings may be broken up for landless farmers and cooperatives.',
        [
          react('workersCoalition', 'Workers Coalition', 'strongly_support', 'Land to the tiller. The promise of the 1897 Revolution.', 15),
          react('dravenni', 'Dravenni', 'strongly_support', 'Full justice for the Clearances and beyond.', 20),
          react('businessClass', 'Business Class', 'strongly_oppose', 'Radical wealth redistribution terrifies every property owner.', -20),
          react('church', 'Church', 'strongly_oppose', 'Church estates — centuries of ecclesiastical holdings — would be subject to seizure.', -15),
          react('halvekists', 'Halvekists', 'strongly_oppose', 'The economic foundation of the old regime is under direct attack.', -15),
          react('reformists', 'Reformists', 'reluctant', 'Many moderates support reform but fear the economic disruption.', 2),
        ], -5, 0),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 12. MILITARY OVERSIGHT
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'military_oversight',
    name: 'Military Oversight',
    description: 'The degree of civilian control over the armed forces.',
    halvekStatus: 'The military is self-governing. The Chancellor is commander-in-chief but the officer corps operates with de facto autonomy.',
    theronArgument: 'A military that governs itself is not a defense force — it is a state within a state. Civilian control is not a threat to national security. It is the definition of it.',
    variants: [
      variant('military_self_governing', 'Military Self-Governing (Status Quo)',
        'The officer corps retains institutional autonomy. Civilian oversight is advisory.',
        [
          react('ironCovenant', 'Iron Covenant', 'strongly_support', 'The military knows best how to defend Veltria.', 15),
          react('halvekists', 'Halvekists', 'strongly_support', 'The military was Halvek\'s most reliable institution. Do not change it.', 10),
          react('reformists', 'Reformists', 'strongly_oppose', 'An autonomous military is a standing invitation to coups.', -12),
          react('businessClass', 'Business Class', 'support', 'A stable military is good for business confidence.', 5),
        ], 2, -8),
      variant('military_civilian_minister', 'Civilian Defense Minister With Advisory Council',
        'A civilian Defense Minister oversees the military, advised by an officer council.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'Civilian control within a framework that respects military expertise.', 10),
          react('ironCovenant', 'Iron Covenant', 'oppose', 'Civilian interference in military affairs is dangerous.', -5),
          react('halvekists', 'Halvekists', 'oppose', 'Weakens institutional continuity between governments.', -5),
          react('workersCoalition', 'Workers Coalition', 'support', 'Civilian oversight means the military cannot be used against strikers.', 5),
        ], 3, 12),
      variant('military_full_civilian', 'Full Civilian Control — Military Subordination',
        'The military is fully subordinate to civilian authority. Officers serve at the pleasure of the elected government.',
        [
          react('reformists', 'Reformists', 'strongly_support', 'The gold standard of democratic civil-military relations.', 15),
          react('ironCovenant', 'Iron Covenant', 'strongly_oppose', 'Existential threat to military autonomy. COUP RISK.', -20),
          react('halvekists', 'Halvekists', 'strongly_oppose', 'Destroys the military as an independent political force.', -15),
          react('workersCoalition', 'Workers Coalition', 'support', 'No more troops breaking strikes. Real civilian control.', 8),
          react('dravenni', 'Dravenni', 'strongly_support', 'Civilian control means Dravenni representatives can influence military policy.', 8),
        ], -3, 8),
    ],
  },
]

// ─── FACTION SEAT ALLOCATION (GDD) ──────────────────────────────────────────────

export const FACTION_SEATS: Record<keyof FactionState, number> = {
  halvekists: 88,
  workersCoalition: 42,
  reformists: 62,
  ironCovenant: 28,
  church: 15,
  businessClass: 10,
  dravenni: 5,
}

// ─── Assembly Vote Calculator ────────────────────────────────────────────────────

export function calculateAssemblyVotes(
  factions: FactionState,
  selectedVariants: Record<string, string>,
): { supportVotes: number; opposeVotes: number; threshold: number } {
  const totalSeats = 250
  let supportVotes = 0

  for (const provision of PROVISIONS) {
    const variantId = selectedVariants[provision.id]
    const variant = provision.variants.find(v => v.id === variantId)
    if (!variant) continue

    for (const reaction of variant.reactions) {
      const seats = FACTION_SEATS[reaction.faction] ?? 0
      const approval = factions[reaction.faction] ?? 50
      const approvalFactor = approval / 100
      supportVotes += Math.round(seats * approvalFactor * (reaction.value / Math.abs(reaction.value || 1)) * 0.15 + seats * approvalFactor * 0.05)
    }
  }

  // Baseline: each faction's seats weighted by approval
  let baseline = 0
  for (const [faction, seats] of Object.entries(FACTION_SEATS)) {
    const approval = factions[faction as keyof FactionState] ?? 50
    baseline += Math.round(seats * (approval / 100) * 0.4)
  }

  supportVotes = Math.max(0, Math.min(totalSeats, supportVotes + baseline))
  const opposeVotes = totalSeats - supportVotes

  return { supportVotes, opposeVotes, threshold: Math.ceil(totalSeats / 2) }
}

// ─── Referendum Forecast ────────────────────────────────────────────────────────

export function calculateReferendumForecast(
  factions: FactionState,
  publicImage: number,
  selectedVariants: Record<string, string>,
): number {
  let support = 45
    + (factions.reformists * 0.15)
    + (factions.workersCoalition * 0.10)
    + (factions.businessClass * 0.05)
    - (factions.halvekists * 0.20)
    - (factions.church * 0.15)
    - (factions.ironCovenant * 0.10)
    + (publicImage * 0.10)

  for (const provision of PROVISIONS) {
    const variantId = selectedVariants[provision.id]
    const variant = provision.variants.find(v => v.id === variantId)
    if (variant) support += variant.referendumModifier
  }

  return Math.max(0, Math.min(100, Math.round(support)))
}

export interface ReferendumOutlook {
  pct: number
  label: string
  color: string
  detail: string
}

export function getReferendumOutlook(pct: number): ReferendumOutlook {
  if (pct >= 60) return {
    pct, label: 'Likely Passes Comfortably', color: '#5a8a4a',
    detail: 'Broad support across multiple factions.',
  }
  if (pct >= 52) return {
    pct, label: 'Likely Passes Narrowly', color: '#7a9a3a',
    detail: 'Precarious but sufficient. Every point matters.',
  }
  if (pct >= 48) return {
    pct, label: 'Too Close to Call', color: '#a09030',
    detail: 'Genuinely uncertain. Both sides will contest every district.',
  }
  if (pct >= 42) return {
    pct, label: 'Likely Fails Narrowly', color: '#b06030',
    detail: 'Opposition consolidating. Key constituencies remain unconvinced.',
  }
  return {
    pct, label: 'Likely Fails Decisively', color: 'var(--accent-red)',
    detail: 'Insufficient support. A political defeat unless concessions are made.',
  }
}

// ─── Display Helpers ────────────────────────────────────────────────────────────

export const INTENSITY_LABELS: Record<ReactionIntensity, string> = {
  strongly_support: 'strongly supports',
  support: 'supports',
  reluctant: 'may accept reluctantly',
  neutral: 'is largely indifferent',
  oppose: 'opposes',
  strongly_oppose: 'will strongly oppose',
}

export const INTENSITY_COLORS: Record<ReactionIntensity, string> = {
  strongly_support: 'var(--accent-green)',
  support: '#5a8a4a',
  reluctant: '#8a7a3a',
  neutral: 'var(--muted)',
  oppose: '#a05030',
  strongly_oppose: 'var(--accent-red)',
}
