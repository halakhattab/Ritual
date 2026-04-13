import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const MOOD_ORDER = ['Energized', 'Motivated', 'Calm', 'Foggy', 'Anxious', 'Tired']

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      padding: '6px 12px',
      fontSize: '0.82rem',
      color: 'var(--text-secondary)',
      borderRadius: 'var(--radius)',
    }}>
      {payload[0].payload.mood}: <span style={{ color: 'var(--text-primary)' }}>{payload[0].value} days</span>
    </div>
  )
}

export default function MoodChart({ data = {} }) {
  const chartData = MOOD_ORDER
    .map(mood => ({ mood, count: data[mood] ?? 0 }))
    .filter(d => d.count > 0)

  if (!chartData.length) {
    return (
      <div className="chart-section">
        <div className="chart-title">Mood Distribution</div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Check in with your mood daily to see patterns here.
        </div>
      </div>
    )
  }

  return (
    <div className="chart-section">
      <div className="chart-title">Mood Distribution — Last 30 Days</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="mood"
            tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 400 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 400 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,169,110,0.06)' }} />
          <Bar dataKey="count" radius={[1, 1, 0, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={i === 0 ? 'var(--gold)' : 'rgba(255,255,255,0.1)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
