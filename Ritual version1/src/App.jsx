import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Today from './pages/Today'
import Patterns from './pages/Patterns'
import Rituals from './pages/Rituals'
import Reflect from './pages/Reflect'
import Settings from './pages/Settings'

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#F2EDE4',
      gap: 20,
    }}>
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: '2rem',
        fontWeight: 400,
        color: '#0D0B08',
        letterSpacing: '0.04em',
        opacity: 0.7,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}>
        Ritual
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#9B7540', marginBottom: 2 }} />
      </div>
      <div className="spinner" style={{ borderColor: 'rgba(13,11,8,0.15)', borderTopColor: '#9B7540' }} />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Today />} />
          <Route path="patterns" element={<Patterns />} />
          <Route path="rituals" element={<Rituals />} />
          <Route path="reflect" element={<Reflect />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
