// Distinctive SVG silhouette portraits for all named NPCs.
// 100×100 viewBox; caller renders inside an 80px circle frame.

import type { FC } from 'react'

const S = '#2d2318'   // silhouette
const H = '#1e1710'   // hair
const LIGHT = '#d8c8a8' // light feature colour (collar, glasses)
const AMBER = '#c8902a'

// ── Gradient background shared across all portraits ────────────────────────
function PBG({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={id} cx="50%" cy="38%" r="65%">
        <stop offset="0%"   stopColor="#e8d9be"/>
        <stop offset="100%" stopColor="#bfa07a"/>
      </radialGradient>
    </defs>
  )
}

// ── Standard body/neck ─────────────────────────────────────────────────────
function StandardBody({ wide = false }: { wide?: boolean }) {
  return wide ? (
    <>
      <path d="M0,100 L0,76 Q18,70 40,66 L50,64 L60,66 Q82,70 100,76 L100,100 Z" fill={S}/>
      <rect x="44" y="62" width="12" height="14" fill={S}/>
    </>
  ) : (
    <>
      <path d="M0,100 L0,79 Q20,73 44,69 L50,67 L56,69 Q80,73 100,79 L100,100 Z" fill={S}/>
      <rect x="45" y="65" width="10" height="14" fill={S}/>
    </>
  )
}

// ── VYKTOR REZNIK — narrow/angular, receding hairline, thin ───────────────
export const VyktorReznik: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-vr"/>
    <rect width="100" height="100" fill="url(#bg-vr)"/>
    {/* Very minimal side-only hair (receding) */}
    <path d="M33,44 L33,28 Q36,18 50,16 Q64,18 67,28 L67,44 Q63,26 50,24 Q37,26 33,44 Z" fill={H}/>
    {/* Narrow angular head */}
    <ellipse cx="50" cy="46" rx="17" ry="29" fill={S}/>
    {/* Thin build */}
    <path d="M0,100 L0,82 Q20,77 44,73 L50,72 L56,73 Q80,77 100,82 L100,100 Z" fill={S}/>
    <rect x="46" y="73" width="8" height="10" fill={S}/>
  </svg>
)

// ── ELARA VOSTANE — severe, glasses, tight pulled-back hair ───────────────
export const ElaraVostane: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-ev"/>
    <rect width="100" height="100" fill="url(#bg-ev)"/>
    {/* Tight pulled-back hair */}
    <path d="M32,44 Q31,18 50,14 Q69,18 68,44 Q66,26 50,23 Q34,26 32,44 Z" fill={H}/>
    {/* Small bun at back */}
    <ellipse cx="50" cy="15" rx="10" ry="7" fill={H}/>
    {/* Standard head */}
    <ellipse cx="50" cy="46" rx="21" ry="27" fill={S}/>
    {/* Glasses — two rectangular frames */}
    <rect x="30" y="40" width="14" height="9" rx="1.5" fill="none" stroke={LIGHT} strokeWidth="1.5"/>
    <rect x="56" y="40" width="14" height="9" rx="1.5" fill="none" stroke={LIGHT} strokeWidth="1.5"/>
    <line x1="44" y1="44" x2="56" y2="44" stroke={LIGHT} strokeWidth="1"/>
    <StandardBody/>
  </svg>
)

// ── GREGOR MARIĆ — broad, heavy, short hair, thick neck ───────────────────
export const GregorMaric: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-gm"/>
    <rect width="100" height="100" fill="url(#bg-gm)"/>
    {/* Very short crew-cut hair */}
    <path d="M22,47 Q22,22 50,18 Q78,22 78,47 Q74,30 50,27 Q26,30 22,47 Z" fill={H}/>
    {/* Wide, round head — strong jaw */}
    <ellipse cx="50" cy="49" rx="28" ry="25" fill={S}/>
    {/* Thick neck */}
    <rect x="40" y="72" width="20" height="12" fill={S}/>
    {/* Wide shoulders */}
    <path d="M0,100 L0,74 Q16,68 36,64 L50,62 L64,64 Q84,68 100,74 L100,100 Z" fill={S}/>
  </svg>
)

// ── COLONEL IRINA DUSEK — military, short neat hair, stern ────────────────
export const IrinaDusek: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-id"/>
    <rect width="100" height="100" fill="url(#bg-id)"/>
    {/* Short, neat military hair */}
    <path d="M30,44 Q30,20 50,17 Q70,20 70,44 Q67,28 50,26 Q33,28 30,44 Z" fill={H}/>
    {/* Standard-angular head */}
    <ellipse cx="50" cy="46" rx="21" ry="27" fill={S}/>
    <rect x="44" y="71" width="12" height="12" fill={S}/>
    {/* Military uniform body */}
    <path d="M0,100 L0,77 Q20,71 42,67 L50,65 L58,67 Q80,71 100,77 L100,100 Z" fill={S}/>
    {/* Military collar */}
    <path d="M44,65 L40,73 L48,73 L50,69 L52,73 L60,73 L56,65 Z" fill={S}/>
    {/* Epaulettes */}
    <rect x="20" y="69" width="18" height="5" rx="1" fill={S}/>
    <rect x="62" y="69" width="18" height="5" rx="1" fill={S}/>
  </svg>
)

// ── PROFESSOR ALDRIC THERON — elderly, wild eyebrows, unkempt hair ────────
export const AldricTheron: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-at"/>
    <rect width="100" height="100" fill="url(#bg-at)"/>
    {/* Wild bushy hair extending well beyond head */}
    <path d="M26,44 Q22,10 50,6 Q78,10 74,44 Q70,18 50,15 Q30,18 26,44 Z" fill={H}/>
    {/* Wild side tufts */}
    <path d="M24,38 Q16,32 18,26 Q22,20 28,28 Z" fill={H}/>
    <path d="M76,38 Q84,32 82,26 Q78,20 72,28 Z" fill={H}/>
    {/* Head - slightly narrow, elderly */}
    <ellipse cx="50" cy="47" rx="20" ry="27" fill={S}/>
    {/* Prominent wild eyebrows */}
    <path d="M31,38 Q37,33 43,37" fill="none" stroke={H} strokeWidth="3" strokeLinecap="round"/>
    <path d="M57,37 Q63,33 69,38" fill="none" stroke={H} strokeWidth="3" strokeLinecap="round"/>
    {/* Slightly stooped thin shoulders */}
    <path d="M0,100 L0,80 Q22,75 44,71 L50,70 L56,71 Q78,75 100,80 L100,100 Z" fill={S}/>
    <rect x="45" y="72" width="10" height="10" fill={S}/>
  </svg>
)

// ── DANIKA OBERLIN — sharp, alert, journalist energy ──────────────────────
export const DanikaOberlin: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-do"/>
    <rect width="100" height="100" fill="url(#bg-do)"/>
    {/* Practical chin-length hair */}
    <path d="M30,46 Q28,18 50,14 Q72,18 70,46 Q68,22 50,19 Q32,22 30,46 Z" fill={H}/>
    {/* Hair at sides, chin-length */}
    <path d="M29,46 Q26,58 28,68 Q32,72 34,66 Q33,56 32,48" fill={H}/>
    <path d="M71,46 Q74,58 72,68 Q68,72 66,66 Q67,56 68,48" fill={H}/>
    {/* Head — slightly forward-leaning (oval shifted slightly) */}
    <ellipse cx="50" cy="46" rx="21" ry="27" fill={S}/>
    <StandardBody/>
  </svg>
)

// ── ARCHBISHOP STANISLOV RENEK — round, warm, clerical collar ─────────────
export const StanislovRenek: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-sr"/>
    <rect width="100" height="100" fill="url(#bg-sr)"/>
    {/* Very short/thin hair on a round head */}
    <path d="M24,48 Q24,24 50,20 Q76,24 76,48 Q72,32 50,29 Q28,32 24,48 Z" fill={H}/>
    {/* Round, warm, full face */}
    <ellipse cx="50" cy="49" rx="27" ry="25" fill={S}/>
    {/* Clerical collar — white ring */}
    <rect x="42" y="72" width="16" height="10" fill={S}/>
    <ellipse cx="50" cy="74" rx="12" ry="5" fill={LIGHT}/>
    <ellipse cx="50" cy="72" rx="9" ry="4" fill={S}/>
    {/* Wide, rounded body */}
    <path d="M0,100 L0,75 Q16,70 38,66 L50,64 L62,66 Q84,70 100,75 L100,100 Z" fill={S}/>
  </svg>
)

// ── DRAŽEN KOLVAR — slick parted hair, politician's calculating look ──────
export const DrazenKolvar: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-dk"/>
    <rect width="100" height="100" fill="url(#bg-dk)"/>
    {/* Slicked-back hair with side part */}
    <path d="M31,43 Q30,18 50,15 Q70,18 69,43 Q67,24 52,21 Q36,22 31,43 Z" fill={H}/>
    {/* Hair part — slightly asymmetric */}
    <path d="M50,21 Q46,15 42,20" fill="none" stroke={S} strokeWidth="1.5"/>
    {/* Standard oval head, slightly wider at jaw */}
    <ellipse cx="50" cy="46" rx="22" ry="27" fill={S}/>
    {/* Well-groomed suit */}
    <path d="M0,100 L0,79 Q20,73 44,69 L50,67 L56,69 Q80,73 100,79 L100,100 Z" fill={S}/>
    <rect x="45" y="65" width="10" height="14" fill={S}/>
    {/* Tie */}
    <path d="M48,67 L50,82 L52,67" fill={AMBER} opacity="0.5"/>
  </svg>
)

// ── SORAYA KHALED — weathered, fierce, longer textured hair ───────────────
export const SorayaKhaled: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-sk"/>
    <rect width="100" height="100" fill="url(#bg-sk)"/>
    {/* Longer, fuller hair — past shoulders */}
    <path d="M28,44 Q24,14 50,10 Q76,14 72,44 Q70,18 50,15 Q30,18 28,44 Z" fill={H}/>
    <path d="M27,44 Q22,62 24,78 Q28,84 32,76 Q30,62 30,46" fill={H}/>
    <path d="M73,44 Q78,62 76,78 Q72,84 68,76 Q70,62 70,46" fill={H}/>
    {/* Strong face */}
    <ellipse cx="50" cy="46" rx="22" ry="28" fill={S}/>
    {/* Lean, determined build */}
    <path d="M0,100 L0,80 Q20,74 44,70 L50,68 L56,70 Q80,74 100,80 L100,100 Z" fill={S}/>
    <rect x="45" y="72" width="10" height="10" fill={S}/>
  </svg>
)

// ── MARGRAVE LUCAN VAEL — jowly, well-fed, expensive suit ─────────────────
export const LucanVael: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-lv"/>
    <rect width="100" height="100" fill="url(#bg-lv)"/>
    {/* Neat, thinning hair */}
    <path d="M25,48 Q25,24 50,20 Q75,24 75,48 Q71,32 50,29 Q29,32 25,48 Z" fill={H}/>
    {/* Jowly wide head — wider at jaw */}
    <ellipse cx="50" cy="49" rx="28" ry="26" fill={S}/>
    {/* Thick neck */}
    <rect x="42" y="73" width="16" height="11" fill={S}/>
    {/* Wide, expensive-suited body */}
    <path d="M0,100 L0,74 Q16,68 36,64 L50,62 L64,64 Q84,68 100,74 L100,100 Z" fill={S}/>
    {/* Expensive lapels */}
    <path d="M42,66 L38,76 L50,68 L62,76 L58,66" fill={S}/>
  </svg>
)

// ── GENERAL OSKAR BRENNER — imposing, old guard, heavily built ────────────
export const OskarBrenner: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-ob"/>
    <rect width="100" height="100" fill="url(#bg-ob)"/>
    {/* Very close-cropped hair */}
    <path d="M22,46 Q22,23 50,19 Q78,23 78,46 Q75,30 50,27 Q25,30 22,46 Z" fill={H}/>
    {/* Imposing wide head */}
    <ellipse cx="50" cy="48" rx="28" ry="26" fill={S}/>
    {/* Thick neck */}
    <rect x="40" y="72" width="20" height="10" fill={S}/>
    {/* Very wide military build */}
    <path d="M0,100 L0,72 Q14,66 32,62 L50,60 L68,62 Q86,66 100,72 L100,100 Z" fill={S}/>
    {/* Heavy epaulettes */}
    <rect x="14" y="64" width="22" height="6" rx="1" fill={S}/>
    <rect x="64" y="64" width="22" height="6" rx="1" fill={S}/>
    {/* Medals */}
    <circle cx="40" cy="78" r="3" fill={AMBER} opacity="0.6"/>
    <circle cx="50" cy="78" r="3" fill={AMBER} opacity="0.6"/>
    <circle cx="60" cy="78" r="3" fill={AMBER} opacity="0.6"/>
  </svg>
)

// ── NADIA VOSS — young, bright-eyed, press correspondent ──────────────────
export const NadiaVoss: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-nv"/>
    <rect width="100" height="100" fill="url(#bg-nv)"/>
    {/* Modern, slightly asymmetric hair */}
    <path d="M31,44 Q30,16 50,13 Q70,16 69,44 Q67,22 50,19 Q33,22 31,44 Z" fill={H}/>
    {/* Side sweep */}
    <path d="M31,36 Q24,44 26,54 Q28,60 32,54 Q31,46 33,38" fill={H}/>
    {/* Young, round-ish face */}
    <ellipse cx="50" cy="46" rx="21" ry="26" fill={S}/>
    <StandardBody/>
  </svg>
)

// ── JONAS ASHAVEL — handsome, architect, wavy hair ────────────────────────
export const JonasAshavel: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-ja"/>
    <rect width="100" height="100" fill="url(#bg-ja)"/>
    {/* Slightly wavy, distinguished hair */}
    <path d="M30,44 Q28,16 50,13 Q72,16 70,44 Q68,22 58,18 Q50,14 42,18 Q32,22 30,44 Z" fill={H}/>
    {/* Refined, handsome face */}
    <ellipse cx="50" cy="46" rx="22" ry="28" fill={S}/>
    {/* Thoughtful build */}
    <path d="M0,100 L0,79 Q20,73 44,69 L50,67 L56,69 Q80,73 100,79 L100,100 Z" fill={S}/>
    <rect x="45" y="65" width="10" height="14" fill={S}/>
  </svg>
)

// ── Liora and Tomas (family) — fallback silhouettes ───────────────────────
export const LioraAshavel: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-la"/>
    <rect width="100" height="100" fill="url(#bg-la)"/>
    <path d="M30,44 Q29,14 50,11 Q71,14 70,44 Q68,20 50,17 Q32,20 30,44 Z" fill={H}/>
    <path d="M29,44 Q25,65 28,78 Q32,84 35,76 Q33,62 32,46" fill={H}/>
    <path d="M71,44 Q75,65 72,78 Q68,84 65,76 Q67,62 68,46" fill={H}/>
    <ellipse cx="50" cy="46" rx="21" ry="28" fill={S}/>
    <StandardBody/>
  </svg>
)

export const TomasAshavel: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-ta"/>
    <rect width="100" height="100" fill="url(#bg-ta)"/>
    <path d="M32,44 Q32,20 50,17 Q68,20 68,44 Q65,26 50,24 Q35,26 32,44 Z" fill={H}/>
    <ellipse cx="50" cy="46" rx="20" ry="26" fill={S}/>
    <StandardBody/>
  </svg>
)

// ── HARRISON COLE — clean-shaven, expensive suit, polished diplomat ──────
export const HarrisonCole: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-hc"/>
    <rect width="100" height="100" fill="url(#bg-hc)"/>
    {/* Neat, well-groomed hair — side part */}
    <path d="M28,44 Q28,14 50,12 Q72,14 72,44 Q70,20 52,17 Q34,19 28,44 Z" fill="#3a3020"/>
    {/* Clean-cut face */}
    <ellipse cx="50" cy="45" rx="21" ry="26" fill={S}/>
    {/* Expensive suit — sharp shoulders */}
    <path d="M0,100 L0,76 Q18,70 40,66 L50,64 L60,66 Q82,70 100,76 L100,100 Z" fill={S}/>
    <rect x="45" y="65" width="10" height="14" fill={S}/>
    {/* Tie — diplomat's subtle stripe */}
    <path d="M47,66 L50,82 L53,66" fill={AMBER} opacity="0.4"/>
  </svg>
)

// ── YEVGENI STAHL — heavy, blocky, military decorations, blunt ────────────
export const YevgeniStahl: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-ys"/>
    <rect width="100" height="100" fill="url(#bg-ys)"/>
    {/* Very close-cropped hair */}
    <path d="M20,46 Q20,24 50,20 Q80,24 80,46 Q77,32 50,29 Q23,32 20,46 Z" fill="#1a1210"/>
    {/* Heavy, square face */}
    <ellipse cx="50" cy="47" rx="28" ry="25" fill={S}/>
    {/* Thick neck */}
    <rect x="41" y="70" width="18" height="12" fill={S}/>
    {/* Very broad, heavy body */}
    <path d="M0,100 L0,72 Q12,66 30,62 L50,60 L70,62 Q88,66 100,72 L100,100 Z" fill={S}/>
    {/* Military epaulettes — large */}
    <rect x="10" y="64" width="24" height="7" rx="1.5" fill={S}/>
    <rect x="66" y="64" width="24" height="7" rx="1.5" fill={S}/>
    {/* Medals row */}
    <circle cx="40" cy="76" r="3" fill={AMBER} opacity="0.7"/>
    <circle cx="48" cy="76" r="3" fill="var(--accent-red)" opacity="0.7"/>
    <circle cx="56" cy="76" r="3" fill={AMBER} opacity="0.7"/>
    <circle cx="64" cy="76" r="3" fill="var(--accent-red)" opacity="0.7"/>
  </svg>
)

// ── DRAGAN VUKOV — scarred, menacing, military uniform with big medals ────
export const DraganVukov: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-dv"/>
    <rect width="100" height="100" fill="url(#bg-dv)"/>
    {/* Short, severe military haircut */}
    <path d="M26,44 Q26,20 50,17 Q74,20 74,44 Q71,27 50,24 Q29,27 26,44 Z" fill="#1e1a18"/>
    {/* Chiseled, angular face */}
    <ellipse cx="49" cy="46" rx="23" ry="27" fill={S}/>
    {/* Diagonal scar across left cheek */}
    <line x1="30" y1="42" x2="42" y2="54" stroke="#8a6a5a" strokeWidth="1.2" opacity="0.7"/>
    {/* Strong neck */}
    <rect x="43" y="71" width="14" height="12" fill={S}/>
    {/* Military uniform — imposing shoulders */}
    <path d="M0,100 L0,73 Q16,68 38,64 L49,62 L61,64 Q84,68 100,73 L100,100 Z" fill={S}/>
    {/* Large epaulettes */}
    <rect x="12" y="64" width="22" height="8" rx="1.5" fill={S}/>
    <rect x="66" y="64" width="22" height="8" rx="1.5" fill={S}/>
    {/* Medal cluster — prominent */}
    <circle cx="32" cy="78" r="4" fill={AMBER} opacity="0.8"/>
    <circle cx="42" cy="78" r="4" fill="var(--accent-red)" opacity="0.8"/>
    <circle cx="52" cy="78" r="4" fill={AMBER} opacity="0.8"/>
    <circle cx="62" cy="78" r="4" fill="var(--accent-red)" opacity="0.8"/>
    {/* Rank insignia */}
    <rect x="48" y="62" width="4" height="4" fill={AMBER}/>
  </svg>
)

// ── ÉLODIE MARCHAND — elegant, dismissive, pearl necklace ─────────────────
export const ElodieMarchand: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-em"/>
    <rect width="100" height="100" fill="url(#bg-em)"/>
    {/* Elegant upswept hair */}
    <path d="M27,44 Q25,12 50,8 Q75,12 73,44 Q70,18 50,14 Q30,18 27,44 Z" fill="#4a3a28"/>
    {/* Hair volume — elegant wave */}
    <path d="M24,40 Q20,20 32,14 Q38,10 42,16" fill="#4a3a28"/>
    <path d="M76,40 Q80,20 68,14 Q62,10 58,16" fill="#4a3a28"/>
    {/* Refined, oval face */}
    <ellipse cx="50" cy="46" rx="20" ry="27" fill={S}/>
    {/* High collar — elegant */}
    <path d="M0,100 L0,78 Q20,72 44,68 L50,66 L56,68 Q80,72 100,78 L100,100 Z" fill={S}/>
    <rect x="44" y="65" width="12" height="14" fill={S}/>
    {/* Pearl necklace */}
    <circle cx="42" cy="72" r="1.5" fill={LIGHT} opacity="0.9"/>
    <circle cx="46" cy="73" r="1.8" fill={LIGHT} opacity="0.9"/>
    <circle cx="50" cy="74" r="2" fill={LIGHT} opacity="0.95"/>
    <circle cx="54" cy="73" r="1.8" fill={LIGHT} opacity="0.9"/>
    <circle cx="58" cy="72" r="1.5" fill={LIGHT} opacity="0.9"/>
    {/* Brooch */}
    <circle cx="50" cy="67" r="2.5" fill={AMBER} opacity="0.5"/>
  </svg>
)

// ── RADOVAN SKALA — brutal, guerrilla, eye patch, beret ───────────────────
export const RadovanSkala: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-rs"/>
    <rect width="100" height="100" fill="url(#bg-rs)"/>
    {/* Beret — slanted left */}
    <ellipse cx="44" cy="18" rx="26" ry="10" fill="#3a2a1a"/>
    <path d="M18,18 Q16,10 36,10 Q52,12 68,18" fill="#3a2a1a"/>
    <path d="M68,18 Q70,24 66,26 Q62,24 64,20" fill="#3a2a1a"/>
    {/* Unkempt hair under beret */}
    <path d="M24,42 Q22,20 48,16 Q74,22 76,42 Q72,28 50,24 Q26,28 24,42 Z" fill="#2a1e14"/>
    {/* Rugged, angular face */}
    <ellipse cx="50" cy="46" rx="24" ry="27" fill={S}/>
    {/* Eye patch over right eye */}
    <ellipse cx="62" cy="42" rx="7" ry="6" fill="#1a1410"/>
    <line x1="55" y1="42" x2="69" y2="42" stroke="#1a1410" strokeWidth="0.8"/>
    {/* Facial scar */}
    <line x1="25" y1="48" x2="36" y2="44" stroke="#9a7a6a" strokeWidth="0.8" opacity="0.5"/>
    {/* Guerrilla fatigues — irregular collar */}
    <path d="M0,100 L0,76 Q18,71 40,67 L50,65 L60,67 Q82,71 100,76 L100,100 Z" fill={S}/>
    <rect x="43" y="65" width="14" height="14" fill={S}/>
    {/* Open collar — irregular */}
    <path d="M44,65 L38,76 L50,70 L62,76 L56,65" fill={S}/>
    {/* Ammo bandolier */}
    <path d="M62,68 L72,82" stroke="#5a4a30" strokeWidth="2" opacity="0.6"/>
    <rect x="44" y="72" width="6" height="8" rx="1" fill={AMBER} opacity="0.3"/>
    <rect x="52" y="70" width="6" height="8" rx="1" fill={AMBER} opacity="0.3"/>
    <rect x="60" y="72" width="6" height="8" rx="1" fill={AMBER} opacity="0.3"/>
  </svg>
)

// ── MAREN TOVIK — sharp-featured, short dark hair, no-nonsense, plain suit ─
export const MarenTovik: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-mt"/>
    <rect width="100" height="100" fill="url(#bg-mt)"/>
    {/* Short, severe dark hair — no frills */}
    <path d="M31,44 Q31,20 50,17 Q69,20 69,44 Q66,28 50,26 Q34,28 31,44 Z" fill="#1a1410"/>
    {/* Sharp, angular face — lean */}
    <ellipse cx="50" cy="46" rx="19" ry="28" fill={S}/>
    {/* No-nonsense plain suit — straightforward */}
    <path d="M0,100 L0,79 Q20,73 44,69 L50,67 L56,69 Q80,73 100,79 L100,100 Z" fill={S}/>
    <rect x="45" y="65" width="10" height="14" fill={S}/>
  </svg>
)

// ── VIKTOR DORNE — gaunt, hollow-cheeked, grey hair, unreadable ────────────
export const ViktorDorne: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-vd"/>
    <rect width="100" height="100" fill="url(#bg-vd)"/>
    {/* Thin, greying hair — receding */}
    <path d="M33,45 Q33,24 50,21 Q67,24 67,45 Q64,30 50,28 Q36,30 33,45 Z" fill="#4a4440"/>
    {/* Gaunt, hollow-cheeked face — narrow */}
    <ellipse cx="50" cy="46" rx="17" ry="30" fill={S}/>
    {/* Hollow cheek shadows */}
    <path d="M34,44 Q38,50 36,56" fill="none" stroke="#1a1510" strokeWidth="2" opacity="0.5"/>
    <path d="M66,44 Q62,50 64,56" fill="none" stroke="#1a1510" strokeWidth="2" opacity="0.5"/>
    {/* Thin neck */}
    <rect x="46" y="73" width="8" height="11" fill={S}/>
    {/* Thin, cold build */}
    <path d="M0,100 L0,82 Q22,77 44,73 L50,72 L56,73 Q78,77 100,82 L100,100 Z" fill={S}/>
  </svg>
)

// ── ELENA BRASKOV — distinguished, silver-streaked hair, knowing smile, elegant ─
export const ElenaBraskov: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-eb"/>
    <rect width="100" height="100" fill="url(#bg-eb)"/>
    {/* Elegant silver-streaked hair — swept back */}
    <path d="M28,44 Q26,12 50,8 Q74,12 72,44 Q70,16 50,13 Q30,16 28,44 Z" fill="#4a4050"/>
    {/* Silver streak */}
    <path d="M44,10 Q46,8 48,10 Q50,12 52,10 Q54,8 56,10 Q54,14 50,16 Q46,14 44,10 Z" fill="#b8b0c0"/>
    <path d="M42,12 Q44,18 42,24 Q40,30 42,36" stroke="#b8b0c0" strokeWidth="2" opacity="0.6"/>
    {/* Elegant swept volume */}
    <path d="M26,40 Q20,18 30,12 Q36,8 40,14" fill="#4a4050"/>
    <path d="M74,40 Q80,18 70,12 Q64,8 60,14" fill="#4a4050"/>
    {/* Distinguished face — refined, knowing */}
    <ellipse cx="50" cy="46" rx="22" ry="28" fill={S}/>
    {/* Knowing half-smile — subtle */}
    <path d="M40,54 Q45,58 52,55 Q56,54 60,56" fill="none" stroke={LIGHT} strokeWidth="0.8" opacity="0.4"/>
    {/* Elegant suit with jewelry */}
    <path d="M0,100 L0,77 Q18,71 40,67 L50,65 L60,67 Q82,71 100,77 L100,100 Z" fill={S}/>
    <rect x="44" y="65" width="12" height="14" fill={S}/>
    {/* Pearl necklace */}
    <circle cx="42" cy="72" r="1.8" fill={LIGHT} opacity="0.9"/>
    <circle cx="46" cy="73" r="2" fill={LIGHT} opacity="0.95"/>
    <circle cx="50" cy="74" r="2.2" fill={LIGHT} opacity="0.95"/>
    <circle cx="54" cy="73" r="2" fill={LIGHT} opacity="0.9"/>
    <circle cx="58" cy="72" r="1.8" fill={LIGHT} opacity="0.9"/>
    {/* Brooch — expensive */}
    <circle cx="50" cy="67" r="3" fill="#8B5A8B" opacity="0.7"/>
    <circle cx="50" cy="67" r="1.5" fill={AMBER} opacity="0.6"/>
  </svg>
)

// ── SERIDA VALK — round warm face, practical ponytail, kind but tired eyes ─
export const SeridaValk: FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
    <PBG id="bg-svk"/>
    <rect width="100" height="100" fill="url(#bg-svk)"/>
    {/* Practical pulled-back hair — tight low cap */}
    <path d="M28,44 Q27,18 50,15 Q73,18 72,44 Q69,27 50,24 Q31,27 28,44 Z" fill={H}/>
    {/* Low ponytail — visible over right shoulder */}
    <path d="M70,38 Q78,42 76,58 Q74,66 69,61 Q71,50 70,40 Z" fill={H}/>
    {/* Elastic band */}
    <ellipse cx="70" cy="39" rx="3" ry="2" fill="#3a2c1e"/>
    {/* Round, warm face */}
    <ellipse cx="50" cy="47" rx="23" ry="25" fill={S}/>
    {/* Tired eyes — subtle under-eye arcs */}
    <path d="M35,48 Q39,51 43,49" fill="none" stroke="#1a1510" strokeWidth="1" opacity="0.3"/>
    <path d="M57,49 Q61,52 65,49" fill="none" stroke="#1a1510" strokeWidth="1" opacity="0.3"/>
    {/* Body */}
    <path d="M0,100 L0,79 Q20,73 44,69 L50,67 L56,69 Q80,73 100,79 L100,100 Z" fill={S}/>
    <rect x="44" y="65" width="12" height="14" fill={S}/>
    {/* Moss-green cardigan — V-neck outline and buttons */}
    <path d="M44,65 L46,74 L50,68 L54,74 L56,65" fill="none" stroke="#7B8B5A" strokeWidth="1.5" opacity="0.65"/>
    <circle cx="50" cy="71" r="1.4" fill="#7B8B5A" opacity="0.55"/>
    <circle cx="50" cy="77" r="1.4" fill="#7B8B5A" opacity="0.55"/>
    <circle cx="50" cy="83" r="1.4" fill="#7B8B5A" opacity="0.55"/>
  </svg>
)

// ── Lookup map ─────────────────────────────────────────────────────────────

export const CHARACTER_PORTRAIT_MAP: Record<string, FC> = {
  vyktor_reznik:   VyktorReznik,
  elara_vostane:   ElaraVostane,
  gregor_maric:    GregorMaric,
  irina_dusek:     IrinaDusek,
  aldric_theron:   AldricTheron,
  danika_oberlin:  DanikaOberlin,
  stanislov_renek: StanislovRenek,
  drazen_kolvar:   DrazenKolvar,
  soraya_khaled:   SorayaKhaled,
  lucan_vael:      LucanVael,
  oskar_brenner:   OskarBrenner,
  nadia_voss:      NadiaVoss,
  jonas_ashavel:   JonasAshavel,
  liora_ashavel:   LioraAshavel,
  tomas_ashavel:   TomasAshavel,
  katerin_ashavel: undefined as unknown as FC,
  harrison_cole:   HarrisonCole,
  yevgeni_stahl:   YevgeniStahl,
  dragan_vukov:    DraganVukov,
  elodie_marchand: ElodieMarchand,
  radovan_skala:   RadovanSkala,
  maren_tovik:     MarenTovik,
  viktor_dorne:    ViktorDorne,
  elena_braskov:   ElenaBraskov,
  serida_valk:     SeridaValk,
}

export function getCharacterPortrait(characterId: string): FC | null {
  return CHARACTER_PORTRAIT_MAP[characterId] ?? null
}

// ── Character name display colours ─────────────────────────────────────────

export const CHARACTER_COLORS: Record<string, string> = {
  vyktor_reznik:   '#8B9DAF',
  elara_vostane:   '#C4943A',
  gregor_maric:    '#B85C3A',
  irina_dusek:     '#4A6B3A',
  aldric_theron:   '#7B6BA5',
  danika_oberlin:  '#C45A5A',
  stanislov_renek: '#9B7B3A',
  drazen_kolvar:   '#6B6B6B',
  soraya_khaled:   '#8B2E2E',
  lucan_vael:      '#6B8B6B',
  oskar_brenner:   '#5A5A3A',
  nadia_voss:      '#5A8BB8',
  jonas_ashavel:   '#7B8B6B',
  liora_ashavel:   '#9B7B8B',
  tomas_ashavel:   '#7B9BAB',
  katerin_ashavel: '#c8902a',
  harrison_cole:   '#5A8BA8',
  yevgeni_stahl:   '#B83A3A',
  dragan_vukov:    '#8A8A8A',
  elodie_marchand: '#B89A5A',
  radovan_skala:   '#7A5A3A',
  maren_tovik:     '#4A7B8B',
  viktor_dorne:    '#5A4A3A',
  elena_braskov:   '#8B5A8B',
  serida_valk:     '#7B8B5A',
}

export function getCharacterColor(id: string): string {
  return CHARACTER_COLORS[id] ?? 'var(--amber)'
}
