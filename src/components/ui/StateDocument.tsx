// Shared pieces of a Veltrian state document: the seal at the head and the
// Chancellor's signature line at the foot. Used by bills, decrees and letters.
import veltriaSeal from '../../assets/images/veltria_seal.png'
import katerinSignature from '../../assets/images/katerin_signature.jpeg'

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
}

export function SignatureLine({ isSigned, caption, width = 280, height = 126, signatureMaxWidth = width * 2 }: SignatureLineProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' }}>
      <div style={{
        width,
        maxWidth: '100%',
        height,
        borderBottom: '1px solid #333',
        position: 'relative',
        marginBottom: '6px',
      }}>
        {isSigned && (
          <img
            src={katerinSignature}
            alt="Signature of Katerin Ashavel"
            style={{
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
            }}
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
