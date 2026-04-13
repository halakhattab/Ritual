import React from 'react'

export default function BottomPanel({ summary, summaryLoading }) {
  return (
    <div className="bottom-panel">
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.65rem',
        fontWeight: 500,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--d-soft)',
        marginBottom: 20,
      }}>
        Weekly Reflection
      </div>

      {summaryLoading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Gathering insights...</span>
        </div>
      ) : (
        <div className="summary-block" style={{ marginTop: 0 }}>
          <p className="summary-text">
            {summary || 'Complete a few rituals and check in with your mood — your reflection will appear here at the end of the week.'}
          </p>
        </div>
      )}
    </div>
  )
}
