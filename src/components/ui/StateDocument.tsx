// Shared pieces of a Veltrian state document: the seal at the head and the
// Chancellor's signature line at the foot. Used by bills, decrees and letters.
import type { CSSProperties } from 'react'
import veltriaSeal from '../../assets/images/veltria_seal.png'
import katerinSignature from '../../assets/images/katerin_signature.jpeg'

// Fractions of the square source image. The ink sits between rows 37.6% and 61.6%;
// this band (35%–65%) brackets it so the crop keeps the whole signature.
const INK_BAND_TOP = 0.35
const INK_BAND_HEIGHT = 0.3

export function DocumentSeal({ size = 52 }: { size?: number }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
      <img
        src={veltriaSeal}
        alt="Seal of the Republic of Veltria"
        data-testid="document-seal"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
          margin: '0 auto',
          mixBlendMode: 'multiply',
          opacity: 0.92,
        }}
      />
    </div>
  )
}

interface SignatureLineProps {
  /** When true the signature is written onto the line (with the write-in animation). */
  isSigned: boolean
  caption: string
  width?: number
  height?: number
  /** The signature may overhang the line; the bill page lets it run wide. */
  signatureMaxWidth?: number
  /** Crop the signature image to its ink band so it reads large on the line. */
  cropToInk?: boolean
}

export function SignatureLine({ isSigned, caption, width = 280, height = 126, signatureMaxWidth = width * 2, cropToInk = false }: SignatureLineProps) {
  const lineHeight = cropToInk ? Math.round(signatureMaxWidth * INK_BAND_HEIGHT * 0.8) : height
  const signatureStyle: CSSProperties = cropToInk
    ? {
        position: 'absolute',
        bottom: '-10px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `min(${signatureMaxWidth}px, 100%)`,
        aspectRatio: `1 / ${INK_BAND_HEIGHT}`,
        height: 'auto',
        objectFit: 'cover',
        objectPosition: `center ${(INK_BAND_TOP / (1 - INK_BAND_HEIGHT)) * 100}%`,
        mixBlendMode: 'multiply',
        filter: 'contrast(1.2)',
        animation: 'signatureWrite 900ms ease-out forwards',
        pointerEvents: 'none',
      }
    : {
        position: 'absolute',
        bottom: '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
        height,
        width: 'auto',
        maxWidth: `min(${signatureMaxWidth}px, 100vw)`,
        objectFit: 'contain',
        mixBlendMode: 'multiply',
        filter: 'contrast(1.2)',
        animation: 'signatureWrite 900ms ease-out forwards',
        pointerEvents: 'none',
      }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' }}>
      <div style={{
        width,
        maxWidth: '100%',
        height: lineHeight,
        borderBottom: '1px solid #333',
        position: 'relative',
        marginBottom: '6px',
      }}>
        {isSigned && (
          <img
            src={katerinSignature}
            alt="Signature of Katerin Ashavel"
            style={signatureStyle}
          />
        )}
      </div>
      <div style={{
        fontSize: '8px',
        letterSpacing: '3px',
        color: '#666',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        {caption}
      </div>
    </div>
  )
}
