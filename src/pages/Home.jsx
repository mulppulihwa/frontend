import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import kakaoLogo from '../assets/kkt_logo.png'
import Button from '../components/Button'
import Folder from '../components/Folder'

export default function Home() {
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)

  const buttons = [
    { label: '진단하기', onClick: () => setShowLogin(true), bg: '#FFA100', color: '#fff' },
    { label: '지원 현황', onClick: () => navigate('/grant-status'), bg: '#FFA100', color: '#fff' },
    { label: '사용처', onClick: () => navigate('/map'), bg: '#f5ede0', color: '#FFA100' },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100vh',
      background: '#FDFCF8',
      padding: '60px 28px 120px',
      boxSizing: 'border-box',
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: 34,
          fontWeight: 800,
          color: '#076818',
          letterSpacing: '-0.8px',
          lineHeight: 1.25,
        }}>
          귀농OK
        </p>
        <p style={{
          fontSize: 17,
          fontWeight: 500,
          color: '#666',
          letterSpacing: '-0.2px',
          lineHeight: 1.4,
          marginTop: 6,
        }}>
          내 손안에 옥천 가이드
        </p>
      </div>

      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Folder
          size={2.5}
          color="#FFA100"
          items={[
            <div onClick={e => { e.stopPropagation(); navigate('/detail') }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 7.5, fontWeight: 700, color: '#FFA100', textAlign: 'center', lineHeight: 1.3, letterSpacing: '-0.1px' }}>귀농{'\n'}농업창업{'\n'}지원금</span>
            </div>,
            <div onClick={e => { e.stopPropagation(); navigate('/detail') }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 7.5, fontWeight: 700, color: '#FFA100', textAlign: 'center', lineHeight: 1.3, letterSpacing: '-0.1px' }}>농촌{'\n'}정착{'\n'}지원금</span>
            </div>,
            <div onClick={e => { e.stopPropagation(); navigate('/detail') }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 7.5, fontWeight: 700, color: '#FFA100', textAlign: 'center', lineHeight: 1.3, letterSpacing: '-0.1px' }}>농기계{'\n'}구입{'\n'}지원</span>
            </div>,
          ]}
        />
      </div>

      <Button onClick={() => setShowLogin(true)} variant="pill" style={{ background: '#076818' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          진단하기 시작 <ArrowRight size={16} strokeWidth={2.5} />
        </span>
      </Button>

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
                fontSize: 16,
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
