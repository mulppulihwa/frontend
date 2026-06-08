import { ArrowLeft, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TopBar({ title, onBack, onClose }) {
  const navigate = useNavigate()
  return (
    <>
    <div style={{ height: 74, flexShrink: 0 }} />
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '28px 20px',
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(100%, 430px)',
      boxSizing: 'border-box',
      background: '#FDFCF8',
      zIndex: 100,
    }}>
      <button
        onClick={onBack ?? (() => navigate(-1))}
        style={{ position: 'absolute', left: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 8 }}
      >
        <ArrowLeft size={18} color="#1a1a1a" strokeWidth={2} />
      </button>
      <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.2px' }}>{title}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ position: 'absolute', right: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 8 }}
        >
          <X size={18} color="#1a1a1a" strokeWidth={2} />
        </button>
      )}
    </div>
    </>
  )
}
