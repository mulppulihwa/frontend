import farmer from '../assets/farmer.png'

export default function PolicyUpdateModal({ visible, onClose, navigate }) {
  if (!visible) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        background: 'rgba(253,252,248,0.72)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 330,
          borderRadius: 30,
          border: '1.5px solid #dbead5',
          background: '#FFFFFF',
          padding: '28px 24px 26px',
          textAlign: 'center',
          boxSizing: 'border-box',
          animation: 'modalPop 0.2s ease',
        }}
      >
        <img src={farmer} alt="" style={{ width: 82, height: 58, objectFit: 'cover', objectPosition: 'top center', marginBottom: 24 }} />
        <p style={{ fontSize: 20, fontWeight: 800, color: '#000', lineHeight: 1.32, letterSpacing: '-0.4px', wordBreak: 'keep-all' }}>
          새해 맞이 2027년 옥천 귀농 정책이 업데이트되었어요!
        </p>
        <p style={{ marginTop: 24, fontSize: 17, fontWeight: 500, color: '#000', lineHeight: 1.42, letterSpacing: '-0.3px', wordBreak: 'keep-all' }}>
          내 조건으로 새로 받을 수 있는 지원금이 있는지 지금 바로 확인해 보세요!
        </p>
        <button
          type="button"
          onClick={() => navigate('/step1')}
          style={{
            width: '100%',
            minHeight: 54,
            marginTop: 34,
            border: 'none',
            borderRadius: 999,
            background: '#FFA100',
            color: '#FFFFFF',
            fontSize: 17,
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: 'pointer',
            letterSpacing: '-0.5px',
          }}
        >
          나의 맞춤 지원금 다시 찾기
        </button>
      </div>
      <style>{`@keyframes modalPop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  )
}
