import { motion } from 'framer-motion'

interface BillSignAnimationProps {
  type: 'approval' | 'veto'
}

export default function BillSignAnimation({ type }: BillSignAnimationProps) {
  const isApproval = type === 'approval'

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      {/* Signature */}
      {isApproval && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={{ marginBottom: '0.5rem' }}
        >
          <svg viewBox="0 0 300 70" width="220" height="52">
            <path
              d="M 15,55 C 18,20 28,15 33,35 C 38,50 25,55 30,28 L 48,55
                 M 55,50 C 58,30 63,22 68,32 C 73,42 63,48 68,35
                 M 75,55 L 75,28 C 80,22 90,22 90,32 C 90,42 80,42 80,35
                 M 98,55 L 98,28
                 M 105,50 C 108,30 115,22 120,35 C 125,50 115,52 115,38
                 M 130,28 L 125,55
                 M 135,50 C 140,30 148,22 150,42 C 152,55 142,52 143,42
                 M 155,55 L 155,28
                 M 165,50 C 168,28 175,22 180,38 C 185,52 175,50 180,40
                 M 190,55 L 190,28 C 195,22 205,22 205,30 C 205,40 195,38 195,32
                 M 215,55 L 215,35 C 218,28 225,24 230,30
                 M 235,55 L 235,28 M 235,42 L 245,42
                 M 250,55 C 253,35 258,25 263,35 C 268,45 258,48 263,38
                 M 270,55 L 270,28
                 M 278,50 C 283,30 288,24 290,34"
              fill="none"
              stroke="#1a1814"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="bill-signature"
            />
          </svg>
        </motion.div>
      )}

      {/* Veto slash */}
      {!isApproval && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.3 }}
          style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg viewBox="0 0 600 400" width="400" height="266" style={{ position: 'absolute' }}>
            <line
              x1="30" y1="30"
              x2="570" y2="370"
              stroke="#8b2e2e"
              strokeWidth="4"
              strokeLinecap="round"
              className="veto-slash"
            />
          </svg>
        </motion.div>
      )}

      {/* Stamp */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1, delay: isApproval ? 1.8 : 0.8 }}
        style={{
          position: 'absolute',
          bottom: '10%',
          ...(isApproval ? { right: '12%' } : { left: '12%' }),
        }}
      >
        <div className={`bill-stamp${!isApproval ? ' bill-stamp-veto' : ''}`}
          style={{
            animation: isApproval
              ? 'stamp-slam 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1.8s forwards'
              : 'stamp-slam-veto 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards',
            transformOrigin: 'center',
          }}
        >
          {isApproval ? (
            <svg viewBox="0 0 200 200" width="130" height="130">
              <defs>
                <path id="approvalArc" d="M 100,100 m -65,0 a 65,65 0 1,1 130,0" fill="none" />
              </defs>
              <circle cx="100" cy="100" r="90" fill="none" stroke="#2d5a3d" strokeWidth="4" opacity="0.85" />
              <circle cx="100" cy="100" r="75" fill="none" stroke="#2d5a3d" strokeWidth="2" opacity="0.85" />
              <circle cx="100" cy="100" r="68" fill="none" stroke="#2d5a3d" strokeWidth="0.8" opacity="0.4" />
              <text fontSize="10" fill="#2d5a3d" fontFamily="'Playfair Display', serif" letterSpacing="3" opacity="0.85">
                <textPath href="#approvalArc" startOffset="12%">
                  ENACTED · REPUBLIC OF VELTRIA
                </textPath>
              </text>
              <text x="100" y="92" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#2d5a3d" fontFamily="'Playfair Display', serif" opacity="0.85">
                CHANCELLOR'S
              </text>
              <text x="100" y="114" textAnchor="middle" fontSize="14" fill="#2d5a3d" fontFamily="'Playfair Display', serif" opacity="0.85">
                SEAL
              </text>
              <text x="42" y="108" fontSize="10" fill="#2d5a3d" opacity="0.7">★</text>
              <text x="153" y="108" fontSize="10" fill="#2d5a3d" opacity="0.7">★</text>
            </svg>
          ) : (
            <svg viewBox="0 0 200 200" width="130" height="130">
              <defs>
                <path id="vetoArc" d="M 100,100 m -65,0 a 65,65 0 1,1 130,0" fill="none" />
              </defs>
              <circle cx="100" cy="100" r="90" fill="none" stroke="#8b2e2e" strokeWidth="4" opacity="0.85" />
              <circle cx="100" cy="100" r="75" fill="none" stroke="#8b2e2e" strokeWidth="2" opacity="0.85" />
              <circle cx="100" cy="100" r="68" fill="none" stroke="#8b2e2e" strokeWidth="0.8" opacity="0.4" />
              <text fontSize="9.5" fill="#8b2e2e" fontFamily="'Playfair Display', serif" letterSpacing="2" opacity="0.85">
                <textPath href="#vetoArc" startOffset="9%">
                  BY ORDER OF THE CHANCELLOR
                </textPath>
              </text>
              <text x="100" y="95" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#8b2e2e" fontFamily="'Playfair Display', serif" opacity="0.85">
                VETOED
              </text>
              <text x="100" y="118" textAnchor="middle" fontSize="12" fill="#8b2e2e" fontFamily="'Playfair Display', serif" opacity="0.85">
                REJECTED
              </text>
              <text x="42" y="108" fontSize="10" fill="#8b2e2e" opacity="0.7">★</text>
              <text x="153" y="108" fontSize="10" fill="#8b2e2e" opacity="0.7">★</text>
            </svg>
          )}
        </div>
      </motion.div>
    </div>
  )
}
