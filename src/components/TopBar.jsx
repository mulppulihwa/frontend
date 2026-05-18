import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TopBar({ title, onBack }) {
  const navigate = useNavigate()
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '28px 20px',
      position: 'relative',
      background: 'transparent',
    }}>
      <button
        onClick={onBack ?? (() => navigate(-1))}
        style={{ position: 'absolute', left: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 8 }}
      >
        <ArrowLeft size={18} color="#1a1a1a" strokeWidth={2} />
      </button>
      <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.2px' }}>{title}</span>
    </div>
  )
}
