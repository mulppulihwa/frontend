import { useNavigate } from 'react-router-dom'
import kakaoLogo from '../assets/kkt_logo.png'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#FDFCF8',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '120px 24px 48px',
    }}>
      {/* Logo + name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: '#d4d4d4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <p style={{ fontSize: 13, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.5 }}>
            서비스 이름 정해지면<br />로고 삽입
          </p>
        </div>
        <p style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>서비스 이름</p>
      </div>

      {/* Buttons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate('/step1')}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: 18,
            border: 'none',
            background: '#FEE500',
            color: '#1a1a1a',
            fontSize: 20,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '-0.2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <img src={kakaoLogo} alt="카카오" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          카카오 간편 로그인
        </button>

        <button
          onClick={() => navigate('/step1')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 16,
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
