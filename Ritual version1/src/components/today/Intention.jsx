import React from 'react'
import { motion } from 'framer-motion'

export default function Intention({ text, loading }) {
  return (
    <motion.div
      className="intention-block"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="intention-label">Daily Intention</div>
      {loading ? (
        <div className="loading-state" style={{ padding: '4px 0' }}>
          <div className="spinner" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Setting your intention...</span>
        </div>
      ) : (
        <p className="intention-text">
          {text || 'Take one mindful breath before you begin. Today is an opportunity to move with intention.'}
        </p>
      )}
    </motion.div>
  )
}
