import { useEffect, useState } from 'react'
import { Banknote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import okcheonTypo from '../assets/okcheon_typo.png'
import okTypo from '../assets/ok_typo.png'
import okcheonCharacter from '../assets/farmer.png'
import Folder from '../components/Folder'
import { fetchPreviewPolicies, fetchSavedPolicies } from '../lib/api'

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
          <p style={{ fontSize: 5.9, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.08px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
          fontWeight: 700,
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}>
          신청 기간
        </span>
      </div>

      <div style={{ height: 1, background: '#eeeeee', margin: '4px 0 3px', flexShrink: 0 }} />

      <p style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#076818', fontSize: 4.4, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.04px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <Banknote size={5.5} strokeWidth={1.9} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{benefit}</span>
      </p>

      <div style={{ marginTop: 3, padding: '4px 5px', borderRadius: 8, background: '#f8f8f8', minHeight: 0, flex: 1, overflow: 'hidden' }}>
        <p style={{ fontSize: 3.9, fontWeight: 600, color: '#9a9a9a', lineHeight: 1, marginBottom: 2 }}>
          해당 이유
        </p>
        <p style={{ display: 'flex', gap: 2.5, fontSize: 4.1, fontWeight: 400, color: '#1a1a1a', lineHeight: 1.2, letterSpacing: '-0.04px' }}>
          <span style={{ color: '#076818', lineHeight: 1.05 }}>•</span>
          <span style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {reason}
          </span>
        </p>
      </div>
    </div>
  )
}

function HomeStatusSummary({ counts }) {
  const total = counts.completed + counts.planned + counts.ignored + counts.unset
  const tiles = [
    { key: 'completed', label: '완료',    value: counts.completed, color: '#076818', bg: '#e8f3e8' },
    { key: 'planned',   label: '예정',    value: counts.planned,   color: '#FFA100', bg: '#fff3e0' },
    { key: 'ignored',   label: '관심 없음', value: counts.ignored, color: '#d93025', bg: '#fff0ef' },
  ]

  return (
    <div style={{ width: '100%', display: 'flex', gap: 8 }}>
      {/* 진단 받은 정책 */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        flex: '0 0 auto',
        width: '38%',
        borderRadius: 20,
        background: 'linear-gradient(135deg, #e8f3e8 0%, #fff7e8 100%)',
        border: '1px solid rgba(218,231,211,0.9)',
        padding: '10px 10px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        <div style={{
          position: 'absolute', right: 8, top: 8,
          display: 'flex', alignItems: 'flex-end', gap: 2.5, opacity: 0.28,
        }}>
          {[13, 19, 15, 24, 31].map((h, i) => (
            <span key={h} style={{
              display: 'block', width: 4, height: h, borderRadius: 999,
              background: i === 4 ? '#FFA100' : '#076818',
            }} />
          ))}
        </div>
        <p style={{ fontSize: 9, fontWeight: 600, color: '#5a7a5e', marginBottom: 4, lineHeight: 1 }}>진단 받은 정책</p>
        <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2433', lineHeight: 1 }}>{total}<span style={{ fontSize: 14 }}>건</span></p>
      </div>

      {/* Stat tiles */}
      {tiles.map(({ key, label, value, color, bg }) => (
        <div key={key} style={{
          flex: 1,
          borderRadius: 20,
          background: '#FFFFFF',
          border: '1px solid rgba(218,231,211,0.9)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '10px 4px',
          boxSizing: 'border-box',
        }}>
          <span style={{ width: 18, height: 3, borderRadius: 999, background: bg, marginBottom: 8 }} />
          <strong style={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color }}>{value}</strong>
          <span style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: '#777', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState(fallbackPolicies)
  const [statusCounts, setStatusCounts] = useState({
    completed: 0,
    planned: 0,
    ignored: 0,
    unset: 0,
  })

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

  useEffect(() => {
    let active = true
    fetchSavedPolicies()
      .then(savedPolicies => {
        if (!active) return
        setStatusCounts({
          completed: savedPolicies.filter(policy => policy.user_status === '신청완료').length,
          planned: savedPolicies.filter(policy => policy.user_status === '신청예정').length,
          ignored: savedPolicies.filter(policy => policy.user_status === '관심없음').length,
          unset: savedPolicies.filter(policy => !policy.user_status).length,
        })
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
          28%  { transform: rotate(90deg); }
          58%  { transform: rotate(90deg); }
          78%  { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .logo-spin {
          animation: spinRock 2.8s ease-in-out infinite;
          transform-origin: center center;
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <img src={okcheonTypo} alt="옥천" style={{ height: 48, width: 'auto' }} />
        <img src={okTypo} alt="OK" className="logo-spin" style={{ height: 48, width: 'auto' }} />
      </div>

      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 0,
      }}>
        <Folder
          size={2.5}
          color="#FFA100"
          frontContent={
            <img
              src={okcheonCharacter}
              alt=""
              style={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
                objectPosition: 'center center',
              }}
            />
          }
          items={policies.map(policy => (
            <div key={policy.id || policy.title} onClick={e => { e.stopPropagation(); navigate('/detail', { state: { grant: policy } }) }} style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}>
              <PolicyPaperCard policy={policy} />
            </div>
          ))}
        />
      </div>

      <HomeStatusSummary counts={statusCounts} />

    </div>
  )
}
