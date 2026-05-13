import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'

export default function Loading() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setTimeout(() => navigate('/results'), 300)
          return 100
        }
        return p + 2
      })
    }, 60)
    return () => clearInterval(interval)
  }, [navigate])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 10% 10%, #f5a94e 0%, #FDFCF8 42%, #FDFCF8 58%, #5a9a5a 100%)',
    }}>
      <TopBar title="정보 입력" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: '5px solid #e8e8e8',
          borderTopColor: '#2d6a2d',
          animation: 'spin 0.9s linear infinite',
        }} />
        <p style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>분석 중......</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: '#2d6a2d', letterSpacing: '-0.5px' }}>{progress}%</p>
      </div>
    </div>
  )
}
