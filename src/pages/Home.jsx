import { useEffect, useState } from 'react'
import okcheonTypo from '../assets/okcheon_typo.png'
import okTypo from '../assets/ok_typo.png'
import { fetchSavedPolicies } from '../lib/api'

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
  const [statusCounts, setStatusCounts] = useState({
    completed: 0,
    planned: 0,
    ignored: 0,
    unset: 0,
  })

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

      <div style={{ flex: 1 }} />

      <HomeStatusSummary counts={statusCounts} />

    </div>
  )
}
