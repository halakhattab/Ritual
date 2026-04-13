import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { generateSummary } from '../lib/claude'
import { useAuth } from '../contexts/AuthContext'

function toDateStr(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function formatDisplayDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const stagger = i => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] },
})

export default function Reflect() {
  const { user } = useAuth()
  const today = toDateStr()

  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved
  const [entries, setEntries] = useState([])
  const [selectedDate, setSelectedDate] = useState(today)
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const saveTimer = useRef(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // Load today's entry
  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .single()
      if (isMounted.current) setContent(data?.content ?? '')
    }
    load()
  }, [user, selectedDate])

  // Load all entries (dates list)
  useEffect(() => {
    if (!user) return
    async function loadEntries() {
      const { data } = await supabase
        .from('journal_entries')
        .select('date, content')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(60)
      if (isMounted.current) setEntries(data ?? [])
    }
    loadEntries()
  }, [user])

  // Auto-save with 30s debounce
  const autoSave = useCallback(async (text) => {
    if (!user) return
    setSaveStatus('saving')
    try {
      await supabase.from('journal_entries').upsert({
        user_id: user.id,
        date: selectedDate,
        content: text,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })
      if (isMounted.current) setSaveStatus('saved')
      // Update local entries list
      setEntries(prev => {
        const existing = prev.find(e => e.date === selectedDate)
        if (existing) {
          return prev.map(e => e.date === selectedDate ? { ...e, content: text } : e)
        }
        return [{ date: selectedDate, content: text }, ...prev]
      })
    } catch {
      if (isMounted.current) setSaveStatus('idle')
    }
  }, [user, selectedDate])

  function handleChange(e) {
    const text = e.target.value
    setContent(text)
    setSaveStatus('idle')

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => autoSave(text), 30_000)
  }

  // Manual save on blur
  async function handleBlur() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (content !== '' || saveStatus === 'idle') await autoSave(content)
  }

  async function handleAiSummary() {
    if (!user) return
    setAiLoading(true)
    setAiSummary('')
    try {
      const sevenDaysAgo = toDateStr(new Date(Date.now() - 7 * 86400000))
      const { data: recent } = await supabase
        .from('journal_entries')
        .select('date, content')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo)
        .order('date')

      if (!recent?.length) {
        setAiSummary('No entries from the past week to summarize.')
        return
      }

      const summary = await generateSummary({
        type: 'journal',
        payload: { entries: recent },
      })
      setAiSummary(summary)
    } catch {
      setAiSummary('Unable to summarize at this moment. Try again shortly.')
    } finally {
      setAiLoading(false)
    }
  }

  const saveLabel = saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Auto-saves every 30s'

  return (
    <div className="container page-pad">
      {/* Header */}
      <motion.div {...stagger(0)}>
        <div style={{ paddingBottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 400, color: 'var(--l-fg)', lineHeight: 1.04 }}>Reflect</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--l-muted)', marginTop: 10, fontWeight: 400, letterSpacing: '0.04em' }}>
              {formatDisplayDate(selectedDate)}
            </p>
          </div>
          <button className="btn-ghost" onClick={handleAiSummary} disabled={aiLoading}>
            {aiLoading ? 'Summarizing...' : 'Summarize week'}
          </button>
        </div>
      </motion.div>

      <hr className="rule" />

      {/* AI Summary */}
      {(aiSummary || aiLoading) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 20 }}
        >
          {aiLoading ? (
            <div className="loading-state"><div className="spinner" /><span>Reading your entries...</span></div>
          ) : (
            <div className="summary-block">
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, fontWeight: 400 }}>
                Past Week
              </div>
              <p className="summary-text">{aiSummary}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Journal Editor */}
      <motion.div {...stagger(1)} className="journal-editor" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="section-title">Today's entry</div>
          <span className="journal-save-status">{saveLabel}</span>
        </div>
        <textarea
          className="journal-textarea"
          value={content}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Begin here. What arose today? What did you notice?"
        />
      </motion.div>

      {/* Past Entries */}
      {entries.length > 1 && (
        <motion.div {...stagger(2)} style={{ marginTop: 48 }}>
          <div className="section-title" style={{ marginBottom: 4 }}>Past entries</div>
          <ul className="entry-list">
            {entries
              .filter(e => e.date !== selectedDate || e.content)
              .map(entry => (
                <li
                  key={entry.date}
                  className="entry-item"
                  onClick={() => setSelectedDate(entry.date)}
                  style={{ borderTop: entry.date === entries[0]?.date ? '1px solid var(--rule)' : 'none' }}
                >
                  <span className="entry-date">
                    {formatDisplayDate(entry.date)}
                    {entry.date === today && (
                      <span style={{ color: 'var(--gold)', marginLeft: 6 }}>·</span>
                    )}
                  </span>
                  <span className="entry-preview">
                    {entry.content?.trim().slice(0, 120) || (
                      <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Empty</span>
                    )}
                  </span>
                </li>
              ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}
