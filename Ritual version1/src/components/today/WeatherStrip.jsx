import React from 'react'
import { motion } from 'framer-motion'

export default function WeatherStrip({ weather, loading, error }) {
  if (loading) {
    return (
      <div className="weather-strip">
        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Fetching conditions...</span>
      </div>
    )
  }

  if (error || !weather) return null

  return (
    <motion.div
      className="weather-strip"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div className="weather-temp display">
          {weather.temp}&deg;F
        </div>
        <div className="weather-desc">{weather.condition}</div>
      </div>

      <div style={{ height: 28, width: 1, background: 'var(--border)', flexShrink: 0 }} />

      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{weather.location}</div>

      <div className="weather-meta">
        <div className="weather-meta-item">
          <span style={{ color: 'var(--text-muted)', marginRight: 5 }}>Humidity</span>
          {weather.humidity}%
        </div>
        <div className="weather-meta-item">
          <span style={{ color: 'var(--text-muted)', marginRight: 5 }}>Wind</span>
          {weather.windspeed} mph
        </div>
      </div>
    </motion.div>
  )
}
