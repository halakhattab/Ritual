import React, { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

function AnimatedCount({ value }) {
  const spring = useSpring(value, { stiffness: 80, damping: 18 })
  const display = useTransform(spring, v => Math.round(v))
  useEffect(() => { spring.set(value) }, [value, spring])
  return <motion.span>{display}</motion.span>
}

export default function ProgressBar({ completed, total }) {
  const pct = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-header">
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 400,
          color: 'var(--l-fg)',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <AnimatedCount value={completed} />
          <span style={{ color: 'var(--l-muted)', margin: '0 4px' }}>/</span>
          {total}
        </div>
        <div style={{
          fontSize: '0.65rem',
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--l-muted)',
        }}>
          Complete
        </div>
      </div>
      <div className="progress-bar-track">
        <motion.div
          className="progress-bar-fill"
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        />
      </div>
    </div>
  )
}
