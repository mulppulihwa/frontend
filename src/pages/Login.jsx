import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import kakaoLogo from '../assets/kkt_logo.png'
import farmer from '../assets/farmer-optimized.png'
import okcheonTypo from '../assets/okcheon_typo.png'
import okTypo from '../assets/ok_typo.png'
import { completeKakaoLogin, consumeLoginRedirect, startKakaoLogin } from '../lib/auth'
import { fetchProfile } from '../lib/api'

function readProfileCompleted(payload) {
  const value = payload?.profile_completed
    ?? payload?.profileCompleted
    ?? payload?.user?.profile_completed
    ?? payload?.user?.profileCompleted
  return typeof value === 'boolean' ? value : null
}

async function getPostLoginPath(payload) {
  const completedFromLogin = readProfileCompleted(payload)
  const redirectTo = consumeLoginRedirect('/home')
  if (completedFromLogin === false) return '/step1'
  if (completedFromLogin === true) return redirectTo

  try {
    const profile = await fetchProfile()
    return readProfileCompleted(profile) === false ? '/step1' : redirectTo
  } catch {
    return redirectTo
  }
}

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
          const nextPath = await getPostLoginPath(result.payload)
          navigate(nextPath, { replace: true, state: nextPath === '/step1' ? { firstDiagnosis: true } : undefined })
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
    <div className="login-page">
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
        .login-page {
          width: 100%;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: max(28px, env(safe-area-inset-top)) 24px max(28px, env(safe-area-inset-bottom));
          background: #fdfcf8;
        }
        .login-content {
          width: 100%;
          max-width: 382px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(22px, 3.5dvh, 34px);
        }
        .login-character {
          width: auto;
          height: clamp(220px, 36dvh, 330px);
          max-width: 82%;
          object-fit: contain;
          filter: drop-shadow(0 10px 16px rgba(30, 50, 25, 0.10));
        }
        @media (max-height: 700px) {
          .login-page {
            padding-top: max(18px, env(safe-area-inset-top));
            padding-bottom: max(18px, env(safe-area-inset-bottom));
          }
          .login-content {
            gap: 16px;
          }
          .login-character {
            height: clamp(170px, 31dvh, 220px);
          }
        }
      `}</style>

      <main className="login-content">
        {/* Top: logo + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <img src={okcheonTypo} alt="옥천" style={{ height: 'clamp(48px, 7vh, 66px)', width: 'auto' }} />
            <img src={okTypo} alt="OK" className="logo-spin-login" style={{ height: 'clamp(48px, 7vh, 66px)', width: 'auto' }} />
          </div>
          <p style={{ fontSize: 'clamp(13px, 1.8vh, 15px)', fontWeight: 500, color: '#111', lineHeight: 1.35, margin: 0, textAlign: 'center' }}>
            숨은 귀농 혜택, 옥천옥이 알아서 챙겨드릴게요!
          </p>
        </div>

        {/* Middle: character */}
        <img
          src={farmer}
          alt=""
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="login-character"
        />

        {/* Bottom: description + button */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(14px, 2.2vh, 20px)', flexShrink: 0 }}>
          <p style={{ fontSize: 'clamp(13px, 1.8vh, 15px)', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.55, margin: 0, textAlign: 'center' }}>
            내게 꼭 맞는 정책 진단부터<br />
            복잡한 지원금 신청 준비, 알뜰한 사용처 안내까지<br />
            <span style={{ color: '#076818', fontWeight: 800 }}>옥천옥</span>이 든든하게 책임집니다!
          </p>

          {error && (
            <p role="alert" style={{ fontSize: 13, color: '#d93025', lineHeight: 1.5, textAlign: 'center', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            className="app-action-button"
            onClick={handleKakaoLogin}
            disabled={isLoggingIn}
            style={{
              width: 'min(72%, 280px)',
              minWidth: 240,
              minHeight: 48,
              padding: '10px 18px',
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
      </main>
    </div>
  )
}
