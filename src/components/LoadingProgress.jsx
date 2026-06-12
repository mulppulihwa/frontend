export default function LoadingProgress({ progress, label, detail, emphasizeDetail = false }) {
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
        <p
          key={detail}
          className={emphasizeDetail ? 'loading-result-message' : undefined}
          style={{
            margin: emphasizeDetail ? '2px 0 2px' : '-5px 0 0',
            fontSize: emphasizeDetail ? 18 : 12,
            fontWeight: emphasizeDetail ? 700 : 400,
            lineHeight: emphasizeDetail ? 1.45 : 1.4,
            color: emphasizeDetail ? '#1f2433' : '#888',
            letterSpacing: emphasizeDetail ? '-0.3px' : 0,
            wordBreak: 'keep-all',
            animation: emphasizeDetail
              ? 'loadingResultReveal 0.65s cubic-bezier(0.22, 1, 0.36, 1) both'
              : 'none',
          }}
        >
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
      {emphasizeDetail && (
        <style>{`
          @keyframes loadingResultReveal {
            0% { opacity: 0; transform: translateY(12px) scale(0.97); filter: blur(3px); }
            65% { opacity: 1; transform: translateY(-1px) scale(1.01); filter: blur(0); }
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .loading-result-message { animation: none !important; }
          }
        `}</style>
      )}
    </div>
  )
}
