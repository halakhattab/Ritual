import React, { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV_LINKS = [
  { to: '/', label: 'Today', end: true },
  { to: '/patterns', label: 'Patterns' },
  { to: '/rituals', label: 'Rituals' },
  { to: '/reflect', label: 'Reflect' },
  { to: '/settings', label: 'Settings' },
]

export default function Nav() {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`nav ${scrolled ? 'nav-solid' : 'nav-transparent'}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-wordmark">
          Ritual<span className="nav-wordmark-dot" />
        </Link>

        {user && (
          <ul className="nav-links">
            {NAV_LINKS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `nav-link${isActive ? ' active' : ''}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  )
}
