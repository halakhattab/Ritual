import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

const TIMEOUT_MS = 3000

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ])
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let settled = false

    function finish() {
      if (!settled) {
        settled = true
        setLoading(false)
      }
    }

    // Hard-cap the initial session check at 3 seconds
    const safetyTimer = setTimeout(() => {
      finish()
    }, TIMEOUT_MS)

    withTimeout(supabase.auth.getSession(), TIMEOUT_MS)
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id).finally(finish)
        } else {
          finish()
        }
      })
      .catch(() => {
        // Timeout or network error — fall through to login
        finish()
      })
      .finally(() => clearTimeout(safetyTimer))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id).catch(() => setProfile(null))
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await withTimeout(
        supabase.from('users').select('*').eq('id', userId).single(),
        TIMEOUT_MS
      )
      if (data) {
        setProfile(data)
        return
      }
      // Row doesn't exist yet — create it
      const { data: newProfile } = await supabase
        .from('users')
        .insert({ id: userId, name: '', city: '' })
        .select()
        .single()
      setProfile(newProfile ?? null)
    } catch {
      // Profile fetch failed — proceed without it; user is still logged in
      setProfile(null)
    }
  }

  async function updateProfile(updates) {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      if (!error && data) setProfile(data)
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
