import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import kakaoLogo from '../assets/kkt_logo.png'
import farmer from '../assets/farmer.png'
import okcheonTypo from '../assets/okcheon_typo.png'
import okTypo from '../assets/ok_typo.png'
import { completeKakaoLogin, consumeLoginRedirect, startKakaoLogin } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function completeLogin() {
      try {
        setIsLoggingIn(true)
        const result = await completeKakaoLogin()
        if (!active) return
        if (result.completed) {
          window.history.replaceState({}, '', window.location.pathname)
          navigate(consumeLoginRedirect('/home'), { replace: true })
        }
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setIsLoggingIn(false)
      }
    }

    if (new URLSearchParams(window.location.search).has('code')) {
      completeLogin()
    }

    return () => {
      active = false
    }
  }, [navigate])

  const handleKakaoLogin = () => {
    try {
      setError('')
      startKakaoLogin('/home')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#FDFCF8',
      padding: '38px 24px 30px',
      boxSizing: 'border-box',
      overflowX: 'hidden',
    }}>
      <style>{`
        @keyframes spinRock {
          0%   { transform: rotate(0deg); }
          28%  { transform: rotate(-90deg); }
          58%  { transform: rotate(-90deg); }
          78%  { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }

        .logo-spin-login {
          animation: spinRock 2.8s ease-in-out infinite;
          transform-origin: center center;
        }
      `}</style>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 24,
        paddingBottom: 18,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <img src={okcheonTypo} alt="옥천" style={{ height: 66, width: 'auto' }} />
            <img src={okTypo} alt="OK" className="logo-spin-login" style={{ height: 66, width: 'auto' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#111', lineHeight: 1.35, margin: 0, textAlign: 'center' }}>
            숨은 귀농 혜택, 옥천옥이 알아서 챙겨드릴게요!
          </p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: 390, height: 'clamp(240px, 36vh, 320px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginTop: 36 }}>
          <img
            src={farmer}
            alt=""
            style={{
              position: 'relative',
              zIndex: 4,
              width: 'auto',
              height: '33vh',
              maxHeight: 300,
              minHeight: 220,
              objectFit: 'contain',
              filter: 'drop-shadow(0 10px 16px rgba(30, 50, 25, 0.10))',
            }}
          />
        </div>

        <div style={{ width: '100%', maxWidth: 350, border: '1.5px solid #dbead5', borderRadius: 16, padding: '12px 14px', textAlign: 'center', background: '#FDFCF8' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.55, margin: 0 }}>
            내게 꼭 맞는 정책 진단부터<br />
            복잡한 지원금 신청 준비, 알뜰한 사용처 안내까지<br />
            <span style={{ color: '#076818', fontWeight: 800 }}>옥천옥</span>이 든든하게 책임집니다!
          </p>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {error && (
          <p role="alert" style={{ fontSize: 13, color: '#d93025', lineHeight: 1.5, textAlign: 'center', marginBottom: 2 }}>
            {error}
          </p>
        )}
        <button
          onClick={handleKakaoLogin}
          disabled={isLoggingIn}
          style={{
            width: '100%',
            maxWidth: 350,
            minHeight: 58,
            padding: '16px 20px',
            borderRadius: 999,
            border: 'none',
            background: '#FEE500',
            color: '#1a1a1a',
            fontSize: 16,
            fontWeight: 500,
            cursor: isLoggingIn ? 'default' : 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '-0.2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: isLoggingIn ? 0.72 : 1,
          }}
        >
          <img src={kakaoLogo} alt="카카오" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          {isLoggingIn ? '로그인 중...' : '카카오 간편 로그인'}
        </button>
      </div>
    </div>
  )
}
