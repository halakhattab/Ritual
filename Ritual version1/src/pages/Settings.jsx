import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const stagger = i => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] },
})

export default function Settings() {
  const { user, profile, updateProfile } = useAuth()

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [calConnected, setCalConnected] = useState(false)
  const [authError, setAuthError] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [accountMsg, setAccountMsg] = useState('')

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setCity(profile.city ?? '')
    }
    setCalConnected(!!localStorage.getItem('gcal_token'))
  }, [profile])

  async function handleProfileSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await updateProfile({ name: name.trim(), city: city.trim() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  // Google Calendar OAuth
  function handleConnectCalendar() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      alert('Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.')
      return
    }
    const redirect = `${window.location.origin}/settings`
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly')
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=token&scope=${scope}`
    window.location.href = url
  }

  function handleDisconnectCalendar() {
    localStorage.removeItem('gcal_token')
    localStorage.removeItem('gcal_events')
    localStorage.removeItem('gcal_events_date')
    setCalConnected(false)
  }

  // Handle OAuth callback
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', '?'))
      const token = params.get('access_token')
      if (token) {
        localStorage.setItem('gcal_token', token)
        setCalConnected(true)
        window.history.replaceState({}, '', '/settings')
      }
    }
  }, [])

  async function handleEmailUpdate(e) {
    e.preventDefault()
    setAccountMsg('')
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setAccountMsg(error ? error.message : 'Confirmation sent to new email.')
    setNewEmail('')
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault()
    setAccountMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setAccountMsg(error ? error.message : 'Password updated.')
    setNewPassword('')
  }

  return (
    <div className="container page-pad">
      {/* Header */}
      <motion.div {...stagger(0)}>
        <div style={{ paddingBottom: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 400, color: 'var(--l-fg)', lineHeight: 1.04 }}>Settings</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--l-muted)', marginTop: 10, fontWeight: 400, letterSpacing: '0.04em' }}>
            {user?.email}
          </p>
        </div>
      </motion.div>

      <hr className="rule" />

      {/* Profile */}
      <motion.section {...stagger(1)} className="settings-section">
        <div className="settings-section-title">Profile</div>
        <form onSubmit={handleProfileSave}>
          <div className="form-group">
            <label>Display name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label>Home city</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. New York, London, Tokyo"
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              Used for weather. Leave blank to use your device location.
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save profile'}
          </button>
        </form>
      </motion.section>

      {/* Google Calendar */}
      <motion.section {...stagger(2)} className="settings-section">
        <div className="settings-section-title">Integrations</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>
              Google Calendar
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              See your day's events alongside your rituals and improve AI suggestions.
            </div>
          </div>

          {calConnected ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="connected-badge">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="var(--gold)">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Connected
              </span>
              <button className="btn-ghost" onClick={handleDisconnectCalendar}>Disconnect</button>
            </div>
          ) : (
            <button className="btn-ghost" onClick={handleConnectCalendar}>Connect</button>
          )}
        </div>
      </motion.section>

      {/* Account */}
      <motion.section {...stagger(3)} className="settings-section">
        <div className="settings-section-title">Account</div>

        {accountMsg && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16, padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
            {accountMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <form onSubmit={handleEmailUpdate}>
            <div className="form-group">
              <label>New email</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder={user?.email}
              />
            </div>
            <button type="submit" className="btn-ghost">Update email</button>
          </form>

          <form onSubmit={handlePasswordUpdate}>
            <div className="form-group">
              <label>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
              />
            </div>
            <button type="submit" className="btn-ghost">Update password</button>
          </form>
        </div>
      </motion.section>

      {/* Sign out */}
      <motion.section {...stagger(4)} style={{ paddingTop: 24, paddingBottom: 48 }}>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: '0.68rem',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--l-muted)',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            fontFamily: 'var(--font-body)',
            padding: 0,
            transition: 'color 0.22s ease',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--l-soft)'}
          onMouseLeave={e => e.target.style.color = 'var(--l-muted)'}
        >
          Sign out
        </button>
      </motion.section>
    </div>
  )
}
