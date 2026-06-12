export default function PreparationButton({ onClick }) {
  return (
    <button
      className="app-action-button app-content-action-button"
      type="button"
      onClick={onClick}
      style={{
        padding: '0 14px',
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
