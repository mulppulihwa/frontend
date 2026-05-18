import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import TopBar from '../components/TopBar'

const steps = ['조건 확인', '지원금 매칭', '결과 정리']

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
    <div
      className="loading-wave-page"
      style={{ '--fill': `${progress}%` }}
    >
      <div className="loading-wave-fill" aria-hidden="true">
        <div className="loading-wave-surface loading-wave-surface-one" />
        <div className="loading-wave-surface loading-wave-surface-two" />
      </div>

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
        <div style={{ textAlign: 'center' }}>
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

        <div style={{ width: '100%', marginTop: 28 }}>
          <div style={{
            width: '100%',
            height: 8,
            borderRadius: 999,
            background: '#ece9e2',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 999,
              background: '#2d6a2d',
              transition: 'width 0.12s ease',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 400, color: '#777', letterSpacing: '-0.1px' }}>
              분석 진행률
            </span>
            <span style={{ fontSize: 15, fontWeight: 500, color: '#2d6a2d', letterSpacing: '-0.2px' }}>{progress}%</span>
          </div>
        </div>

        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 18 }}>
          {steps.map((step, index) => {
            const complete = progress >= (index + 1) * 30
            return (
              <div
                key={step}
                style={{
                  minHeight: 44,
                  borderRadius: 14,
                  border: '1.5px solid #e8e8e8',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  color: complete ? '#2d6a2d' : '#777',
                  fontSize: 13,
                  fontWeight: 400,
                  letterSpacing: '-0.1px',
                }}
              >
                {complete && <Check size={14} strokeWidth={2.5} />}
                {step}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
