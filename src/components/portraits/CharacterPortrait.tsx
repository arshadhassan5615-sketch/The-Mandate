import { useState } from 'react'
import { getPortrait } from '../../assets/potraits'
import { getCharacterPortrait, CHARACTER_COLORS } from './CharacterPortraits'

interface CharacterPortraitProps {
  characterId: string
  isActive: boolean
  size?: number       // default 88
  showName?: boolean  // default true
}

const CHAR_NAMES: Record<string, string> = {
  vyktor_reznik:   'Vyktor Reznik',
  katerin_ashavel: 'Katerin Ashavel',
  elara_vostane:   'Elara Vostane',
  gregor_maric:    'Gregor Marić',
  irina_dusek:     'Irina Dusek',
  aldric_theron:   'Aldric Theron',
  danika_oberlin:  'Danika Oberlin',
  stanislov_renek: 'Archbishop Renek',
  drazen_kolvar:   'Dražen Kolvar',
  soraya_khaled:   'Soraya Khaled',
  lucan_vael:      'Lucan Vael',
  oskar_brenner:   'Gen. Brenner',
  nadia_voss:      'Nadia Voss',
  jonas_ashavel:   'Jonas Ashavel',
  liora_ashavel:   'Liora Ashavel',
  tomas_ashavel:   'Tomas Ashavel',
  harrison_cole:   'Amb. Harrison Cole',
  yevgeni_stahl:   'Commissar Stahl',
  dragan_vukov:    'Marshal Vukov',
  elodie_marchand: 'Premier Marchand',
  radovan_skala:   'Warlord Skala',
  maren_tovik:     'Maren Tovik',
  viktor_dorne:    'Viktor Dorne',
  elena_braskov:   'Elena Braskov',
  serida_valk:     'Serida Valk',
  gavril_soren:    'Marshal Soren',
  idris_kaelen:    'Idris Kaelen',
  stefan_morvec:   'Stefan Morvec',
}

function getInitials(id: string): string {
  const name = CHAR_NAMES[id] ?? id.replace(/_/g, ' ')
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function CharacterPortrait({
  characterId,
  isActive,
  size = 88,
  showName = true,
}: CharacterPortraitProps) {
  const normalizedId = characterId.replace(/^character_/, '')
  const [hasError, setHasError] = useState(false)
  const imgSrc = getPortrait(normalizedId)
  const color = CHARACTER_COLORS[normalizedId] ?? 'var(--amber)'
  const SvgComp = getCharacterPortrait(normalizedId)

  function renderInner() {
    if (imgSrc && !hasError) {
      return (
        <img
          src={imgSrc}
          alt={CHAR_NAMES[normalizedId] ?? normalizedId}
          onError={() => {
            console.warn(`[Portrait] Failed to load image for: ${normalizedId}`)
            setHasError(true)
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
          }}
        />
      )
    }
    if (SvgComp) {
      return <SvgComp />
    }
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: `${color}4D`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: size * 0.28,
          color,
          fontWeight: 'bold',
        }}>
          {getInitials(normalizedId)}
        </span>
      </div>
    )
  }

  const firstName = (CHAR_NAMES[normalizedId] ?? normalizedId.replace(/_/g, ' ')).split(' ')[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: `3px solid ${isActive ? '#c4943a' : color}`,
        background: 'var(--bg-tertiary, #1a1410)',
        transform: isActive ? 'scale(1.15)' : 'scale(1.0)',
        opacity: isActive ? 1 : 0.5,
        boxShadow: isActive
          ? '0 0 16px rgba(196,148,58,0.75), 0 0 32px rgba(196,148,58,0.3)'
          : 'none',
        transition: 'all 0.3s ease',
        zIndex: isActive ? 10 : undefined,
        position: 'relative',
        flexShrink: 0,
      }}>
        {renderInner()}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          boxShadow: 'inset 0 0 14px rgba(0,0,0,0.55)',
          pointerEvents: 'none',
        }} />
      </div>
      {showName && (
        <div style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: CHARACTER_COLORS[normalizedId] ?? 'var(--muted)',
          opacity: isActive ? 1 : 0,
          transition: 'opacity 0.3s ease',
          marginTop: '6px',
          maxWidth: size + 10,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {firstName}
        </div>
      )}
    </div>
  )
}
