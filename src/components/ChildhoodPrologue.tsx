import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import type { StateModifier } from '../types/gameState'

// ─── Scene data ───────────────────────────────────────────────────────────────

type PrologueChoice = {
  id: string
  text: string
  modifiers: StateModifier[]
  flags: string[]
}

type PrologueScene = {
  year: number
  age: number
  title: string
  location: string
  narrative: string
  choices: PrologueChoice[]
  isTermFocus?: false
}

type TermFocusScene = {
  year: number
  age: number
  title: string
  location: string
  narrative: string
  isTermFocus: true
}

type AnyScene = PrologueScene | TermFocusScene

const SCENES: AnyScene[] = [
  // ─── SCENE 1: "Hungry" ──────────────────────────────────────────────────────
  {
    year: 1931, age: 12,
    title: 'Hungry',
    location: 'A cold kitchen in Kravenstal',
    narrative: `Your earliest clear memory is hunger.\n\nNot the kind that goes away after lunch — the kind that lives in the walls of a house, in the thinness of your mother's wrists, in the way your father counts bread slices with his eyes before cutting.\n\nThe factory closed six months ago. The one that employed half of Kravenstal, including your father. He leaves every morning anyway — puts on his coat, kisses your mother, walks into a city that has nothing for him. He comes home later each day.\n\nYour shoes have holes. You stuff them with newspaper. Your mother tells you this is temporary. She has been saying this for two years.\n\nToday is different. Your teacher didn't come to school. Instead, a man in a uniform stood at the front of the classroom and read from a paper. New rules. New names. The old flag came down during lunch. By the time you walked home, soldiers were on the corner of your street.\n\nYour father is at the kitchen table. The radio is off. He is reading a letter. His hands are shaking — not from cold.\n\n'Go to your room,' he says. But gently. As if the gentleness costs him something.\n\nYou don't go to your room.`,
    choices: [
      {
        id: 'sc1_patient',
        text: "You sat across from him and waited. You were twelve, but you knew that silence was sometimes the bravest thing a child could offer.",
        modifiers: [{ stat: 'personal.marriageHealth', operation: 'add', value: 5 }],
        flags: ['patient_child'],
      },
      {
        id: 'sc1_direct',
        text: "You asked him what was wrong. Directly. The way children do before they learn to be afraid of answers.",
        modifiers: [{ stat: 'personal.moralCompass', operation: 'add', value: 5 }],
        flags: ['direct_child', 'reformist_tendency'],
      },
      {
        id: 'sc1_practical',
        text: "'Are we going to be okay?' you asked. Not about politics. About dinner.",
        modifiers: [],
        flags: ['practical_child', 'pragmatist_tendency'],
      },
    ],
  },

  // ─── SCENE 2: "The Coat" ────────────────────────────────────────────────────
  {
    year: 1938, age: 19,
    title: 'The Coat',
    location: 'University of Ashenmere — Your first winter away from home',
    narrative: `You own one coat.\n\nIt was your father's. It is too large for you — the sleeves hang past your wrists, the shoulders sag. It smells like steel and tobacco and the particular exhaustion of a man who works with his hands to pay for his daughter's mind.\n\nThe other students have new coats. Leather gloves. Scarves that match. You can tell immediately who is here on scholarship and who is here because their family name opened the door.\n\nYou are the only student from Kravenstal.\n\nThe professors assume you are quiet because you are stupid. You are quiet because you are listening. In six months you will have the highest marks in constitutional law. In a year, Professor Aldric Theron will invite you to his private reading group — the one where they discuss the books that aren't on the syllabus. The ones that would get you expelled if the wrong person saw the titles.\n\nBut today you are standing in the snow outside the dormitory in your father's coat, and a boy with an expensive scarf is laughing at something. Maybe at you. Maybe not.\n\nIt doesn't matter.\n\nYou button the coat to the top. You walk inside.`,
    choices: [
      {
        id: 'sc2_acedemic',
        text: 'You studied harder than anyone. Not to prove them wrong — to prove your father right. He said education was the one thing they couldn\'t take from you.',
        modifiers: [{ stat: 'factions.reformists', operation: 'add', value: 10 }],
        flags: ['academic_fire'],
      },
      {
        id: 'sc2_solidarity',
        text: "You found others like you — scholarship students, children of workers, the ones with mended clothes and unmendable pride. You ate together. You read together. You became a unit.",
        modifiers: [{ stat: 'factions.workersCoalition', operation: 'add', value: 10 }],
        flags: ['solidarity_learned'],
      },
      {
        id: 'sc2_observer',
        text: 'You kept your head down. You watched how the wealthy ones moved, spoke, negotiated. You learned their language. You filed it away for later.',
        modifiers: [
          { stat: 'factions.businessClass', operation: 'add', value: 5 },
          { stat: 'personal.publicImage', operation: 'add', value: 3 },
        ],
        flags: ['strategic_observer'],
      },
    ],
  },

  // ─── SCENE 3: "What They Took" ──────────────────────────────────────────────
  {
    year: 1943, age: 24,
    title: 'What They Took',
    location: 'The Ashavel home — the morning everything ended',
    narrative: `You are home for the semester break when they come.\n\n3:47 in the morning. You know the time because you looked at the clock on the kitchen wall as the headlights swept across the ceiling. You will remember that clock face for the rest of your life. The small hand between three and four. The second hand still moving after everything else stopped.\n\nTwo men. BNI plainclothes. One tall with a scar along his jaw. One shorter, a gold ring on his left hand. They didn't knock. They didn't need to.\n\nYour father was already dressed. You realize later that he had been expecting this — maybe for months. He had prepared. His papers were already hidden. His coat was already on.\n\nYour mother made a sound you had never heard a human being make. It came from somewhere below language, below thought.\n\nYour father looked at you once. Not with fear. Not asking for rescue. He looked at you the way you look at something you are memorizing.\n\nThen the door closed.\n\nYour mother collapsed against the wall. You caught her.\n\nOutside, the car drove away slowly. They didn't even rush. That was the worst part. They had all the time in the world.`,
    choices: [
      {
        id: 'sc3_anchor',
        text: "You held your mother until morning. You did not cry. You did not speak. You became the foundation of a house that had just lost its roof.",
        modifiers: [
          { stat: 'personal.marriageHealth', operation: 'add', value: 10 },
          { stat: 'personal.moralCompass', operation: 'add', value: 10 },
        ],
        flags: ['family_anchor'],
      },
      {
        id: 'sc3_memorize',
        text: "You memorized their faces. The scar. The ring. The license plate. You wrote it all down before dawn — in a notebook you hid beneath a floorboard that still holds it today.",
        modifiers: [
          { stat: 'factions.ironCovenant', operation: 'add', value: 5 },
          { stat: 'personal.moralCompass', operation: 'add', value: 5 },
        ],
        flags: ['remembers_bni_agents'],
      },
      {
        id: 'sc3_forged',
        text: "Something broke in you that morning. Not your spirit — your patience. Every act of defiance, every campaign speech, every sleepless night that followed traces back to this kitchen at 3:47 in the morning.",
        modifiers: [
          { stat: 'personal.moralCompass', operation: 'add', value: 15 },
          { stat: 'factions.reformists', operation: 'add', value: 10 },
        ],
        flags: ['forged_in_loss'],
      },
    ],
  },

  // ─── SCENE 4: "The Climb" ───────────────────────────────────────────────────
  {
    year: 1951, age: 32,
    title: 'The Climb',
    location: 'A rented office in Ashenmere — eight years after',
    narrative: `Your father was executed in 1944. You learned this from a paragraph in a newspaper three months after it happened. Paragraph seven. Page twelve. Between a grain report and a weather forecast.\n\nYou kept that newspaper. You still have it.\n\nAfter the execution, you did not collapse. You finished your degree. You published your thesis — 'Constitutional Mechanisms of Authoritarian Capture' — which was quietly banned within six months and quietly photocopied by every law student in the country within a year.\n\nYou taught at the university. You were careful. You said the right things in the right rooms and the dangerous things in the rooms that mattered more. Theron protected you. Not because you needed protection, but because he recognized what you were becoming.\n\nNow you are here. A rented office above a printer's shop. Three volunteers and a telephone that works half the time.\n\nThe Civic Renewal Movement has asked you to run for a regional assembly seat. It is a small race in a small district. Nobody important is paying attention.\n\nYou are about to change that.\n\nThe walls are covered in constituency maps. Your shoes still have holes in the soles. Some things don't change. Some things have changed completely.`,
    choices: [
      {
        id: 'sc4_peoples',
        text: "You ran on your father's name — not his fame, because he had none, but his story. Every door you knocked on, you told them what Halvek's regime cost one family. Then you asked them what it cost theirs.",
        modifiers: [
          { stat: 'personal.publicImage', operation: 'add', value: 10 },
          { stat: 'factions.workersCoalition', operation: 'add', value: 5 },
          { stat: 'factions.reformists', operation: 'add', value: 5 },
        ],
        flags: ['peoples_candidate'],
      },
      {
        id: 'sc4_policy',
        text: "You ran on policy. Specific. Detailed. Ruthlessly competent. You knew more about the district's water infrastructure than the incumbent who had represented it for twelve years.",
        modifiers: [
          { stat: 'factions.reformists', operation: 'add', value: 10 },
          { stat: 'nation.economyHealth', operation: 'add', value: 5 },
        ],
        flags: ['policy_wonk'],
      },
      {
        id: 'sc4_operator',
        text: "You ran quietly. You made deals. You learned who controlled what, who owed whom, which levers moved which doors. You won by understanding the machinery before you tried to operate it.",
        modifiers: [
          { stat: 'factions.businessClass', operation: 'add', value: 5 },
          { stat: 'factions.halvekists', operation: 'add', value: 5 },
          { stat: 'personal.moralCompass', operation: 'add', value: -3 },
        ],
        flags: ['political_operator'],
      },
    ],
  },

  // ─── SCENE 5: "The Night Before" ────────────────────────────────────────────
  {
    year: 1962, age: 43,
    title: 'The Night Before',
    location: 'Campaign Headquarters, Ashenmere — 11:47pm',
    isTermFocus: true,
    narrative: `The numbers say you've won.\n\nEleven years of politics. Three elections. One failed, one narrow, and now this — a margin so wide that even the regime's loyal counters cannot manufacture enough ghosts to close it.\n\nTomorrow you will be Chancellor.\n\nThe headquarters is empty. Everyone has gone to celebrate or to sleep. You should do one or the other but instead you are here, at a desk covered in briefing papers, and you are reading the real numbers — the ones your transition team obtained through channels that weren't entirely legal.\n\nThey are worse than the public figures.\n\nThe treasury has been systematically drained. The military answers to General Brenner, not the civilian government. The BNI's files on half the current Assembly would end careers if released — which means whoever controls those files controls parliament. The Halvek Constitution gives you the power to rule by decree, which sounds like strength until you realize it was designed to make the Chancellor dependent on systems only the old guard understands.\n\nYou inherited a chair. Underneath it: a trapdoor.\n\nIn your pocket is a folded piece of paper. You've carried it for twenty years — since the morning they took your father. On it, one sentence in your handwriting at age twenty-four.\n\nYou unfold it.\n\nYou read it.\n\nYou put it back.\n\nTomorrow you will govern. Tonight you remember why.`,
  },
]

const TERM_OPTIONS = [
  'Economic Recovery',
  'Constitutional Reform',
  'Military & Security',
  'Social Welfare & Healthcare',
  'Education & Modernization',
  'National Unity & Minority Rights',
  'Foreign Policy & Diplomacy',
]

const TERM_FOCUS_EFFECTS: Record<string, StateModifier[]> = {
  'Economic Recovery':             [{ stat: 'factions.businessClass',    operation: 'add', value: 10 }],
  'Constitutional Reform':         [{ stat: 'factions.reformists',       operation: 'add', value: 10 }],
  'Military & Security':           [{ stat: 'factions.ironCovenant',     operation: 'add', value: 10 }],
  'Social Welfare & Healthcare':   [{ stat: 'factions.workersCoalition', operation: 'add', value: 10 }],
  'Education & Modernization':     [
    { stat: 'factions.reformists',       operation: 'add', value: 5 },
    { stat: 'factions.workersCoalition', operation: 'add', value: 5 },
  ],
  'National Unity & Minority Rights': [{ stat: 'factions.dravenni',            operation: 'add', value: 10 }],
  'Foreign Policy & Diplomacy':    [{ stat: 'nation.internationalStanding', operation: 'add', value: 10 }],
}

const YEARS = [1931, 1938, 1943, 1951, 1962]

function TimelineBar({ currentIndex }: { currentIndex: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 0, padding: '1.5rem 0 0.75rem',
    }}>
      {YEARS.map((year, i) => {
        const active = i === currentIndex
        const past   = i < currentIndex
        return (
          <div key={year} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{
                width: 52, height: 1,
                background: past ? 'rgba(200,144,42,0.6)' : 'rgba(200,144,42,0.18)',
                transition: 'background 0.5s',
              }}/>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{
                width:  active ? 14 : past ? 9 : 8,
                height: active ? 14 : past ? 9 : 8,
                borderRadius: '50%',
                background: active ? '#c8902a' : past ? 'rgba(200,144,42,0.5)' : 'rgba(200,144,42,0.2)',
                border: active ? '2px solid #e8b04a' : '1px solid rgba(200,144,42,0.3)',
                boxShadow: active ? '0 0 10px rgba(200,144,42,0.5)' : 'none',
                transition: 'all 0.4s ease',
              }}/>
              <span style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.58rem', letterSpacing: '0.1em',
                color: active ? '#c8902a' : past ? 'rgba(200,144,42,0.5)' : 'rgba(200,144,42,0.25)',
                transition: 'color 0.4s',
              }}>
                {year}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const SEPIA = {
  bg:        'radial-gradient(ellipse 100% 90% at 50% 45%, #7a4f24 0%, #3d2510 50%, #1a0e06 100%)',
  text:      '#d4c0a0',
  textDim:   '#8a7060',
  amber:     '#c8902a',
  title:     '#e8d0a0',
  choiceHover: '#e8c870',
}

function ChoiceLine({ text, onClick, selected, locked }: {
  text: string; onClick: () => void; selected: boolean; locked: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={locked}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'transparent', border: 'none',
        color: selected ? SEPIA.amber
              : hovered  ? SEPIA.choiceHover
              : SEPIA.textDim,
        fontFamily: "'IM Fell English', Georgia, serif",
        fontStyle: 'italic', fontSize: '1.05rem',
        lineHeight: 1.6, cursor: locked ? 'default' : 'pointer',
        textAlign: 'center', width: '100%',
        padding: '0.55rem 1rem',
        transition: 'color 0.2s',
        display: 'block',
        opacity: locked && !selected ? 0.35 : 1,
      }}
    >
      {selected && <span style={{ marginRight: '0.5rem', opacity: 0.7 }}>▸</span>}
      {text}
    </button>
  )
}

function TermFocusSelector({ onConfirm }: { onConfirm: (selected: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(opt: string) {
    if (selected.includes(opt)) {
      setSelected(selected.filter(s => s !== opt))
    } else if (selected.length < 3) {
      setSelected([...selected, opt])
    }
  }

  const remaining = 3 - selected.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', width: '100%' }}>
      {TERM_OPTIONS.map((opt, i) => {
        const rank = selected.indexOf(opt) + 1
        const isSelected = rank > 0
        const disabled = !isSelected && selected.length >= 3
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            disabled={disabled}
            style={{
              background: isSelected ? 'rgba(200,144,42,0.1)' : 'transparent',
              border: isSelected ? '1px solid rgba(200,144,42,0.4)' : '1px solid transparent',
              color: isSelected ? SEPIA.amber : disabled ? 'rgba(138,112,96,0.35)' : SEPIA.textDim,
              fontFamily: "'IM Fell English', Georgia, serif",
              fontStyle: 'italic', fontSize: '1rem',
              padding: '0.45rem 1.5rem', cursor: disabled ? 'default' : 'pointer',
              textAlign: 'center', width: '100%', maxWidth: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              transition: 'all 0.2s',
            }}
          >
            {isSelected && (
              <span style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.65rem', letterSpacing: '0.1em',
                color: SEPIA.amber, opacity: 0.7, minWidth: 28,
              }}>
                {rank === 1 ? '1ST' : rank === 2 ? '2ND' : '3RD'}
              </span>
            )}
            {!isSelected && <span style={{ minWidth: 28, display: 'inline-block' }}>{i + 1}.</span>}
            {opt}
          </button>
        )
      })}

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        {remaining > 0 ? (
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.65rem', letterSpacing: '0.15em',
            color: SEPIA.textDim, opacity: 0.7,
          }}>
            SELECT {remaining} MORE {remaining === 1 ? 'PRIORITY' : 'PRIORITIES'}
          </p>
        ) : (
          <button
            onClick={() => onConfirm(selected)}
            style={{
              background: 'transparent',
              border: '2px solid rgba(200,144,42,0.7)',
              color: SEPIA.amber,
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.75rem', letterSpacing: '0.2em',
              padding: '0.7rem 2.5rem', cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,144,42,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Begin My Chancellorship
          </button>
        )}
      </div>
    </div>
  )
}

function FinalTransition({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 3000)
    const t2 = setTimeout(() => setPhase(2), 4000)
    const t3 = setTimeout(() => setPhase(3), 6000)
    const t4 = setTimeout(onDone,           8000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeIn' }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '1.5rem',
      }}
    >
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            key="date-won"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ textAlign: 'center' }}
          >
            <p style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.8rem', letterSpacing: '0.3em',
              color: 'rgba(200,144,42,0.7)',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}>
              March 15, 1963
            </p>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 600, color: '#d4c9b0',
              letterSpacing: '0.05em', margin: 0,
            }}>
              You won.
            </h2>
          </motion.div>
        )}
        {phase >= 2 && (
          <motion.p
            key="govern"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '1.5rem',
              color: 'rgba(200,144,42,0.8)',
              letterSpacing: '0.08em',
            }}
          >
            Now govern.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main prologue component ──────────────────────────────────────────────────

export default function ChildhoodPrologue() {
  const [sceneIndex,    setSceneIndex]    = useState(0)
  const [chosenId,      setChosenId]      = useState<string | null>(null)
  const [advancing,     setAdvancing]     = useState(false)
  const [termConfirmed, setTermConfirmed] = useState(false)

  const [accMods,  setAccMods]  = useState<StateModifier[]>([])
  const [accFlags, setAccFlags] = useState<string[]>([])

  const applyModifiers = useGameStore(s => s.applyModifiers)
  const setTermFocus   = useGameStore(s => s.setTermFocus)
  const addFlags       = useNarrativeStore(s => s.addFlags)
  const initWeek       = useWeekStore(s => s.initWeek)

  const scene = SCENES[sceneIndex]

  function handleChoice(choice: PrologueChoice) {
    if (chosenId || advancing) return
    setChosenId(choice.id)
    setAccMods(m => [...m, ...choice.modifiers])
    setAccFlags(f => [...f, ...choice.flags])

    setAdvancing(true)
    setTimeout(() => {
      if (sceneIndex < SCENES.length - 1) {
        setSceneIndex(i => i + 1)
        setChosenId(null)
        setAdvancing(false)
      }
    }, 900)
  }

  const handleTermFocus = useCallback((priorities: string[]) => {
    if (termConfirmed) return
    setTermConfirmed(true)

    const termMods: StateModifier[] = []
    for (const p of priorities) {
      const fx = TERM_FOCUS_EFFECTS[p]
      if (fx) termMods.push(...fx)
    }

    applyModifiers([...accMods, ...termMods])
    addFlags(accFlags)
    setTermFocus(priorities)
  }, [termConfirmed, accMods, accFlags, applyModifiers, addFlags, setTermFocus])

  const isTermFocus = scene.isTermFocus === true
  const showTransition = isTermFocus && termConfirmed

  return (
    <>
      <motion.div
        key={`scene-${sceneIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: showTransition ? 0 : 1 }}
        transition={{ duration: showTransition ? 0.5 : 0.7, ease: 'easeOut' }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: SEPIA.bg,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          minHeight: '100vh',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }}/>

        <div style={{
          position: 'relative', zIndex: 1, flexShrink: 0,
          paddingBottom: '8px',
        }}>
          <TimelineBar currentIndex={sceneIndex}/>
        </div>

        <div style={{
          flex: 1, position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-start',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '32px 2rem 2rem 2rem',
          scrollPaddingTop: '16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          <div style={{ maxWidth: 680, width: '100%' }}>

            <p style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.65rem', letterSpacing: '0.25em',
              color: SEPIA.amber, opacity: 0.75,
              textTransform: 'uppercase', textAlign: 'center',
              marginBottom: '0.5rem',
            }}>
              {scene.year} — Age {scene.age}
            </p>

            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontWeight: 600, color: SEPIA.title,
              textAlign: 'center', letterSpacing: '0.03em',
              margin: '24px 0 0.3rem 0',
              position: 'relative',
              zIndex: 5,
              overflow: 'visible',
              lineHeight: 1.15,
            }}>
              {scene.title}
            </h2>

            <p style={{
              fontFamily: "'IM Fell English', Georgia, serif",
              fontStyle: 'italic', fontSize: '0.82rem',
              color: SEPIA.textDim, textAlign: 'center',
              marginBottom: '1.8rem', opacity: 0.8,
            }}>
              {scene.location}
            </p>

            <div style={{ marginBottom: '2.5rem' }}>
              {scene.narrative.split('\n\n').map((para, i) => (
                <p key={i} style={{
                  fontFamily: "'IM Fell English', Georgia, serif",
                  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                  color: SEPIA.text, lineHeight: 1.8,
                  textAlign: 'center',
                  marginBottom: i < scene.narrative.split('\n\n').length - 1 ? '1.2em' : 0,
                }}>
                  {para}
                </p>
              ))}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              marginBottom: '2rem',
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(200,144,42,0.2)' }}/>
              <div style={{ width: 4, height: 4, background: 'rgba(200,144,42,0.4)', transform: 'rotate(45deg)' }}/>
              <div style={{ flex: 1, height: 1, background: 'rgba(200,144,42,0.2)' }}/>
            </div>

            {!isTermFocus && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center', paddingBottom: '1rem' }}>
                {(scene as PrologueScene).choices.map(ch => (
                  <ChoiceLine
                    key={ch.id}
                    text={ch.text}
                    onClick={() => handleChoice(ch)}
                    selected={chosenId === ch.id}
                    locked={!!chosenId && chosenId !== ch.id}
                  />
                ))}
              </div>
            )}

            {isTermFocus && !termConfirmed && (
              <div style={{ paddingBottom: '1rem' }}>
                <p style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.1rem', fontStyle: 'italic',
                  color: SEPIA.text, textAlign: 'center',
                  marginBottom: '0.5rem', opacity: 0.9,
                }}>
                  You take a blank sheet from the desk.
                </p>
                <p style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.05rem', fontStyle: 'italic',
                  color: SEPIA.text, textAlign: 'center',
                  marginBottom: '1.5rem', opacity: 0.85,
                }}>
                  Three commitments. Written in your hand.
                </p>
                <p style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.62rem', letterSpacing: '0.15em',
                  color: SEPIA.textDim, textAlign: 'center',
                  marginBottom: '1.2rem', textTransform: 'uppercase',
                }}>
                  What will define your chancellorship?
                </p>
                <TermFocusSelector onConfirm={handleTermFocus}/>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {showTransition && <FinalTransition onDone={initWeek}/>}
    </>
  )
}
