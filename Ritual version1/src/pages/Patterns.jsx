import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { generateSummary } from '../lib/claude'
import { useAuth } from '../contexts/AuthContext'
import StreakChart from '../components/patterns/StreakChart'
import CompletionHeatmap from '../components/patterns/CompletionHeatmap'
import MoodChart from '../components/patterns/MoodChart'

function toDateStr(d) {
  return d.toISOString().slice(0, 10)
}

const stagger = i => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] },
})

export default function Patterns() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [chartData7, setChartData7] = useState([])
  const [chartData30, setChartData30] = useState([])
  const [heatmapData, setHeatmapData] = useState({})
  const [moodData, setMoodData] = useState({})
  const [bestRitual, setBestRitual] = useState(null)
  const [worstRitual, setWorstRitual] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    const now = new Date()
    const thirtyDaysAgo = toDateStr(new Date(now - 30 * 86400000))
    const sevenDaysAgo = toDateStr(new Date(now - 7 * 86400000))

    const [{ data: logs }, { data: moods }, { data: rituals }] = await Promise.all([
      supabase.from('ritual_logs').select('*, rituals(name, category)').eq('user_id', user.id).gte('date', thirtyDaysAgo).order('date'),
      supabase.from('mood_logs').select('*').eq('user_id', user.id).gte('date', thirtyDaysAgo),
      supabase.from('rituals').select('*').eq('user_id', user.id).eq('active', true),
    ])

    if (!logs) { setLoading(false); return }

    // ─── Daily completion rates ───────────────────────────
    const byDate = {}
    logs.forEach(l => {
      if (!byDate[l.date]) byDate[l.date] = { total: 0, completed: 0 }
      byDate[l.date].total++
      if (l.completed) byDate[l.date].completed++
    })

    const allDays = Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, rate: v.total > 0 ? v.completed / v.total : 0 }))

    const cutoff7 = sevenDaysAgo
    setChartData7(allDays.filter(d => d.date >= cutoff7))
    setChartData30(allDays)

    // ─── Overall stats ────────────────────────────────────
    const totalLogs = logs.length
    const totalCompleted = logs.filter(l => l.completed).length
    const completionRate = totalLogs > 0 ? Math.round((totalCompleted / totalLogs) * 100) : 0

    // Streak
    let streak = 0
    const today = toDateStr(now)
    let cursor = today
    for (const day of [...allDays].reverse()) {
      if (day.date !== cursor) break
      if (day.rate === 0) break
      streak++
      const d = new Date(cursor)
      d.setDate(d.getDate() - 1)
      cursor = toDateStr(d)
    }

    setStats({ completionRate, streak, totalDays: allDays.length })

    // ─── Heatmap ──────────────────────────────────────────
    const hmap = {}
    logs.forEach(l => {
      if (!l.completed || !l.completed_at) return
      const d = new Date(l.completed_at)
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
      const hour = String(d.getHours()).padStart(2, '0')
      const key = `${dayName}-${hour}`
      if (!hmap[key]) hmap[key] = { total: 0, count: 0 }
      hmap[key].count++
      hmap[key].total++
    })
    const hmapRates = {}
    Object.entries(hmap).forEach(([k, v]) => {
      hmapRates[k] = v.total > 0 ? v.count / v.total : 0
    })
    setHeatmapData(hmapRates)

    // ─── Mood ─────────────────────────────────────────────
    const moodCounts = {}
    moods?.forEach(m => { moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1 })
    setMoodData(moodCounts)

    // ─── Best / worst ritual ──────────────────────────────
    const ritualStats = {}
    logs.forEach(l => {
      const name = l.rituals?.name ?? l.ritual_id
      if (!ritualStats[name]) ritualStats[name] = { total: 0, completed: 0 }
      ritualStats[name].total++
      if (l.completed) ritualStats[name].completed++
    })
    const ritualArr = Object.entries(ritualStats)
      .filter(([, v]) => v.total >= 3)
      .map(([name, v]) => ({ name, rate: v.completed / v.total, total: v.total }))
      .sort((a, b) => b.rate - a.rate)
    setBestRitual(ritualArr[0] ?? null)
    setWorstRitual(ritualArr[ritualArr.length - 1] ?? null)

    setLoading(false)

    // ─── Weekly AI summary ────────────────────────────────
    const weekKey = `weekly-summary:${getWeekKey()}`
    const { data: cached } = await supabase
      .from('ai_cache')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', weekKey)
      .single()

    if (cached) {
      setWeeklySummary(cached.content)
      return
    }

    if (logs.filter(l => l.date >= sevenDaysAgo).length < 3) return

    setSummaryLoading(true)
    try {
      const content = await generateSummary({
        type: 'weekly_patterns',
        payload: {
          name: profile?.name || '',
          completionRate,
          streak,
          moods: moods?.filter(m => m.date >= sevenDaysAgo),
          topRitual: ritualArr[0]?.name,
          skipRitual: ritualArr[ritualArr.length - 1]?.name,
        },
      })
      setWeeklySummary(content)
      await supabase.from('ai_cache').insert({ user_id: user.id, type: weekKey, content })
    } catch {
      // Silently fail
    } finally {
      setSummaryLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container page-pad">
        <div className="loading-state" style={{ paddingTop: 48 }}>
          <div className="spinner" />
          <span>Loading your patterns...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container page-pad">
      {/* Header */}
      <motion.div {...stagger(0)}>
        <div style={{ paddingBottom: 12 }}>
          <h1 className="display" style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 400, color: 'var(--l-fg)', lineHeight: 1.04 }}>Patterns</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--l-muted)', marginTop: 10, fontWeight: 400, letterSpacing: '0.04em' }}>Your last 30 days</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div {...stagger(1)} className="patterns-grid">
        <div className="patterns-stat">
          <div className="patterns-stat-val">{stats.completionRate ?? 0}%</div>
          <div className="patterns-stat-label">30-Day Rate</div>
        </div>
        <div className="patterns-stat">
          <div className="patterns-stat-val">{stats.streak ?? 0}</div>
          <div className="patterns-stat-label">Current Streak</div>
        </div>
        <div className="patterns-stat">
          <div className="patterns-stat-val">{Object.keys(moodData).length > 0
            ? Object.entries(moodData).sort((a, b) => b[1] - a[1])[0][0]
            : '—'}
          </div>
          <div className="patterns-stat-label">Dominant Mood</div>
        </div>
        <div className="patterns-stat">
          <div className="patterns-stat-val">{stats.totalDays ?? 0}</div>
          <div className="patterns-stat-label">Days Tracked</div>
        </div>
      </motion.div>

      {/* Weekly AI Summary */}
      {(weeklySummary || summaryLoading) && (
        <motion.div {...stagger(2)} style={{ paddingTop: 24 }}>
          {summaryLoading ? (
            <div className="loading-state"><div className="spinner" /><span>Generating weekly insight...</span></div>
          ) : (
            <div className="summary-block">
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, fontWeight: 400 }}>
                Weekly Insight
              </div>
              <p className="summary-text">{weeklySummary}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Charts */}
      <motion.div {...stagger(3)}>
        <StreakChart data={chartData7} title="7-Day Completion Rate" />
      </motion.div>

      <motion.div {...stagger(4)}>
        <StreakChart data={chartData30} title="30-Day Completion Rate" />
      </motion.div>

      <motion.div {...stagger(5)}>
        <CompletionHeatmap data={heatmapData} />
      </motion.div>

      <motion.div {...stagger(6)}>
        <MoodChart data={moodData} />
      </motion.div>

      {/* Best / Worst Ritual Cards */}
      <motion.div {...stagger(7)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 64 }}>
        {bestRitual && (
          <div className="highlight-card">
            <div className="highlight-card-label">Best Performing</div>
            <div className="highlight-card-name">{bestRitual.name}</div>
            <div className="highlight-card-stat">{Math.round(bestRitual.rate * 100)}% completion</div>
          </div>
        )}
        {worstRitual && worstRitual.name !== bestRitual?.name && (
          <div className="highlight-card">
            <div className="highlight-card-label">Most Skipped</div>
            <div className="highlight-card-name">{worstRitual.name}</div>
            <div className="highlight-card-stat">{Math.round(worstRitual.rate * 100)}% completion</div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function getWeekKey() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${week}`
}
