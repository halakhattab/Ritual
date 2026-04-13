export default function Wordmark({ dark = false }) {
  return (
    <div
      style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: '1.4rem',
        fontWeight: 400,
        letterSpacing: '0.02em',
        color: dark ? '#C4A46B' : '#9B7540',
        userSelect: 'none',
      }}
    >
      ritual<span style={{ color: dark ? '#C4A46B' : '#9B7540' }}>.</span>
    </div>
  )
}
