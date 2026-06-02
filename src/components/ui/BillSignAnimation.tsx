interface BillSignAnimationProps {
  type: 'approval' | 'veto'
}

export default function BillSignAnimation({ type }: BillSignAnimationProps) {
  const isApproval = type === 'approval'
  const color = isApproval ? '#2d7a3a' : '#b02020'
  const word = isApproval ? 'APPROVED' : 'VETOED'
  const animName = isApproval ? 'stampSlam' : 'stampSlamRejected'

  return (
    <div style={{
      position: 'absolute',
      top: '24px',
      right: '24px',
      width: '110px',
      height: '110px',
      zIndex: 50,
      pointerEvents: 'none',
      animation: `${animName} 400ms cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
    }}>
      <svg viewBox="0 0 110 110" width="110" height="110">
        <circle cx="55" cy="55" r="50" fill="none" stroke={color} strokeWidth="4" />
        <circle cx="55" cy="55" r="40" fill="none" stroke={color} strokeWidth="2" />
        <text x="55" y="30" fill={color} fontSize="8" textAnchor="middle">★ ★ ★</text>
        <text x="55" y="52" fill={color} fontSize="15" fontWeight="900" fontFamily="Georgia, serif" textAnchor="middle" letterSpacing="0.5" fontStyle="italic">{word}</text>
        <text x="55" y="68" fill={color} fontSize="8" textAnchor="middle" letterSpacing="1">VELTRIA 1963</text>
      </svg>
    </div>
  )
}
