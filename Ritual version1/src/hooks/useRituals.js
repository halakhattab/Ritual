import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useRituals() {
  const { user } = useAuth()
  const [rituals, setRituals] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRituals = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('rituals')
      .select('*')
      .eq('user_id', user.id)
      .order('order', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: false })
    setRituals(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchRituals()
  }, [fetchRituals])

  async function addRitual(ritual) {
    const maxOrder = rituals.length > 0
      ? Math.max(...rituals.map(r => r.order ?? 0))
      : -1
    const payload = { ...ritual, user_id: user.id, order: maxOrder + 1 }
    console.log('[useRituals] addRitual — payload:', payload)
    const { data, error } = await supabase
      .from('rituals')
      .insert(payload)
      .select()
      .single()
    if (error) {
      console.error('[useRituals] addRitual — Supabase error:', error)
    } else {
      console.log('[useRituals] addRitual — saved successfully:', data)
      setRituals(prev => [...prev, data])
    }
    return { data, error }
  }

  async function updateRitual(id, updates) {
    console.log('[useRituals] updateRitual — id:', id, 'updates:', updates)
    const { data, error } = await supabase
      .from('rituals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('[useRituals] updateRitual — Supabase error:', error)
    } else {
      console.log('[useRituals] updateRitual — success:', data)
      setRituals(prev => prev.map(r => r.id === id ? data : r))
    }
    return { data, error }
  }

  async function deleteRitual(id) {
    console.log('[useRituals] deleteRitual — id:', id)
    const { error } = await supabase.from('rituals').delete().eq('id', id)
    if (error) {
      console.error('[useRituals] deleteRitual — Supabase error:', error)
    } else {
      console.log('[useRituals] deleteRitual — success')
      setRituals(prev => prev.filter(r => r.id !== id))
    }
    return { error }
  }

  async function reorderRituals(newOrder) {
    setRituals(newOrder)
    // Persist new order using individual updates (upsert with reserved "order" keyword is unreliable)
    await Promise.all(
      newOrder.map((r, idx) =>
        supabase.from('rituals').update({ order: idx }).eq('id', r.id)
      )
    )
  }

  return { rituals, loading, addRitual, updateRitual, deleteRitual, reorderRituals, refetch: fetchRituals }
}

export function useTodayLogs(date) {
  const { user } = useAuth()
  const [logs, setLogs] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !date) return
    async function fetch() {
      const { data } = await supabase
        .from('ritual_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
      const logMap = {}
      data?.forEach(l => { logMap[l.ritual_id] = l })
      setLogs(logMap)
      setLoading(false)
    }
    fetch()
  }, [user, date])

  async function toggleLog(ritualId, completed) {
    const existing = logs[ritualId]
    const now = new Date().toISOString()

    if (existing) {
      const { data } = await supabase
        .from('ritual_logs')
        .update({ completed, completed_at: completed ? now : null })
        .eq('id', existing.id)
        .select()
        .single()
      if (data) setLogs(prev => ({ ...prev, [ritualId]: data }))
    } else {
      const { data } = await supabase
        .from('ritual_logs')
        .insert({
          user_id: user.id,
          ritual_id: ritualId,
          date,
          completed,
          completed_at: completed ? now : null,
        })
        .select()
        .single()
      if (data) setLogs(prev => ({ ...prev, [ritualId]: data }))
    }
  }

  return { logs, loading, toggleLog }
}

export function useMoodLog(date) {
  const { user } = useAuth()
  const [mood, setMoodState] = useState(null)

  useEffect(() => {
    if (!user || !date) return
    async function fetch() {
      const { data } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .single()
      if (data) setMoodState(data.mood)
    }
    fetch()
  }, [user, date])

  async function setMood(m) {
    setMoodState(m)
    await supabase.from('mood_logs').upsert({
      user_id: user.id,
      date,
      mood: m,
    }, { onConflict: 'user_id,date' })
  }

  return { mood, setMood }
}
