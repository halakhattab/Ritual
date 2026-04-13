import React from 'react'
import { motion } from 'framer-motion'

const MOODS = ['Energized', 'Calm', 'Foggy', 'Motivated', 'Anxious', 'Tired']

export default function MoodCheckIn({ mood, onMoodSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.22 }}
    >
      <div className="section-header">
        <span className="section-title">How are you feeling?</span>
        {mood && (
          <span style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            {mood}
          </span>
        )}
      </div>
      <div className="mood-row">
        {MOODS.map(m => (
          <motion.button
            key={m}
            className={`mood-chip${mood === m ? ' selected' : ''}`}
            onClick={() => onMoodSelect(m === mood ? null : m)}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {m}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
