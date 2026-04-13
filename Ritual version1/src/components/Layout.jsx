import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Nav from './Nav'

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
}

const pageTransition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1],
}

export default function Layout() {
  const location = useLocation()

  useEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [location.pathname])

  return (
    <div className="app-shell">
      <Nav />
      <AnimatePresence>
        <motion.main
          key={location.pathname}
          className="page-content"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  )
}
