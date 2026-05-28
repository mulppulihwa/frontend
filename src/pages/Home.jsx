import { useEffect, useState } from 'react'
import { ArrowRight, Banknote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import kakaoLogo from '../assets/kkt_logo.png'
import farmer from '../assets/farmer.png'
import okcheonTypo from '../assets/okcheon_typo.png'
import okTypo from '../assets/ok_typo.png'
import Button from '../components/Button'
import Folder from '../components/Folder'
import { fetchPreviewPolicies, getAccessToken } from '../lib/api'
import { startKakaoLogin } from '../lib/auth'

const fallbackPolicies = [
  {
    title: '신규농업인 영농 기초기술교육 (충청북도)',
    agency: '충청북도 농업기술원 지원기획과 (043-220-5613)',
    subtitle: '교육비 무료 (연 40시간)',
    reasons: ['귀농귀촌인·영농 희망자에게 기초농업기술, 농업정보, 농기계 활용 교육을 제공합니다.'],
  },
  {
    title: '귀농귀촌인 지역주민 융화교육 지원',
    agency: '충청북도 농업정책과 (043-220-3532)',
    subtitle: '교육 및 교류 프로그램 지원',
    reasons: ['귀농귀촌인과 지역주민의 안정적인 공동체 적응을 돕습니다.'],
  },
  {
    title: '충북에서 살아보기',
    agency: '충청북도 농업정책과 (043-220-3533)',
    subtitle: '연수비 및 거주시설 프로그램 제공',
    reasons: ['농촌 생활을 미리 체험하고 지역 정착 가능성을 확인할 수 있습니다.'],
  },
]

function PolicyPaperCard({ policy }) {
  const title = policy.title || policy.name || '지원 정책'
  const agency = policy.agency || policy.organization || policy.managing_org || '담당 기관 확인'
  const benefit = policy.subtitle || policy.amount || policy.period || '지원 내용 확인'
  const reason = policy.reasons?.[0] || policy.summary || policy.description || '조건에 맞는 지원 사유를 확인할 수 있어요.'

  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '5px 5px 4px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: '#1a1a1a',
      background: '#fff',
      borderRadius: 9,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 5.9, fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.08px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {title}
          </p>
          <p style={{ fontSize: 3.8, fontWeight: 500, color: '#424242', lineHeight: 1.18, marginTop: 2, letterSpacing: '-0.03px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {agency}
          </p>
        </div>
        <span style={{
          flexShrink: 0,
          padding: '3px 4px',
          borderRadius: 999,
          background: '#dff4e5',
          color: '#076818',
          fontSize: 3.6,
          fontWeight: 900,
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}>
          신청 기간
        </span>
      </div>

      <div style={{ height: 1, background: '#eeeeee', margin: '4px 0 3px', flexShrink: 0 }} />

      <p style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#076818', fontSize: 4.4, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <Banknote size={5.5} strokeWidth={2.2} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{benefit}</span>
      </p>

      <div style={{ marginTop: 3, padding: '4px 5px', borderRadius: 8, background: '#f8f8f8', minHeight: 0, flex: 1, overflow: 'hidden' }}>
        <p style={{ fontSize: 3.9, fontWeight: 800, color: '#9a9a9a', lineHeight: 1, marginBottom: 2 }}>
          해당 이유
        </p>
        <p style={{ display: 'flex', gap: 2.5, fontSize: 4.1, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.2, letterSpacing: '-0.04px' }}>
          <span style={{ color: '#076818', lineHeight: 1.05 }}>•</span>
          <span style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {reason}
          </span>
        </p>
      </div>
    </div>
  )
}

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
      <style>{`
        @keyframes spinRock {
          0%   { transform: rotate(0deg); }
          50%  { transform: rotate(-90deg); }
          100% { transform: rotate(0deg); }
        }
        .logo-spin {
          animation: spinRock 2s ease-in-out infinite;
          transform-origin: center center;
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <img src={okcheonTypo} alt="옥천" style={{ height: 48, width: 'auto' }} />
        <img src={okTypo} alt="OK" className="logo-spin" style={{ height: 48, width: 'auto' }} />
      </div>

      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Folder
          size={2.5}
          color="#FFA100"
          frontContent={
            <img src={farmer} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center' }} />
          }
          items={policies.map(policy => (
            <div key={policy.id || policy.title} onClick={e => { e.stopPropagation(); navigate('/detail', { state: { grant: policy } }) }} style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}>
              <PolicyPaperCard policy={policy} />
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
