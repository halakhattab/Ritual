import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { displayTime } from '../../lib/timeUtils'

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="ritual-check-icon">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  )
}

function RitualRow({ ritual, log, onToggle, index }) {
  const done = log?.completed ?? false

  return (
    <motion.li
      layout
      className="ritual-item"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onToggle(ritual.id, !done)}
    >
      <span className="ritual-num">{String(index + 1).padStart(2, '0')}</span>

      <motion.div
        className={`ritual-check${done ? ' done' : ''}`}
        whileTap={{ scale: [1, 0.95, 1.05, 1][1] }}
        animate={done ? { scale: [1, 0.95, 1.08, 1] } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      >
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <CheckIcon />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="ritual-content">
        <div className={`ritual-name${done ? ' done' : ''}`}>{ritual.name}</div>
        {(ritual.start_time || ritual.end_time) && (
          <div className="ritual-meta">
            {displayTime(ritual.start_time)}
            {ritual.start_time && ritual.end_time && ' – '}
            {displayTime(ritual.end_time)}
          </div>
        )}
      </div>

      {ritual.category && (
        <span className="ritual-category">{ritual.category}</span>
      )}
    </motion.li>
  )
}

export default function RitualList({ rituals, logs, onToggle }) {
  const active = rituals.filter(r => r.active !== false)

  if (active.length === 0) {
    return (
      <div className="empty-state">
        No rituals yet. Add your first in the{' '}
        <a href="/rituals" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Ritual Builder</a>.
      </div>
    )
  }

  return (
    <ul className="ritual-list">
      {active.map((ritual, i) => (
        <RitualRow
          key={ritual.id}
          ritual={ritual}
          log={logs[ritual.id]}
          onToggle={onToggle}
          index={i}
        />
      ))}
    </ul>
  )
}
