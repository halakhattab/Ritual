import React from 'react'
import { motion } from 'framer-motion'
import { displayTime } from '../../lib/timeUtils'

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <polyline points="1,3 13,3" />
      <path d="M5 3V2h4v1" />
      <rect x="2" y="3" width="10" height="9" rx="1" />
      <line x1="5" y1="6" x2="5" y2="10" />
      <line x1="9" y1="6" x2="9" y2="10" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M9.5 2.5l2 2L5 11H3V9l6.5-6.5z" />
    </svg>
  )
}

export default function RitualItem({ ritual, onEdit, onDelete, onToggleActive, dragHandleProps }) {
  return (
    <motion.li
      layout
      className="ritual-builder-item"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="drag-handle" {...dragHandleProps}>
        <span />
        <span />
        <span />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ritual-builder-name" style={{ opacity: ritual.active ? 1 : 0.45 }}>
          {ritual.name}
        </div>
        <div className="ritual-builder-meta">
          {ritual.category}
          {(ritual.start_time || ritual.end_time) && ' · '}
          {displayTime(ritual.start_time)}
          {ritual.start_time && ritual.end_time && '–'}
          {displayTime(ritual.end_time)}
        </div>
      </div>

      <div className="ritual-builder-actions">
        <button
          className="icon-btn"
          onClick={() => onEdit(ritual)}
          title="Edit"
          style={{ color: 'var(--text-secondary)' }}
        >
          <EditIcon />
        </button>
        <button
          className="icon-btn"
          onClick={() => onDelete(ritual.id)}
          title="Delete"
          style={{ color: 'var(--text-secondary)' }}
        >
          <TrashIcon />
        </button>
        <button
          className={`ritual-toggle${ritual.active ? ' on' : ''}`}
          onClick={() => onToggleActive(ritual.id, !ritual.active)}
          title={ritual.active ? 'Deactivate' : 'Activate'}
        />
      </div>
    </motion.li>
  )
}
