import { motion } from 'framer-motion'

export default function ProgressDots({ step }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {[1, 2, 3].map((n) => (
        <motion.div
          key={n}
          animate={{
            backgroundColor: step === n ? '#9B7540' : 'transparent',
            borderColor: step === n ? '#9B7540' : '#9B754080',
            scale: step === n ? 1.15 : 1,
          }}
          transition={{ duration: 0.3 }}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            border: '1.5px solid',
            borderColor: '#9B754080',
          }}
        />
      ))}
    </div>
  )
}
