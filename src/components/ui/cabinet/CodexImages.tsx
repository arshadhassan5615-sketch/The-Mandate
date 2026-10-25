import { useState } from 'react'
import { getCodexImages, type CodexImage } from '../../../assets/codexArt'
import CharacterPortrait from '../../portraits/CharacterPortrait'
import { CAB_FONT } from './cabinetStyles'
import { rem } from '../../../constants/typography'

type Surface = 'dark' | 'paper'

interface CodexImagesProps {
  entryId: string
  surface?: Surface
}

const GILT = '#b58a32'
const GILT_DEEP = '#6e5626'

const CAPTION_COLOR: Record<Surface, string> = { dark: '#b7a882', paper: '#5a4d3a' }
const MUTED_COLOR: Record<Surface, string> = { dark: '#8c7d5c', paper: '#7a6a4e' }

const FRAME_STYLE = {
  border: `3px solid ${GILT}`,
  outline: `1px solid ${GILT_DEEP}`,
  outlineOffset: -5,
  boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
} as const

function captionStyle(surface: Surface): React.CSSProperties {
  return {
    fontFamily: CAB_FONT.body, fontStyle: 'italic', fontSize: rem(12.5),
    color: CAPTION_COLOR[surface], textAlign: 'center',
  }
}

function MainImage({ image }: { image: CodexImage }) {
  if (image.kind === 'portrait') {
    return (
      <CharacterPortrait
        characterId={image.characterId ?? ''}
        isActive={false}
        size={120}
        showName={false}
        idleOpacity={1}
      />
    )
  }
  if (image.kind === 'medal') {
    return (
      <img
        src={image.src}
        alt={image.caption ?? ''}
        style={{ width: 120, display: 'block', margin: '0 auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
      />
    )
  }
  return (
    <img
      src={image.src}
      alt={image.caption ?? ''}
      style={{
        display: 'block', margin: '0 auto', maxWidth: '100%', maxHeight: 160,
        objectFit: 'contain', ...FRAME_STYLE,
      }}
    />
  )
}

function AltThumbnail({ image, surface, onSelect }: { image: CodexImage; surface: Surface; onSelect: () => void }) {
  const label = image.caption ?? 'image'
  return (
    <div data-testid="codex-image-alt" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <button
        type="button"
        aria-label={`Show ${label}`}
        onClick={onSelect}
        style={{ background: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
      >
        <img
          src={image.src}
          alt=""
          style={{ display: 'block', width: 64, height: 40, objectFit: 'cover', border: `2px solid ${GILT}` }}
        />
      </button>
      {image.caption && <span style={captionStyle(surface)}>{image.caption}</span>}
    </div>
  )
}

export default function CodexImages({ entryId, surface = 'dark' }: CodexImagesProps) {
  const images = getCodexImages(entryId)
  const [shown, setShown] = useState<{ entryId: string; index: number }>({ entryId, index: 0 })
  if (images.length === 0) return null

  const index = shown.entryId === entryId && shown.index < images.length ? shown.index : 0
  const main = images[index]
  const alternatives = images.map((image, i) => ({ image, i })).filter(({ i }) => i !== index)
  const altLabel = alternatives.some(({ image }) => image.kind === 'picture') ? 'More images' : 'Other flags'

  return (
    <div style={{ margin: '4px 0 12px' }}>
      <div data-testid="codex-image-main" style={{ textAlign: 'center' }}>
        <MainImage image={main} />
        {main.caption && <div style={{ ...captionStyle(surface), marginTop: 6 }}>{main.caption}</div>}
      </div>
      {alternatives.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            fontFamily: CAB_FONT.label, fontSize: rem(9), letterSpacing: '0.2em',
            textTransform: 'uppercase', color: MUTED_COLOR[surface], marginBottom: 4,
          }}>
            {altLabel}
          </div>
          {alternatives.map(({ image, i }) => (
            <AltThumbnail
              key={`${i}-${image.src ?? image.characterId ?? ''}`}
              image={image}
              surface={surface}
              onSelect={() => setShown({ entryId, index: i })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
