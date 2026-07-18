import React, { useState } from 'react'
import { EASE_STANDARD_CSS, DURATION_FAST } from '../../styles/motion'

interface ImageButtonProps {
  src: string
  /** Rendered instead of <img> if src fails to load (missing asset / network error). */
  fallback: React.ReactNode
  alt: string
  onClick: () => void
  active?: boolean
  width?: number
  height?: number
  'data-testid'?: string
}

function ImageButton({
  src,
  fallback,
  alt,
  onClick,
  active,
  width = 120,
  height = 32,
  'data-testid': testId,
}: ImageButtonProps) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  // Empty src = no asset yet (cannot static-import missing files in Vite);
  // treat as already failed so we never render <img src="">.
  const [imgFailed, setImgFailed] = useState(() => !src)

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        setPressed(false)
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        position: 'relative',
        width,
        height,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        borderRadius: '4px',
        boxShadow: active
          ? '0 0 0 2px rgba(201,168,76,0.9), 0 0 12px rgba(201,168,76,0.5)'
          : 'none',
        transform: `scale(${pressed ? 0.94 : hovered ? 1.03 : 1})`,
        filter: hovered && !pressed ? 'brightness(1.15)' : 'brightness(1)',
        transition: `all ${DURATION_FAST}ms ${EASE_STANDARD_CSS}`,
      }}
    >
      {imgFailed || !src ? (
        fallback
      ) : (
        <img
          src={src}
          alt={alt}
          draggable={false}
          onError={() => setImgFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      )}
    </button>
  )
}

export default ImageButton
