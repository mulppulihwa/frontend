import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import TopBar from '../components/TopBar'
import StatusCheckboxes from '../components/StatusCheckboxes'

const filters = [
  { key: '전체', label: '전체' },
  { key: '신청예정', label: '신청 예정' },
  { key: '신청완료', label: '신청 완료' },
  { key: '관심없음', label: '관심 없음' },
]

const grantsData = [
  { id: 1, title: '귀농 농업창업 지원금', subtitle: '최대 300만원', days: 19, hours: 5, minutes: 5 },
  { id: 2, title: '농촌 정착 지원금', subtitle: '최대 500만원', days: 64, hours: 2, minutes: 30 },
  { id: 3, title: '귀농인 농기계 구입지원', subtitle: '구입 비용 50% 지원', days: 198, hours: 8, minutes: 0 },
  { id: 4, title: '귀농 농업창업 지원금', subtitle: '최대 300만원', days: 19, hours: 5, minutes: 5 },
  { id: 5, title: '농촌 정착 지원금', subtitle: '최대 500만원', days: 64, hours: 2, minutes: 30 },
]

const initialStatuses = { 1: '신청예정', 2: '신청예정', 3: '신청예정', 4: '신청완료', 5: '신청완료' }

const statusConfig = {
  신청예정: { label: '신청 예정', color: '#e07b00', bg: '#fff3e0' },
  신청완료: { label: '신청 완료', color: '#2d6a2d', bg: '#e8f3e8' },
  관심없음: { label: '관심 없음', color: '#d93025', bg: '#fff0ef' },
}

function GrantCard({ grant, status, onStatusChange, navigate }) {
  const cfg = statusConfig[status]
  const isCompleted = status === '신청완료'

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ padding: '14px 14px 12px', display: 'flex', gap: 12 }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>{grant.title}</p>
          <p style={{ fontSize: 15, color: '#888', letterSpacing: '-0.1px' }}>{grant.subtitle}</p>
          {cfg && (
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: cfg.bg, borderRadius: 10,
              padding: '5px 12px', alignSelf: 'flex-start', marginTop: 2,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color, letterSpacing: '-0.1px' }}>{cfg.label}</span>
            </div>
          )}
        </div>
        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => navigate('/detail')}
              style={{ padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, color: '#444', letterSpacing: '-0.1px', whiteSpace: 'nowrap' }}
            >
              자세히 보기
            </button>
            <button
              onClick={() => isCompleted ? navigate('/map') : navigate('/alarm', { state: { grant } })}
              style={{ padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, color: '#444', letterSpacing: '-0.1px', whiteSpace: 'nowrap' }}
            >
              {isCompleted ? '사용처 보기' : '알림 받기'}
            </button>
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#d93025', letterSpacing: '-0.1px', textAlign: 'right' }}>
            {isCompleted ? '지원금 지급일까지' : '마감까지'} D- {grant.days}일 {grant.hours}시간 {grant.minutes}분
          </p>
        </div>
      </div>

      <div style={{ borderTop: '1.5px solid #f0f0f0', padding: '12px 14px' }}>
        <StatusCheckboxes value={status} onChange={onStatusChange} />
      </div>
    </div>
  )
}

function StatusSection({ title, grants, statuses, onStatusChange, navigate }) {
  const cfg = statusConfig[title]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ paddingLeft: 2 }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: cfg.color, letterSpacing: '-0.2px' }}>{cfg.label}</p>
      </div>
      {grants.map(g => (
        <GrantCard
          key={g.id}
          grant={g}
          status={statuses[g.id]}
          onStatusChange={val => onStatusChange(g.id, val)}
          navigate={navigate}
        />
      ))}
    </div>
  )
}

function Toast({ visible }) {
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        background: '#fff',
        borderRadius: 24,
        padding: '28px 36px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        animation: 'fadeInScale 0.2s ease',
      }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8f3e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={26} color="#2d6a2d" strokeWidth={2.5} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.2px' }}>지원현황이 수정되었습니다</p>
      </div>
      <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  )
}

export default function GrantStatus() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('전체')
  const [statuses, setStatuses] = useState(initialStatuses)
  const [toastVisible, setToastVisible] = useState(false)
  const toastTimer = useRef(null)

  const showToast = () => {
    setToastVisible(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000)
  }

  const handleStatusChange = (grantId, val) => {
    setStatuses(p => ({ ...p, [grantId]: val }))
    showToast()
  }

  const grants = grantsData.map(g => ({ ...g, status: statuses[g.id] }))
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

        <div style={{ textAlign: 'center', lineHeight: 1.55, padding: '4px 0 0' }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
            ○○○님의 <span style={{ color: '#2d6a2d' }}>지원 현황</span>은
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
            다음과 같아요
          </p>
        </div>

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
            {filtered.map(g => (
              <GrantCard
                key={g.id}
                grant={g}
                status={statuses[g.id]}
                onStatusChange={val => handleStatusChange(g.id, val)}
                navigate={navigate}
              />
            ))}
          </div>
        ) : (
          ['신청예정', '신청완료', '관심없음'].map(status =>
            grouped[status]?.length ? (
              <StatusSection
                key={status}
                title={status}
                grants={grouped[status]}
                statuses={statuses}
                onStatusChange={handleStatusChange}
                navigate={navigate}
              />
            ) : null
          )
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: 15 }}>
            해당하는 지원금이 없어요
          </div>
        )}

      </div>

      <Toast visible={toastVisible} />
    </div>
  )
}
