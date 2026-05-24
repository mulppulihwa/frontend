import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import kakaoLogo from '../assets/kkt_logo.png'
import farmer from '../assets/farmer.png'
import okcheonLogo from '../assets/okcheon-ok-green.png'
import Button from '../components/Button'
import Folder from '../components/Folder'
import { fetchPreviewPolicies, getAccessToken } from '../lib/api'
import { startKakaoLogin } from '../lib/auth'

const fallbackPolicies = [
  { title: '귀농 농업창업 지원금' },
  { title: '농촌 정착 지원금' },
  { title: '농기계 구입 지원' },
]

export default function Home() {
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [policies, setPolicies] = useState(fallbackPolicies)

  const handleKakaoLogin = () => {
    startKakaoLogin('/step1')
  }

  const handleStartDiagnosis = () => {
    if (getAccessToken()) {
      navigate('/step1')
      return
    }
    setShowLogin(true)
  }

  useEffect(() => {
    let active = true
    fetchPreviewPolicies()
      .then(data => {
        if (active && data.length > 0) setPolicies(data.slice(0, 3))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

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
        <img src={okcheonLogo} alt="옥천OK" style={{ width: 200, height: 'auto', display: 'block', margin: '0 auto' }} />
      </div>

      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Folder
          size={2.5}
          color="#FFA100"
          frontContent={
            <img src={farmer} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center' }} />
          }
          items={policies.map(policy => (
            <div key={policy.id || policy.title} onClick={e => { e.stopPropagation(); navigate('/detail', { state: { grant: policy } }) }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 7.5, fontWeight: 700, color: '#FFA100', textAlign: 'center', lineHeight: 1.3, letterSpacing: '-0.1px' }}>{policy.title.replaceAll(' ', '\n')}</span>
            </div>
          ))}
        />
      </div>

      <Button onClick={handleStartDiagnosis} variant="pill" style={{ background: '#076818' }}>
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
              onClick={handleKakaoLogin}
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
