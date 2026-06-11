export default function LoadingProgress({ progress, label, detail }) {
  const value = Math.max(0, Math.min(100, Math.round(progress)))

  return (
    <div style={{
      width: 'min(100%, 280px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      textAlign: 'center',
    }}>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: '#1f2433', letterSpacing: '-0.1px' }}>
        {label}
      </p>
      {detail && (
        <p style={{ margin: '-5px 0 0', fontSize: 12, fontWeight: 400, color: '#888' }}>
          {detail}
        </p>
      )}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          style={{ flex: 1, height: 8, overflow: 'hidden', borderRadius: 999, background: '#e6ece3' }}
        >
          <div style={{
            width: `${value}%`,
            height: '100%',
            borderRadius: 999,
            background: value === 100 ? '#076818' : '#4f8f58',
            transition: 'width 0.2s ease, background 0.2s ease',
          }} />
        </div>
        <strong style={{ width: 38, fontSize: 13, fontWeight: 750, color: value === 100 ? '#076818' : '#5f625d', textAlign: 'right' }}>
          {value}%
        </strong>
      </div>
    </div>
  )
}
