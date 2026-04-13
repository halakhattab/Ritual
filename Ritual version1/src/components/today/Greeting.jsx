import React, { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toUpperCase()
}

function WordByWord({ text, baseDelay = 0, style = {} }) {
  const words = text.split(' ')
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', marginRight: '0.26em', ...style }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: baseDelay + i * 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </>
  )
}

export default function Greeting({ name }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, -60])
  const opacity = useTransform(scrollY, [0, 350], [1, 0])

  const displayName = name || 'you'
  const greeting = getGreeting()
  const nameItalic = displayName

  return (
    <motion.div style={{ y, opacity }}>
      {/* Date — uppercase gold above */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.7rem',
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#9B7540',
          marginBottom: 24,
        }}
      >
        {formatDate(now)}
      </motion.div>

      {/* Greeting — large Cormorant */}
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 400,
          fontStyle: 'normal',
          fontSize: 'clamp(3.2rem, 6.5vw, 5.5rem)',
          lineHeight: 1.04,
          color: '#0D0B08',
          marginBottom: 0,
        }}
      >
        <WordByWord text={`${greeting},`} baseDelay={0.18} />
        {' '}
        <motion.span
          style={{
            display: 'inline-block',
            fontStyle: 'italic',
            color: '#0D0B08',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 + (greeting.split(' ').length + 1) * 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          {nameItalic}.
        </motion.span>
      </h1>
    </motion.div>
  )
}
