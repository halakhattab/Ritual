import { useRef } from 'react'
import { motion } from 'framer-motion'
import Wordmark from './Wordmark'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] },
})

function RitualCard({ timeLabel, name, description, delay }) {
  return (
    <motion.div
      {...fadeUp(delay)}
      style={{
        flex: 1,
        minWidth: 0,
        background: '#1C1814',
        border: '1px solid #2E2820',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.7rem',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#9B7540',
        }}
      >
        {timeLabel}
      </p>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '1.3rem',
          fontWeight: 400,
          color: '#F2EDE4',
          lineHeight: 1.25,
        }}
      >
        {name}
      </p>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.88rem',
          fontWeight: 400,
          color: '#8A7E74',
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </motion.div>
  )
}

export default function RevealScreen({ result, onReset, cooldown }) {
  const captureRef = useRef(null)

  const handleSave = async () => {
    const el = captureRef.current
    if (!el) return
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(el, {
        backgroundColor: '#F2EDE4',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = 'ritual-intention.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  return (
    <motion.div
      key="reveal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: '100vh',
        background: '#F2EDE4',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '28px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Wordmark />
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleSave}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9B7540',
              border: '1px solid #9B754060',
              padding: '8px 18px',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#9B754015'
              e.currentTarget.style.borderColor = '#9B7540'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = '#9B754060'
            }}
          >
            Save as image
          </button>
          <button
            onClick={onReset}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#3A3530',
              border: '1px solid #3A353040',
              padding: '8px 18px',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3A353015'
              e.currentTarget.style.borderColor = '#3A3530'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = '#3A353040'
            }}
          >
            Start over
          </button>
        </div>
      </div>

      {/* Capturable content */}
      <div
        ref={captureRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 40px 60px',
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
          gap: '48px',
        }}
      >
        {/* Label */}
        <motion.p
          {...fadeUp(0.1)}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.7rem',
            fontWeight: 500,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#9B7540',
          }}
        >
          Your intention for today
        </motion.p>

        {/* Hairline */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            width: '100%',
            height: 1,
            background: '#9B754030',
            marginTop: -32,
          }}
        />

        {/* Intention */}
        <motion.p
          {...fadeUp(0.3)}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            lineHeight: 1.25,
            color: '#0D0B08',
            textAlign: 'center',
            maxWidth: 760,
          }}
        >
          {result.intention}
        </motion.p>

        {/* Ritual Cards */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            width: '100%',
            flexWrap: 'wrap',
          }}
          className="ritual-cards"
        >
          <RitualCard
            timeLabel="Morning"
            name={result.morning.name}
            description={result.morning.description}
            delay={0.55}
          />
          <RitualCard
            timeLabel="Midday"
            name={result.midday.name}
            description={result.midday.description}
            delay={0.7}
          />
          <RitualCard
            timeLabel="Evening"
            name={result.evening.name}
            description={result.evening.description}
            delay={0.85}
          />
        </div>

        {/* Closing thought */}
        <motion.p
          {...fadeUp(1.0)}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: '1.2rem',
            color: '#3A3530',
            textAlign: 'center',
            maxWidth: 600,
            lineHeight: 1.6,
          }}
        >
          {result.closing}
        </motion.p>

        {/* Hairline footer */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          style={{
            width: '100%',
            height: 1,
            background: '#9B754030',
          }}
        />

        {/* Cooldown info */}
        {cooldown > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontSize: '0.78rem',
              color: '#9B754090',
              letterSpacing: '0.05em',
              marginTop: -32,
            }}
          >
            Generate again in {cooldown}s
          </motion.p>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .ritual-cards > * {
            flex: 1 1 100% !important;
          }
        }
      `}</style>
    </motion.div>
  )
}
