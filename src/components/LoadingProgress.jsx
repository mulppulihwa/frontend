import okcheonCharacter from '../assets/okcheon-character.png'

export default function LoadingProgress({ progress, label, detail, emphasizeDetail = false, fullPage = false }) {
  const value = Math.max(0, Math.min(100, Math.round(progress)))
  const characterPosition = Math.max(10, Math.min(90, value))

  return (
    <div style={{
      width: fullPage ? 'min(100%, 360px)' : 'min(100%, 280px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: fullPage ? 20 : 12,
      textAlign: 'center',
    }}>
      <p style={{ margin: 0, fontSize: fullPage ? 26 : 14, fontWeight: fullPage ? 800 : 650, color: fullPage ? '#000' : '#1f2433', letterSpacing: fullPage ? '-0.5px' : '-0.1px' }}>
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
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: fullPage ? 'column' : 'row',
        alignItems: fullPage ? 'stretch' : 'center',
        gap: fullPage ? 10 : 10,
        marginTop: fullPage ? 82 : 0,
      }}>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          style={{
            position: 'relative',
            flex: fullPage ? 'none' : 1,
            width: '100%',
            height: fullPage ? 32 : 8,
            overflow: fullPage ? 'visible' : 'hidden',
            borderRadius: 999,
            border: fullPage ? '3px solid #d9d9d9' : 'none',
            background: fullPage ? '#FFFFFF' : '#e6ece3',
            boxSizing: 'border-box',
          }}
        >
          <div style={{
            width: `${value}%`,
            height: '100%',
            borderRadius: 999,
            background: '#076818',
            transition: 'width 0.2s ease, background 0.2s ease',
          }} />
          {fullPage && (
            <img
              src={okcheonCharacter}
              alt=""
              style={{
                position: 'absolute',
                left: `${characterPosition}%`,
                bottom: 19,
                width: 82,
                height: 82,
                objectFit: 'contain',
                transform: 'translateX(-50%)',
                transition: 'left 0.2s ease',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        <strong style={{
          width: fullPage ? '100%' : 38,
          fontSize: fullPage ? 20 : 13,
          fontWeight: fullPage ? 800 : 750,
          color: fullPage ? '#000' : value === 100 ? '#076818' : '#5f625d',
          textAlign: fullPage ? 'center' : 'right',
        }}>
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
