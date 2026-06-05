import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { fetchSavedPolicies } from '../lib/api'

const notificationFilters = [
  { key: 'all', label: '전체' },
  { key: 'd14', label: '2주 전' },
  { key: 'd7', label: '1주 전' },
  { key: 'd3', label: '3일 전' },
  { key: 'd1', label: '하루 전' },
  { key: 'unknown', label: '날짜 없음' },
]

function getDeadlineDays(deadlineStr) {
  if (!deadlineStr) return Number.POSITIVE_INFINITY
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(deadlineStr)
  if (Number.isNaN(deadline.getTime())) return Number.POSITIVE_INFINITY
  deadline.setHours(0, 0, 0, 0)
  return Math.ceil((deadline - today) / 86400000)
}

function getDday(deadlineStr) {
  const days = getDeadlineDays(deadlineStr)
  if (!Number.isFinite(days)) return '-'
  if (days === 0) return 'D-0'
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`
}

function matchesNotificationFilter(policy, filter) {
  if (filter === 'all') return true
  const days = getDeadlineDays(policy.deadline)
  if (filter === 'unknown') return !Number.isFinite(days)
  if (!Number.isFinite(days)) return false
  if (filter === 'd1') return days <= 1
  if (filter === 'd3') return days > 1 && days <= 3
  if (filter === 'd7') return days > 3 && days <= 7
  if (filter === 'd14') return days > 7 && days <= 14
  return true
}

function getNotificationMessage(deadlineStr) {
  const days = getDeadlineDays(deadlineStr)
  if (!Number.isFinite(days)) {
    return ['신청 마감일을 확인해 주세요.', '필요한 준비 서류를 미리 확인해보세요.']
  }
  if (days <= 1) {
    return ['내일이면 신청 마감이에요.', '나도 모르게 놓친 준비물이 있을지 마지막으로 확인해 보세요.']
  }
  if (days <= 3) {
    return ['마감까지 3일 남았어요!', '마감 직전에는 신청자가 몰릴 수 있으니, 미리 방문하시는 건 어떨까요?', '준비한 서류를 들고 지금 바로 행정복지센터로 출발해 보세요.']
  }
  if (days <= 7) {
    return ['신청 마감이 일주일 앞으로 다가왔어요!', '아직 신청하지 않으셨다면 지금 확인해보세요.']
  }
  return ['최대 300만원을 지원 받을 수 있는 기회예요!', '미리 신청 자격과 준비 서류를 확인해보세요.']
}

function NotificationCard({ policy }) {
  const messages = getNotificationMessage(policy.deadline)
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(218,231,211,0.9)', borderRadius: 28, padding: '16px 16px 14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', columnGap: 10, alignItems: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#d93025', lineHeight: 1.25, textAlign: 'center' }}>{getDday(policy.deadline)}</p>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1f2433', lineHeight: 1.35, wordBreak: 'keep-all', overflowWrap: 'break-word' }}>{policy.title}</p>
          <p style={{ marginTop: 10, fontSize: 13, fontWeight: 500, color: '#555', lineHeight: 1.5, wordBreak: 'keep-all', letterSpacing: '-0.1px' }}>
            {policy.subtitle || '지원 내용을 확인할 수 있는 기회예요!'}
          </p>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {messages.map(message => (
              <p key={message} style={{ fontSize: 13, fontWeight: 500, color: '#555', lineHeight: 1.5, wordBreak: 'keep-all', letterSpacing: '-0.1px' }}>
                {message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Alarm() {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchSavedPolicies()
      .then(savedPolicies => {
        if (!active) return
        setPolicies([...savedPolicies].sort((a, b) => getDeadlineDays(a.deadline) - getDeadlineDays(b.deadline)))
      })
      .catch(() => {
        if (active) setPolicies([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const visiblePolicies = policies.filter(policy => matchesNotificationFilter(policy, activeFilter))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>
      <TopBar title="알림 받기" onBack={() => navigate('/home')} />

      <div style={{ padding: '18px 18px 80px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!loading && policies.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 2 }}>
            {notificationFilters.map(filter => {
              const selected = activeFilter === filter.key
              const count = policies.filter(policy => matchesNotificationFilter(policy, filter.key)).length
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  style={{
                    flexShrink: 0,
                    minHeight: 38,
                    padding: '0 14px',
                    borderRadius: 999,
                    border: `1.5px solid ${selected ? '#076818' : '#e8e8e8'}`,
                    background: selected ? '#076818' : '#FFFFFF',
                    color: selected ? '#FFFFFF' : '#777',
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {filter.label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {loading && (
          <div style={{ padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(218,231,211,0.9)', borderTopColor: '#076818', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2433' }}>알림을 불러오는 중이에요</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && visiblePolicies.length > 0 && visiblePolicies.map(policy => (
          <NotificationCard key={policy.id} policy={policy} />
        ))}

        {!loading && policies.length > 0 && visiblePolicies.length === 0 && (
          <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(218,231,211,0.95)', borderRadius: 28, padding: '28px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#666' }}>이 조건에 해당하는 알림이 없어요.</p>
          </div>
        )}

        {!loading && policies.length === 0 && (
          <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(218,231,211,0.95)', borderRadius: 28, padding: '28px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#666' }}>아직 받을 알림이 없어요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
