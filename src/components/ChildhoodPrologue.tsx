import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import prologueMusic from '../assets/audio/music/mandate_distorted_cello_drone.mp3'

const splashImages = import.meta.glob<{ default: string }>(
  '../assets/images/prologue/splash_*.{jpg,jpeg,png}',
  { eager: true },
)
function getSplashForYear(year: number): string | null {
  for (const path in splashImages) {
    if (path.includes(`splash_${year}`)) return splashImages[path].default
  }
  return null
}

type CinematicScene = {
  year: number
  age: number
  title: string
  location: string
  paragraphs: string[]
}

const SCENES: CinematicScene[] = [
  {
    year: 1931, age: 12,
    title: 'The Cold Decree',
    location: 'The Republic, under the new regime',
    paragraphs: [
      "By 1931, Chancellor Halvek had been in power six years. The factories were closing one by one — not from ruin, but from decree, redirected to serve ministries no one elected.",
      "Bread lines formed before dawn in every province. The men stood at the factory gates anyway, out of habit, out of hope, out of nowhere else to stand.",
      "The old flag came down that winter. New rules, new names, and a uniform at the front of every classroom reading from a paper no one had voted on.",
      "The Republic was wrapped in a regime that promised order, but delivered only control. The wealth of Veltria flowed upward to the Party elite, while the workers' rations were cut.",
    ],
  },
  {
    year: 1938, age: 19,
    title: 'The Silence',
    location: 'Ashenmere, under the Directorate',
    paragraphs: [
      "The country had learned to be quiet by 1938. The reading groups met underground now. Books that mattered passed hand to hand with the covers torn off, so a search would find nothing worth confiscating.",
      "A wrong word in the wrong seminar and a student simply stopped attending. No one asked where he went. Everyone already knew not to ask.",
      "The press was nationalized entirely. The state decided what the people were allowed to know, and the punishment for the truth was exile or worse.",
      "Fear became the ultimate enforcer. The state didn't need to arrest everyone; it only needed to make the silence deafening enough that no one dared to break it.",
    ],
  },
  {
    year: 1943, age: 24,
    title: 'What They Took',
    location: 'The Provinces, 3:47 in the morning',
    paragraphs: [
      "By 1943, the BNI had taken thousands. The pharmacist on one street. The teacher who vanished between the autumn term and the spring. Every family in the country had learned the sound of a car engine idling at night.",
      "They didn't knock. They never needed to. The taking wasn't the point — the certainty that no one could stop it was the point.",
      "The state machinery consumed its own citizens, one street at a time. The infrastructure crumbled while the Party built monuments to itself.",
      "The country was locked in a basement of its own making, and the door was guarded by fear.",
    ],
  },
  {
    year: 1951, age: 32,
    title: 'Those Who Came',
    location: 'A rented office, three flights up',
    paragraphs: [
      "By 1951, ordinary people had run out of official doors to knock on. A widow with a petition no ministry would accept. Dockworkers whose union had been dissolved by decree. A schoolteacher wanting to know if the constitution still technically existed.",
      "They climbed three flights of stairs to a rented office above a printer's shop, because someone had told them there was a lawyer there who actually listened.",
      "You were afraid, most days. You saw them anyway. Every one.",
      "It was the dockworkers who said it first, out loud, the thing that had been building in that stairwell for months: the country needed someone who would not look away. They had started to believe that person was you.",
    ],
  },
  {
    year: 1958, age: 39,
    title: 'The Square',
    location: 'Foundry Square, Kravenstal — the winter strike',
    paragraphs: [
      "The strike began at the steelworks and spread like water finding cracks. By the third week there were eleven thousand people in Foundry Square and troops at every street leading into it.",
      "You came to deliver legal papers. That is what you told yourself afterward. But the crowd recognized the lawyer who never turned anyone away, and it did not ask permission. Hands you did not choose lifted you onto the flatbed of a truck.",
      "You spoke. You do not remember deciding to. You said the thing everyone already knew and no one had said aloud: that the country belonged to the people who built it, and it had been stolen, and stolen things could be taken back.",
      "Somewhere in the crowd, your name became a chant. They did not follow you because you were the loudest voice in Veltria. They followed you because for the first time in decades, someone had looked back at them instead of past them.",
    ],
  },
  {
    year: 1962, age: 43,
    title: 'The Night Before',
    location: 'Campaign Headquarters, Ashenmere — 11:47pm',
    paragraphs: [
      "The numbers said you'd won. A margin so wide that even Halvek's successors could not manufacture enough ghosts to close it.",
      "The treasury had been drained for thirty years. The military answered to men who had never once answered to a ballot. You inherited a chair, and underneath it, a country that had been waiting a long time for someone to actually sit in it.",
      "Tomorrow you would govern a nation that had spent three decades looking for a light in the dark and had, somewhere along the way, decided to place their faith in you.",
      "Tonight, you remembered exactly why they had.",
    ],
  },
]

const DEFAULT_MODIFIERS = [
  { stat: 'personal.moralCompass',     operation: 'add' as const, value: 10 },
  { stat: 'personal.publicImage',      operation: 'add' as const, value: 8  },
  { stat: 'factions.reformists',       operation: 'add' as const, value: 8  },
  { stat: 'factions.workersCoalition', operation: 'add' as const, value: 5  },
  { stat: 'personal.marriageHealth',   operation: 'add' as const, value: 5  },
]

const DEFAULT_FLAGS = ['prologue_cinematic', 'forged_in_loss', 'academic_fire']

const PARA_INTERVAL = 4500
const SCENE_HOLD    = 1200
const TITLE_HOLD    = 3000

const YEARS = [1931, 1938, 1943, 1951, 1958, 1962]

function TimelineBar({ currentIndex }: { currentIndex: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 0, padding: '2rem 0 0.5rem',
    }}>
      {YEARS.map((year, i) => {
        const active = i === currentIndex
        const past   = i < currentIndex
        return (
          <div key={year} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{
                width: 52, height: 1,
                background: past ? 'rgba(200,144,42,0.35)' : 'rgba(255,255,255,0.08)',
                transition: 'background 0.5s',
              }}/>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{
                width:  active ? 14 : past ? 9 : 8,
                height: active ? 14 : past ? 9 : 8,
                borderRadius: '50%',
                background: active ? '#c8902a' : past ? 'rgba(200,144,42,0.3)' : 'rgba(255,255,255,0.1)',
                border: active ? '2px solid rgba(200,144,42,0.8)' : '1px solid rgba(255,255,255,0.15)',
                boxShadow: active ? '0 0 12px rgba(200,144,42,0.6), 0 0 24px rgba(200,144,42,0.2)' : 'none',
                transition: 'all 0.4s ease',
              }}/>
              <span style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.58rem', letterSpacing: '0.1em',
                color: active ? 'rgba(200,144,42,0.9)' : past ? 'rgba(200,144,42,0.35)' : 'rgba(255,255,255,0.15)',
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

function ChapterCard({ scene }: { scene: CinematicScene }) {
  return (
    <motion.div
      key={`chapter-${scene.year}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '0.6rem', textAlign: 'center',
      }}
    >
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.6rem', letterSpacing: '0.35em',
        color: 'rgba(200,144,42,0.55)',
        textTransform: 'uppercase', margin: 0,
      }}>
        {scene.year} — Age {scene.age}
      </p>
      <h2 style={{
        fontFamily: "'Great Vibes', cursive",
        fontSize: 'clamp(3rem, 6vw, 4.5rem)',
        fontWeight: 400, color: '#e8dcc8',
        margin: 0, lineHeight: 1.1,
        textShadow: '0 0 40px rgba(200,144,42,0.15)',
      }}>
        {scene.title}
      </h2>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.58rem', letterSpacing: '0.2em',
        color: 'rgba(200,144,42,0.4)',
        textTransform: 'uppercase', margin: 0,
      }}>
        {scene.location}
      </p>
    </motion.div>
  )
}

function InkSplashReveal({ src, onDone }: { src: string; onDone: () => void }) {
  const [phase, setPhase] = useState<'bloom' | 'hold' | 'recede'>('bloom')
  
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'),   2600)
    const t2 = setTimeout(() => setPhase('recede'), 5800)
    const t3 = setTimeout(() => onDoneRef.current(), 7600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])
  
  const r   = phase === 'recede' ? '0%' : '75%'
  const dur = phase === 'bloom'  ? 2.6  : phase === 'recede' ? 1.8 : 0
  return (
    <div
      onClick={() => onDoneRef.current()}
      style={{ position: 'absolute', inset: 0, zIndex: 3, cursor: 'pointer' }}
    >
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="ink-distort" x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.026" numOctaves="3" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="80" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <mask id="ink-mask">
            <motion.circle
              cx="50%" cy="50%"
              initial={{ r: '0%' }}
              animate={{ r }}
              transition={{ duration: dur, ease: 'easeInOut' }}
              fill="white"
              filter="url(#ink-distort)"
            />
          </mask>
        </defs>
        <motion.image
          href={src}
          width="100%" height="100%"
          preserveAspectRatio="xMidYMid slice"
          mask="url(#ink-mask)"
          initial={{ scale: 1 }}
          animate={{ scale: 1.06 }}
          transition={{ duration: 7.6, ease: 'linear' }}
          style={{
            filter: 'sepia(0.4) contrast(1.05) brightness(0.85)',
            transformOrigin: '50% 50%',
            transformBox: 'fill-box',
          }}
        />
      </svg>
    </div>
  )
}

export default function ChildhoodPrologue() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [paraIndex,  setParaIndex]  = useState(-1)
  const [splashDone, setSplashDone] = useState(false)
  const [done,       setDone]       = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(prologueMusic)
    audio.loop = true
    audio.volume = 0.6
    audio.play().catch(() => console.log("Autoplay blocked, will play on interaction"))
    audioRef.current = audio

    const playOnInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {})
      }
    }
    document.addEventListener('click', playOnInteraction)
    document.addEventListener('keydown', playOnInteraction)

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
      document.removeEventListener('click', playOnInteraction)
      document.removeEventListener('keydown', playOnInteraction)
    }
  }, [])

  const applyModifiers = useGameStore(s => s.applyModifiers)
  const addFlags       = useNarrativeStore(s => s.addFlags)
  const initWeek       = useWeekStore(s => s.initWeek)

  // Stable refs — store selectors can change identity on every render
  const applyRef  = useRef(applyModifiers)
  const flagsRef  = useRef(addFlags)
  const weekRef   = useRef(initWeek)
  applyRef.current = applyModifiers
  flagsRef.current = addFlags
  weekRef.current  = initWeek

  const doneRef = useRef(done)
  doneRef.current = done

  const finish = useCallback(() => {
    if (doneRef.current) return
    setDone(true)
    applyRef.current(DEFAULT_MODIFIERS)
    flagsRef.current(DEFAULT_FLAGS)
    weekRef.current()
  }, [])  // empty deps — all values accessed via refs

  const scene           = SCENES[sceneIndex]
  const showChapterCard = paraIndex === -1
  const splashSrc       = getSplashForYear(scene.year)
  const showSplash      = !!splashSrc && !splashDone

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (done || showSplash) return

    if (showChapterCard) {
      timerRef.current = setTimeout(() => setParaIndex(0), TITLE_HOLD)
      return
    }

    if (paraIndex < scene.paragraphs.length - 1) {
      timerRef.current = setTimeout(() => setParaIndex(i => i + 1), PARA_INTERVAL)
      return
    }

    timerRef.current = setTimeout(() => {
      if (sceneIndex < SCENES.length - 1) {
        setSceneIndex(i => i + 1)
        setParaIndex(-1)
        setSplashDone(false)
      } else {
        finish()
      }
    }, SCENE_HOLD)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [sceneIndex, paraIndex, done, showChapterCard, showSplash, scene.paragraphs.length])

  return (
    <>
      <motion.div
        key={`scene-${sceneIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: done ? 0 : 1 }}
        transition={{ duration: done ? 0.8 : 0.7, ease: 'easeOut' }}
        onClick={() => finish()}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: '#0a0906',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', minHeight: '100vh',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        {/* Film grain */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          opacity: 0.16,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}/>

        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 75% 65% at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)',
        }}/>

        {/* Timeline — floating overlay, does not affect layout */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}>
          <TimelineBar currentIndex={sceneIndex}/>
        </div>

        {/* Ink splash image */}
        {showSplash && (
          <InkSplashReveal
            src={splashSrc!}
            onDone={() => setSplashDone(true)}
          />
        )}

        {/* Content area */}
        <div style={{
          flex: 1, position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem',
        }}>
          <div style={{ maxWidth: 680, width: '100%', textAlign: 'center' }}>
            <AnimatePresence mode="wait">
              {showSplash ? null : showChapterCard ? (
                <ChapterCard key={`card-${sceneIndex}`} scene={scene} />
              ) : (
                <motion.div
                  key={`paras-${sceneIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  {scene.paragraphs.map((para, i) => (
                    <motion.p
                      key={`p-${sceneIndex}-${i}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{
                        opacity: i <= paraIndex ? (i === paraIndex ? 1 : 0.35) : 0,
                        y: i <= paraIndex ? 0 : 4,
                      }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      style={{
                        fontFamily: "'IM Fell English', Georgia, serif",
                        fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                        color: '#e8dcc8',
                        lineHeight: 1.9, textAlign: 'center',
                        marginBottom: i < scene.paragraphs.length - 1 ? '1.2em' : 0,
                      }}
                    >
                      {para}
                    </motion.p>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Skip hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 5, duration: 1.5 }}
          style={{
            position: 'absolute', bottom: '2rem', width: '100%',
            textAlign: 'center', zIndex: 1,
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.52rem', letterSpacing: '0.25em',
            color: '#fff', textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          Click anywhere to skip
        </motion.p>
      </motion.div>
    </>
  )
}