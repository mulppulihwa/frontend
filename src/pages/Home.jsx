import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import kakaoLogo from '../assets/kkt_logo.png'

export default function Home() {
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)

  const buttons = [
    { label: '진단하기', onClick: () => setShowLogin(true), bg: '#e07b00', color: '#fff' },
    { label: '지원 현황', onClick: () => navigate('/grant-status'), bg: '#e07b00', color: '#fff' },
    { label: '사용처', onClick: () => navigate('/map'), bg: '#f5ede0', color: '#e07b00' },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#FDFCF8',
      padding: '60px 28px 120px',
      boxSizing: 'border-box',
    }}>
      <p style={{
        fontSize: 34,
        fontWeight: 800,
        color: '#2d6a2d',
        letterSpacing: '-0.8px',
        lineHeight: 1.25,
      }}>
        내 손안에<br />옥천 가이드
      </p>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 10 }}>
        {buttons.map(({ label, onClick, bg, color }) => (
          <button
            key={label}
            onClick={onClick}
            style={{
              flex: 1,
              padding: '16px 0',
              borderRadius: 50,
              border: 'none',
              background: bg,
              color,
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'inherit',
              letterSpacing: '-0.2px',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Login modal */}
      {showLogin && (
        <div
          onClick={() => setShowLogin(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 28px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#fff',
              borderRadius: 24,
              padding: '32px 24px 28px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
              animation: 'fadeInScale 0.2s ease',
            }}
          >
            <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
              로그인 필요합니다
            </p>
            <button
              onClick={() => { setShowLogin(false); navigate('/step1') }}
              style={{
                width: '100%',
                minHeight: 54,
                padding: '14px 20px',
                borderRadius: 16,
                border: 'none',
                background: '#FEE500',
                color: '#1a1a1a',
                fontSize: 17,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '-0.2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <img src={kakaoLogo} alt="카카오" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              카카오 로그인
            </button>
          </div>
          <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
      )}
    </div>
  )
}
