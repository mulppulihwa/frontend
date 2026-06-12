export default function PreparationButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 'min(100%, 160px)',
        minHeight: 46,
        padding: '11px 14px',
        border: 'none',
        borderRadius: 999,
        background: '#076818',
        color: '#fff',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: '-0.2px',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
    >
      준비물 확인 →
    </button>
  )
}
