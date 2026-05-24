import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import kakaoLogo from '../assets/kkt_logo.png'
import okcheonLogo from '../assets/okcheon-ok-green.png'
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
      startKakaoLogin('/step1')
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
      padding: '74px 24px 44px',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 54,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
	          <div style={{
	            width: 112,
	            height: 112,
	            display: 'flex',
	            alignItems: 'center',
	            justifyContent: 'center',
	          }}>
            <img src={okcheonLogo} alt="옥천OK" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <p style={{ fontSize: 30, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.6px', marginTop: 22 }}>옥천OK</p>
          <p style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px', lineHeight: 1.5, marginTop: 12, textAlign: 'center' }}>
            내 조건에 맞는 농업 지원금을<br />간편하게 찾아보세요
          </p>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 80 }}>
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
            minHeight: 58,
            padding: '16px 20px',
            borderRadius: 18,
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

        <button
          onClick={() => navigate('/home')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 14,
            fontWeight: 400,
            color: '#1a1a1a',
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '-0.2px',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          로그인 없이 바로 시작하기
        </button>
      </div>
    </div>
  )
}
