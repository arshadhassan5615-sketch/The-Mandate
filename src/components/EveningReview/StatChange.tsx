import { useEffect, useState } from 'react'
import { useSpring, useMotionValueEvent } from 'framer-motion'
import type { WeeklyStatChange } from '../../types/week'

const CATEGORY_ICONS: Record<WeeklyStatChange['category'], string> = {
  faction: '\u25C8',
  nation: '\u2696\uFE0F',
  personal: '\u2726',
}

const CATEGORY_LABELS: Record<WeeklyStatChange['category'], string> = {
  faction: 'Faction',
  nation: 'Nation',
  personal: 'Personal',
}

function AnimatedDelta({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 })
  const [displayed, setDisplayed] = useState(0)

  useMotionValueEvent(spring, 'change', (latest: number) => {
    setDisplayed(Math.round(latest))
  })

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  const isPositive = value > 0
  const isNegative = value < 0
  const prefix = isPositive ? '+' : ''

  return (
    <span
      className={`stat-value ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}
    >
      {prefix}
      {displayed}
    </span>
  )
}

export default function StatChange({ stat }: { stat: WeeklyStatChange }) {
  const icon = CATEGORY_ICONS[stat.category]

  return (
    <div className="stat-change-row">
      <span className="stat-label">
        <span className="stat-icon" title={CATEGORY_LABELS[stat.category]}>
          {icon}
        </span>
        {stat.label}
      </span>
      <AnimatedDelta value={stat.delta} />
    </div>
  )
}
