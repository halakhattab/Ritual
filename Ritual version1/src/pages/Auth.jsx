import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('users').upsert({ id: data.user.id, name: name.trim(), city: '' })
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Left — dark, wordmark */}
      <div className="auth-left">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="auth-left-wordmark">
            Ritual<span className="auth-left-dot" />
          </div>
          <p className="auth-left-tagline">
            A quiet space for your daily rituals. Every practice, remembered.
          </p>
        </motion.div>
      </div>

      {/* Right — light, form */}
      <div className="auth-right">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="auth-tabs">
            <button
              className={`auth-tab${tab === 'signin' ? ' active' : ''}`}
              onClick={() => { setTab('signin'); setError('') }}
            >
              Sign in
            </button>
            <button
              className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
              onClick={() => { setTab('signup'); setError('') }}
            >
              Create account
            </button>
          </div>

          {error && <div className="auth-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {tab === 'signup' && (
              <div className="form-group">
                <label>Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="How should we address you?"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={tab === 'signup' ? 'At least 8 characters' : 'Your password'}
                required
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Please wait...' : tab === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
