import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'

const filters = [
  { key: '전체', label: '전체' },
  { key: '신청예정', label: '신청 예정' },
  { key: '신청완료', label: '신청 완료' },
  { key: '관심없음', label: '관심 없음' },
]

const grants = [
  { id: 1, title: '귀농 농업창업 지원금', subtitle: '최대 300만원', status: '신청예정', days: 19, hours: 5, minutes: 5 },
  { id: 2, title: '농촌 정착 지원금', subtitle: '최대 500만원', status: '신청예정', days: 64, hours: 2, minutes: 30 },
  { id: 3, title: '귀농인 농기계 구입지원', subtitle: '구입 비용 50% 지원', status: '신청예정', days: 198, hours: 8, minutes: 0 },
  { id: 4, title: '귀농 농업창업 지원금', subtitle: '최대 300만원', status: '신청완료', days: 19, hours: 5, minutes: 5 },
  { id: 5, title: '농촌 정착 지원금', subtitle: '최대 500만원', status: '신청완료', days: 64, hours: 2, minutes: 30 },
]

const statusConfig = {
  신청예정: { label: '신청 예정', color: '#e07b00', bg: '#fff3e0', border: '#e8e8e8' },
  신청완료: { label: '신청 완료', color: '#2d6a2d', bg: '#e8f3e8', border: '#e8e8e8' },
}

function GrantCard({ grant, navigate }) {
  const cfg = statusConfig[grant.status]
  const isCompleted = grant.status === '신청완료'

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${cfg.border}`,
      borderRadius: 20,
      padding: '14px 14px 12px',
      display: 'flex',
      gap: 12,
    }}>
      {/* Left: info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>{grant.title}</p>
        <p style={{ fontSize: 15, color: '#888', letterSpacing: '-0.1px' }}>{grant.subtitle}</p>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: cfg.bg, borderRadius: 10,
          padding: '5px 12px', alignSelf: 'flex-start', marginTop: 2,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color, letterSpacing: '-0.1px' }}>{cfg.label}</span>
        </div>
      </div>

      {/* Right: buttons + countdown */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => navigate('/detail')}
            style={{
              padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e8e8e8',
              background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 15, fontWeight: 500, color: '#444', letterSpacing: '-0.1px', whiteSpace: 'nowrap',
            }}
          >
            자세히 보기
          </button>
          <button
            onClick={() => isCompleted ? navigate('/map') : null}
            style={{
              padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e8e8e8',
              background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 15, fontWeight: 500, color: '#444', letterSpacing: '-0.1px', whiteSpace: 'nowrap',
            }}
          >
            {isCompleted ? '사용처 보기' : '알림 받기'}
          </button>
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#d93025', letterSpacing: '-0.1px', textAlign: 'right' }}>
          {isCompleted ? '지원금 지급일까지' : '마감까지'} D- {grant.days}일 {grant.hours}시간 {grant.minutes}분
        </p>
      </div>
    </div>
  )
}

function StatusSection({ title, grants, navigate }) {
  const cfg = statusConfig[title]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 2 }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: cfg.color, letterSpacing: '-0.2px' }}>{cfg.label}</p>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: '#888' }}>편집</button>
      </div>
      {grants.map(g => <GrantCard key={g.id} grant={g} navigate={navigate} />)}
    </div>
  )
}

export default function GrantStatus() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('전체')

  const isAll = activeFilter === '전체'
  const filtered = isAll ? [...grants].sort((a, b) => a.days - b.days) : grants.filter(g => g.status === activeFilter)
  const grouped = !isAll && filtered.reduce((acc, g) => {
    if (!acc[g.status]) acc[g.status] = []
    acc[g.status].push(g)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>
      <TopBar title="지원 현황" onBack={() => navigate('/mypage')} />

      <div style={{ padding: '12px 18px 100px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', lineHeight: 1.55, padding: '4px 0 0' }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
            ○○○님의 <span style={{ color: '#2d6a2d' }}>지원 현황</span>은
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
            다음과 같아요
          </p>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {filters.map(f => {
            const active = activeFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  padding: '8px 16px', borderRadius: 20,
                  border: `1.5px solid ${active ? '#2d6a2d' : '#e8e8e8'}`,
                  background: active ? '#2d6a2d' : '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  color: active ? '#fff' : '#666',
                  letterSpacing: '-0.1px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {isAll ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(g => <GrantCard key={g.id} grant={g} navigate={navigate} />)}
          </div>
        ) : (
          ['신청예정', '신청완료'].map(status =>
            grouped[status]?.length ? (
              <StatusSection key={status} title={status} grants={grouped[status]} navigate={navigate} />
            ) : null
          )
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: 15 }}>
            해당하는 지원금이 없어요
          </div>
        )}

      </div>
    </div>
  )
}
