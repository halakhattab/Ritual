import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function Ticker({ items = [] }) {
  const [paused, setPaused] = useState(false)

  if (!items.length) return null

  // Duplicate items for seamless loop
  const doubled = [...items, ...items]

  return (
    <div
      className="ticker-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        className="ticker-track"
        animate={{ x: paused ? undefined : ['0%', '-50%'] }}
        transition={{
          x: {
            duration: 30,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'loop',
          },
        }}
        style={{ display: 'flex', width: 'max-content' }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="ticker-item">
            <span>{item.label}</span>
            <span className="ticker-item-val">{item.value}</span>
            <span style={{ color: 'rgba(242,237,228,0.2)', margin: '0 16px', fontSize: '0.6rem' }}>—</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}
