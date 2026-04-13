import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const CATEGORIES = ['Mind', 'Body', 'Spirit', 'Rest']

const HOURS = ['', '12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
const MINUTES = ['00', '15', '30', '45']
const MERIDIEMS = ['AM', 'PM']

const empty = { name: '', start_time: '', end_time: '', category: 'Mind', active: true }

// "19:00" → { hour: '7', minute: '00', meridiem: 'PM' }
// ""      → { hour: '', minute: '00', meridiem: 'AM' }
function fromHHMM(str) {
  if (!str || !/^\d{2}:\d{2}$/.test(str)) {
    return { hour: '', minute: '00', meridiem: 'AM' }
  }
  let h = parseInt(str.slice(0, 2), 10)
  const minute = str.slice(3, 5)
  // Snap minute to nearest option
  const snapped = MINUTES.reduce((best, m) =>
    Math.abs(parseInt(m) - parseInt(minute)) < Math.abs(parseInt(best) - parseInt(minute)) ? m : best
  )
  const meridiem = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return { hour: String(h), minute: snapped, meridiem }
}

// { hour: '7', minute: '00', meridiem: 'PM' } → "19:00"
// { hour: '', ... }                            → ""
function toHHMM({ hour, minute, meridiem }) {
  if (!hour) return ''
  let h = parseInt(hour, 10)
  if (meridiem === 'AM') {
    if (h === 12) h = 0
  } else {
    if (h !== 12) h += 12
  }
  return `${String(h).padStart(2, '0')}:${minute}`
}

function TimePicker({ label, value, onChange }) {
  const [parts, setParts] = useState(() => fromHHMM(value))

  // Sync inbound value changes (e.g. when editing switches to a different ritual)
  useEffect(() => {
    setParts(fromHHMM(value))
  }, [value])

  function update(key, val) {
    const next = { ...parts, [key]: val }
    setParts(next)
    onChange(toHHMM(next))
  }

  const selectStyle = {
    display: 'inline-block',
    width: 'auto',
    border: 'none',
    borderBottom: '1px solid var(--border-md)',
    borderRadius: 0,
    padding: '9px 20px 9px 0',
    fontSize: '0.95rem',
    color: 'var(--fg)',
    background: 'transparent',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    marginRight: 8,
    fontFamily: 'var(--font-body)',
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, paddingTop: 2 }}>
        <select
          value={parts.hour}
          onChange={e => update('hour', e.target.value)}
          style={selectStyle}
        >
          <option value="">--</option>
          {HOURS.slice(1).map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <select
          value={parts.minute}
          onChange={e => update('minute', e.target.value)}
          style={selectStyle}
        >
          {MINUTES.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={parts.meridiem}
          onChange={e => update('meridiem', e.target.value)}
          style={selectStyle}
        >
          {MERIDIEMS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function RitualForm({ initial = null, onSave, onCancel }) {
  const [form, setForm] = useState(empty)
  const [timeError, setTimeError] = useState('')

  useEffect(() => {
    setForm(initial ?? empty)
    setTimeError('')
  }, [initial])

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
    if (key === 'start_time' || key === 'end_time') setTimeError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return

    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      setTimeError('End time must be after start time.')
      return
    }
    setTimeError('')

    await onSave({
      name:       form.name.trim(),
      start_time: form.start_time || null,
      end_time:   form.end_time   || null,
      category:   form.category,
      active:     form.active,
    })
    setForm(empty)
  }

  return (
    <motion.div
      className="ritual-form"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--soft)', marginBottom: 20 }}>
        {initial ? 'Edit Ritual' : 'New Ritual'}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Ritual name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Morning meditation"
            autoFocus
          />
        </div>

        <div className="form-row">
          <TimePicker
            label="Start time"
            value={form.start_time}
            onChange={val => set('start_time', val)}
          />
          <div>
            <TimePicker
              label="End time"
              value={form.end_time}
              onChange={val => set('end_time', val)}
            />
            {timeError && (
              <div style={{ fontSize: '0.78rem', color: '#C0614A', marginTop: 4 }}>
                {timeError}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Category</label>
          <div className="category-options">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                className={`category-chip${form.category === cat ? ' selected' : ''}`}
                onClick={() => set('category', cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {initial ? 'Save changes' : 'Add ritual'}
          </button>
          {onCancel && (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </motion.div>
  )
}
