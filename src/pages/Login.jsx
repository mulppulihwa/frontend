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
            borderRadius: 32,
            background: '#fff',
            border: '1.5px solid #e8e8e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: '#777', textAlign: 'center', lineHeight: 1.45, letterSpacing: '-0.1px' }}>
              서비스 이름<br />로고
            </p>
          </div>
          <p style={{ fontSize: 30, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.6px', marginTop: 22 }}>귀농OK</p>
          <p style={{ fontSize: 16, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px', lineHeight: 1.5, marginTop: 12, textAlign: 'center' }}>
            내 조건에 맞는 농업 지원금을<br />간편하게 찾아보세요
          </p>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 80 }}>
        <button
          onClick={() => navigate('/step1')}
          style={{
            width: '100%',
            minHeight: 58,
            padding: '16px 20px',
            borderRadius: 18,
            border: 'none',
            background: '#FEE500',
            color: '#1a1a1a',
            fontSize: 18,
            fontWeight: 500,
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
