import React, { useState } from 'react'
import { motion, Reorder, AnimatePresence } from 'framer-motion'
import { useRituals } from '../hooks/useRituals'
import RitualForm from '../components/rituals/RitualForm'
import { displayTime } from '../lib/timeUtils'

const stagger = i => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.05, ease: [0.25, 0.1, 0.25, 1] },
})

function DragHandle() {
  return (
    <div className="drag-handle" style={{ cursor: 'grab' }}>
      <span />
      <span />
      <span />
    </div>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <polyline points="1,3 13,3" />
      <path d="M5 3V2h4v1" />
      <rect x="2" y="3" width="10" height="9" rx="1" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M9.5 2.5l2 2L5 11H3V9l6.5-6.5z" />
    </svg>
  )
}

export default function Rituals() {
  const { rituals, loading, addRitual, updateRitual, deleteRitual, reorderRituals } = useRituals()
  const [showForm, setShowForm] = useState(false)
  const [editingRitual, setEditingRitual] = useState(null)
  const [items, setItems] = useState(null)
  const [saveError, setSaveError] = useState('')

  const displayRituals = items ?? rituals

  async function handleSave(data) {
    setSaveError('')
    if (editingRitual) {
      const { error } = await updateRitual(editingRitual.id, data)
      if (error) {
        setSaveError(`Could not save: ${error.message}`)
      } else {
        setEditingRitual(null)
      }
    } else {
      const { error } = await addRitual(data)
      if (error) {
        setSaveError(`Could not save: ${error.message}`)
      } else {
        setShowForm(false)
      }
    }
  }

  function handleEdit(ritual) {
    setEditingRitual(ritual)
    setShowForm(false)
  }

  async function handleDelete(id) {
    if (!confirm('Remove this ritual?')) return
    await deleteRitual(id)
  }

  async function handleReorder(newOrder) {
    setItems(newOrder)
    await reorderRituals(newOrder)
  }

  async function handleToggleActive(id, active) {
    await updateRitual(id, { active })
  }

  return (
    <div className="container page-pad">
      <motion.div {...stagger(0)}>
        <div style={{ paddingBottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 400, color: 'var(--l-fg)', lineHeight: 1.04 }}>Rituals</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--l-muted)', marginTop: 10, fontWeight: 400, letterSpacing: '0.04em' }}>
              {rituals.filter(r => r.active).length} active · {rituals.length} total
            </p>
          </div>
          <button
            className="btn-ghost"
            onClick={() => { setShowForm(!showForm); setEditingRitual(null) }}
          >
            {showForm ? 'Cancel' : '+ Add ritual'}
          </button>
        </div>
      </motion.div>

      <hr className="rule" />

      {saveError && (
        <div style={{ fontSize: '0.85rem', color: '#C0614A', padding: '10px 0', borderBottom: '1px solid rgba(192,97,74,0.2)' }}>
          {saveError}
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <RitualForm
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Edit form */}
      <AnimatePresence>
        {editingRitual && (
          <RitualForm
            initial={editingRitual}
            onSave={handleSave}
            onCancel={() => setEditingRitual(null)}
          />
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="loading-state" style={{ paddingTop: 32 }}>
          <div className="spinner" />
          <span>Loading rituals...</span>
        </div>
      ) : displayRituals.length === 0 ? (
        <div className="empty-state">
          No rituals yet. Add your first above.
        </div>
      ) : (
        <motion.div {...stagger(1)}>
          <Reorder.Group
            as="ul"
            axis="y"
            values={displayRituals}
            onReorder={handleReorder}
            style={{ listStyle: 'none' }}
          >
            {displayRituals.map(ritual => (
              <Reorder.Item
                key={ritual.id}
                value={ritual}
                style={{ listStyle: 'none' }}
              >
                <div className="ritual-builder-item">
                  <DragHandle />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="ritual-builder-name"
                      style={{ opacity: ritual.active ? 1 : 0.38 }}
                    >
                      {ritual.name}
                    </div>
                    <div className="ritual-builder-meta">
                      <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                        {ritual.category}
                      </span>
                      {(ritual.start_time || ritual.end_time) && (
                        <span>
                          {' · '}
                          {displayTime(ritual.start_time)}
                          {ritual.start_time && ritual.end_time && '–'}
                          {displayTime(ritual.end_time)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ritual-builder-actions">
                    <button
                      className="icon-btn"
                      onClick={() => handleEdit(ritual)}
                      style={{ color: 'var(--text-secondary)' }}
                      title="Edit"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => handleDelete(ritual.id)}
                      style={{ color: 'var(--text-secondary)' }}
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                    <button
                      className={`ritual-toggle${ritual.active ? ' on' : ''}`}
                      onClick={() => handleToggleActive(ritual.id, !ritual.active)}
                      title={ritual.active ? 'Deactivate' : 'Activate'}
                    />
                  </div>
                </div>
                <hr className="rule" style={{ margin: 0 }} />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </motion.div>
      )}

      {displayRituals.length > 0 && (
        <motion.p
          {...stagger(2)}
          style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--l-muted)', paddingTop: 24, letterSpacing: '0.16em', textTransform: 'uppercase' }}
        >
          Drag to reorder · toggle to activate
        </motion.p>
      )}
    </div>
  )
}
