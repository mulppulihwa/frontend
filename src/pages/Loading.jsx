import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'

export default function Loading() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/results'), 3300)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="loading-wave-page">
      <div style={{ position: 'relative', zIndex: 2 }}>
        <TopBar title="정보 입력" />
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 28px 58px',
        position: 'relative',
        zIndex: 2,
      }}>
        <div className="loading-spinner" aria-label="지원금 분석 중" />

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.45 }}>
            받을 수 있는 지원금을
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.45 }}>
            찾고 있어요
          </p>
          <p style={{ fontSize: 14, fontWeight: 400, color: '#666', marginTop: 10, letterSpacing: '-0.1px' }}>
            입력하신 조건을 기준으로 분석 중
          </p>
        </div>
      </div>
    </div>
  )
}
