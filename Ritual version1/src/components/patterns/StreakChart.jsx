import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      padding: '8px 14px',
      fontSize: '0.82rem',
      color: 'var(--text-secondary)',
      borderRadius: 'var(--radius)',
    }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 4, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{label}</div>
      <div style={{ color: 'var(--text-primary)' }}>{Math.round(payload[0].value * 100)}% complete</div>
    </div>
  )
}

export default function StreakChart({ data = [], title }) {
  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <div className="chart-section">
      <div className="chart-title">{title}</div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={formatted} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" strokeDasharray="0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 400, letterSpacing: '0.06em' }}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(formatted.length / 6)}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={v => `${Math.round(v * 100)}%`}
            tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 400 }}
            axisLine={false}
            tickLine={false}
            ticks={[0, 0.5, 1]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--gold)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: 'var(--gold)', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
