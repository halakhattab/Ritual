import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { generateIntention, generateSummary } from '../lib/claude'
import { useAuth } from '../contexts/AuthContext'
import { useWeather } from '../hooks/useWeather'
import { useRituals, useTodayLogs, useMoodLog } from '../hooks/useRituals'

import Greeting from '../components/today/Greeting'
import WeatherStrip from '../components/today/WeatherStrip'
import CalendarStrip from '../components/today/CalendarStrip'
import Ticker from '../components/Ticker'
import MoodCheckIn from '../components/today/MoodCheckIn'
import RitualList from '../components/today/RitualList'
import ProgressBar from '../components/today/ProgressBar'
import BottomPanel from '../components/today/BottomPanel'

function toDateStr(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function calcStreak(logs30) {
  let streak = 0
  const today = toDateStr()
  let cursor = today
  for (const day of logs30) {
    if (day.date !== cursor) break
    if (day.completed_count === 0) break
    streak++
    const d = new Date(cursor)
    d.setDate(d.getDate() - 1)
    cursor = toDateStr(d)
  }
  return streak
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)',
      fontSize: '0.65rem',
      fontWeight: 500,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: 'var(--soft)',
      marginBottom: 20,
    }}>
      {children}
    </div>
  )
}

export default function Today() {
  const { user, profile } = useAuth()
  const today = toDateStr()

  const { rituals, loading: ritualsLoading } = useRituals()
  const { logs, toggleLog } = useTodayLogs(today)
  const { mood, setMood } = useMoodLog(today)

  const { weather, loading: weatherLoading, error: weatherError } = useWeather(profile?.city || null)

  const [intention, setIntention] = useState('')
  const [intentionLoading, setIntentionLoading] = useState(false)

  const [calEvents, setCalEvents] = useState([])
  const calConnected = !!localStorage.getItem('gcal_token')

  const [tickerItems, setTickerItems] = useState([])
  const [reflection, setReflection] = useState('')
  const [reflectionLoading, setReflectionLoading] = useState(false)

  const activeRituals = rituals.filter(r => r.active !== false)
  const completedCount = activeRituals.filter(r => logs[r.id]?.completed).length

  // Load today's intention
  useEffect(() => {
    if (!user) return
    async function loadIntention() {
      setIntentionLoading(true)
      try {
        const { data: cached } = await supabase
          .from('ai_cache')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', `intention:${today}`)
          .maybeSingle()

        if (cached) { setIntention(cached.content); return }

        const content = await generateIntention({
          name: profile?.name || '',
          mood,
          weather: weather ? `${weather.temp}°F, ${weather.condition}` : null,
          events: calEvents,
        })
        setIntention(content)
        await supabase.from('ai_cache').insert({ user_id: user.id, type: `intention:${today}`, content })
      } catch { /* silent */ } finally {
        setIntentionLoading(false)
      }
    }
    loadIntention()
  }, [user, today, profile?.name])

  // Load calendar events
  useEffect(() => {
    if (!calConnected) return
    const stored = localStorage.getItem('gcal_events')
    const storedDate = localStorage.getItem('gcal_events_date')
    if (stored && storedDate === today) { setCalEvents(JSON.parse(stored)); return }
    localStorage.removeItem('gcal_events')
  }, [calConnected, today])

  // Build ticker
  useEffect(() => {
    if (ritualsLoading) return
    async function buildTicker() {
      if (!user) return
      const thirtyDaysAgo = toDateStr(new Date(Date.now() - 30 * 86400000))
      const { data: logs30 } = await supabase
        .from('ritual_logs')
        .select('date, completed')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: false })

      const byDate = {}
      logs30?.forEach(l => {
        if (!byDate[l.date]) byDate[l.date] = { total: 0, completed: 0 }
        byDate[l.date].total++
        if (l.completed) byDate[l.date].completed++
      })
      const days = Object.entries(byDate)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, v]) => ({ date, completed_count: v.completed, total_count: v.total }))

      const streak = calcStreak(days)
      const totalCompleted = logs30?.filter(l => l.completed).length ?? 0
      const totalLogs = logs30?.length ?? 0
      const pct = totalLogs > 0 ? Math.round((totalCompleted / totalLogs) * 100) : 0

      const bestDay = [...days].sort((a, b) => {
        const ra = a.total_count > 0 ? a.completed_count / a.total_count : 0
        const rb = b.total_count > 0 ? b.completed_count / b.total_count : 0
        return rb - ra
      })[0]?.date

      const nextRitual = activeRituals
        .filter(r => !logs[r.id]?.completed && r.start_time)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))[0]

      const { data: moods7 } = await supabase
        .from('mood_logs')
        .select('mood')
        .eq('user_id', user.id)
        .gte('date', toDateStr(new Date(Date.now() - 7 * 86400000)))
      const moodCounts = {}
      moods7?.forEach(m => { moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1 })
      const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

      setTickerItems([
        { label: 'Current streak', value: `${streak}d` },
        { label: '30-day rate', value: `${pct}%` },
        { label: 'Today', value: `${completedCount} / ${activeRituals.length}` },
        ...(nextRitual ? [{ label: 'Next ritual', value: `${nextRitual.name} at ${nextRitual.start_time?.slice(0, 5)}` }] : []),
        ...(topMood ? [{ label: 'Mood trend', value: topMood }] : []),
        ...(bestDay ? [{ label: 'Best recent day', value: new Date(bestDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }) }] : []),
      ])
    }
    buildTicker()
  }, [user, ritualsLoading, completedCount])

  // Load weekly reflection
  useEffect(() => {
    if (!user) return
    const weekKey = `reflection:week:${getWeekKey()}`
    async function loadReflection() {
      setReflectionLoading(true)
      try {
        const { data: cached } = await supabase
          .from('ai_cache').select('*')
          .eq('user_id', user.id).eq('type', weekKey).maybeSingle()
        if (cached) { setReflection(cached.content); return }

        const sevenDaysAgo = toDateStr(new Date(Date.now() - 7 * 86400000))
        const [{ data: logs7 }, { data: moods7 }] = await Promise.all([
          supabase.from('ritual_logs').select('*, rituals(name)').eq('user_id', user.id).gte('date', sevenDaysAgo),
          supabase.from('mood_logs').select('*').eq('user_id', user.id).gte('date', sevenDaysAgo),
        ])
        if (!logs7?.length) return

        const content = await generateSummary({ type: 'weekly', payload: { name: profile?.name || '', logs: logs7, moods: moods7 } })
        setReflection(content)
        await supabase.from('ai_cache').insert({ user_id: user.id, type: weekKey, content })
      } catch { /* silent */ } finally {
        setReflectionLoading(false)
      }
    }
    // Delay reflection slightly so intention and reflection don't fire simultaneously
    const timer = setTimeout(loadReflection, 3000)
    return () => clearTimeout(timer)
  }, [user])

  return (
    <div>
      {/* ── HERO ── */}
      <div className="hero-section">
        <div className="hero-body">
          <Greeting name={profile?.name?.trim() || user?.email?.split('@')[0]} />

          {/* Intention inside hero */}
          <motion.div
            style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(13,11,8,0.1)', maxWidth: 620 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#9B7540',
              marginBottom: 14,
            }}>
              Today's Intention
            </div>
            {intentionLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                <div className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(13,11,8,0.15)', borderTopColor: '#9B7540' }} />
                <span style={{ fontSize: '0.82rem', color: '#6B6258' }}>Setting your intention...</span>
              </div>
            ) : intention ? (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 400,
                fontStyle: 'italic',
                fontSize: '1.6rem',
                color: '#3A3530',
                lineHeight: 1.55,
                margin: 0,
              }}>
                {intention}
              </p>
            ) : null}
          </motion.div>
        </div>

        {/* Ticker — dark strip at bottom of hero */}
        <Ticker items={tickerItems} />
      </div>

      {/* ── DARK SECTION — Weather, Calendar, Mood ── */}
      <div className="section-dark dark-section">
        <div className="container">
          <WeatherStrip weather={weather} loading={weatherLoading} error={weatherError} />
          <CalendarStrip events={calEvents} connected={calConnected} />

          <div style={{ paddingTop: 40 }}>
            <SectionLabel>Mood</SectionLabel>
            <MoodCheckIn mood={mood} onMoodSelect={setMood} />
          </div>
        </div>
      </div>

      {/* ── LIGHT SECTION — Rituals ── */}
      <div className="section-light">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 400, color: 'var(--l-fg)', lineHeight: 1.05, marginBottom: 6 }}>
                Rituals
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--l-muted)' }}>
                {activeRituals.length} scheduled today
              </div>
            </div>
          </div>

          {ritualsLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>Loading rituals...</span>
            </div>
          ) : (
            <>
              <RitualList rituals={activeRituals} logs={logs} onToggle={toggleLog} />
              {activeRituals.length > 0 && (
                <ProgressBar completed={completedCount} total={activeRituals.length} />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── DARK SECTION — Reflection + Guide ── */}
      <div className="section-dark dark-section">
        <div className="container">
          <BottomPanel
            summary={reflection}
            summaryLoading={reflectionLoading}
          />
        </div>
      </div>
    </div>
  )
}

function getWeekKey() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${week}`
}
