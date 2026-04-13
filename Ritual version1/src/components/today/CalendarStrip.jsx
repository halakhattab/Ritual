import React from 'react'
import { motion } from 'framer-motion'

function formatEventTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function CalendarStrip({ events = [], connected }) {
  if (!connected) return null

  return (
    <motion.div
      className="calendar-strip"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.18 }}
    >
      <div className="section-title">Your Day</div>
      {events.length === 0 ? (
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 10 }}>
          No events scheduled
        </div>
      ) : (
        <div className="calendar-events">
          {events.slice(0, 5).map((evt, i) => (
            <div key={i} className="calendar-event">
              <span className="calendar-event-time">
                {formatEventTime(evt.start?.dateTime || evt.start?.date)}
              </span>
              <span style={{ height: 1, width: 16, background: 'var(--border)', flexShrink: 0 }} />
              <span>{evt.summary}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
