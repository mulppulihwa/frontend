import { useEffect, useState } from 'react'

export default function StepIndicator({ current, total }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = requestAnimationFrame(() => setWidth((current / total) * 100))
    return () => cancelAnimationFrame(t)
  }, [current, total])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 5, background: '#e8e8e8', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          borderRadius: 999,
          background: '#076818',
          width: `${width}%`,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#bbb', whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>
        {current} / {total}
      </span>
    </div>
  )
}
