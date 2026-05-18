import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import TopBar from '../components/TopBar'
import Button from '../components/Button'

const options = [14, 10, 7, 5, 3, 1]

export default function Alarm() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const grant = state?.grant ?? { title: '귀농 농업창업 지원금', days: 19, hours: 5, minutes: 5 }

  const [selected, setSelected] = useState([])
  const [toastVisible, setToastVisible] = useState(false)
  const toastTimer = useRef(null)

  const toggle = (val) => {
    setSelected(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    )
  }

  const handleSubmit = () => {
    setToastVisible(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => {
      setToastVisible(false)
      navigate(-1)
    }, 1800)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>
      <TopBar title="알림 받기" onBack={() => navigate(-1)} />

      <div style={{ padding: '20px 24px 140px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div style={{ lineHeight: 1.55 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
            {grant.title} 마감까지
          </p>
          <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
            <span style={{ color: '#d93025' }}>D- {grant.days}일 {grant.hours}시간 {grant.minutes}분</span>
            {' '}남았어요!
          </p>
        </div>

        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', marginBottom: 6 }}>
            잊지 않게 알림을 보내드릴게요
          </p>
          <p style={{ fontSize: 13, color: '#bbb', letterSpacing: '-0.1px' }}>
            알림을 원하시는 시간대를 모두 체크해주세요
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {options.map(n => {
            const checked = selected.includes(n)
            return (
              <button
                key={n}
                onClick={() => toggle(n)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: `1.5px solid ${checked ? '#2d6a2d' : '#e8e8e8'}`,
                  background: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: `2px solid ${checked ? '#2d6a2d' : '#ccc'}`,
                  background: checked ? '#2d6a2d' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s ease',
                }}>
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.2px' }}>
                  {n}일전
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{
        position: 'fixed', bottom: 76,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        padding: '12px 18px 0',
        background: 'linear-gradient(to top, #FDFCF8 75%, transparent)',
      }}>
        <Button
          disabled={selected.length === 0}
          style={{ opacity: selected.length === 0 ? 0.4 : 1 }}
          onClick={handleSubmit}
        >
          알림 받기
        </Button>
      </div>

      {toastVisible && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            background: '#fff', borderRadius: 24, padding: '28px 36px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            animation: 'fadeInScale 0.2s ease',
          }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8f3e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={26} color="#2d6a2d" strokeWidth={2.5} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#2d6a2d', letterSpacing: '-0.2px', marginBottom: 6 }}>
                {[...selected].sort((a, b) => b - a).map(n => `${n}일전`).join(', ')}
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.2px' }}>알림 설정을 해두었어요!</p>
            </div>
          </div>
          <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
      )}
    </div>
  )
}
