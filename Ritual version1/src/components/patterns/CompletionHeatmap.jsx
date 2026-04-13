import React from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getLevel(rate) {
  if (rate === 0) return ''
  if (rate < 0.25) return 'l1'
  if (rate < 0.5) return 'l2'
  if (rate < 0.75) return 'l3'
  return 'l4'
}

export default function CompletionHeatmap({ data = {} }) {
  return (
    <div className="chart-section">
      <div className="chart-title">Completion by Day &amp; Hour</div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '48px repeat(24, 20px)',
          gap: '3px',
          alignItems: 'center',
          minWidth: 600,
        }}>
          {/* Header row */}
          <div />
          {HOURS.map(h => (
            <div key={h} style={{
              fontSize: '0.6rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              letterSpacing: '0.04em',
              fontWeight: 400,
            }}>
              {h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}` : `${h - 12}`}
            </div>
          ))}

          {/* Data rows */}
          {DAYS.map(day => (
            <React.Fragment key={day}>
              <div style={{
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 400,
              }}>
                {day}
              </div>
              {HOURS.map(h => {
                const key = `${day}-${String(h).padStart(2, '0')}`
                const rate = data[key] ?? 0
                return (
                  <div
                    key={h}
                    className={`heatmap-cell${rate > 0 ? ` ${getLevel(rate)}` : ''}`}
                    title={rate > 0 ? `${Math.round(rate * 100)}%` : ''}
                  />
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', fontWeight: 400 }}>Less</span>
        {['', 'l1', 'l2', 'l3', 'l4'].map(l => (
          <div key={l} className={`heatmap-cell${l ? ` ${l}` : ''}`} style={{ width: 16, height: 16, flexShrink: 0 }} />
        ))}
        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', fontWeight: 400 }}>More</span>
      </div>
    </div>
  )
}
