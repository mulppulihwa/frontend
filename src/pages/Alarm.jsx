import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { fetchSavedPolicies } from '../lib/api'

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
  if (!Number.isFinite(days)) return 'D-0'
  if (days === 0) return 'D-0'
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`
}

function getDeadlineRemainingText(deadlineStr) {
  if (!deadlineStr) return '마감일 확인 필요'
  const deadline = new Date(deadlineStr)
  if (Number.isNaN(deadline.getTime())) return '마감일 확인 필요'
  const diffMs = deadline.getTime() - Date.now()
  if (diffMs <= 0) return '마감되었습니다'
  const totalMinutes = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  return `마감까지 D- ${days}일 ${hours}시간 ${minutes}분`
}

function NotificationCard({ policy }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(218,231,211,0.95)', borderRadius: 28, padding: '20px 18px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '58px 1fr', columnGap: 12, alignItems: 'start' }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#d93025', lineHeight: 1.2 }}>{getDday(policy.deadline)}</p>
        <div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#111', lineHeight: 1.25, wordBreak: 'keep-all' }}>{policy.title}</p>
          <p style={{ marginTop: 20, fontSize: 17, fontWeight: 700, color: '#111', lineHeight: 1.5, wordBreak: 'keep-all' }}>
            {policy.subtitle || '지원 내용을 확인할 수 있는 기회예요!'}
          </p>
          <p style={{ marginTop: 14, fontSize: 17, fontWeight: 800, color: '#ff5538', lineHeight: 1.3 }}>
            {getDeadlineRemainingText(policy.deadline)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Alarm() {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState([])
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>
      <TopBar title="알림 받기" onBack={() => navigate('/home')} />

      <div style={{ padding: '18px 18px 80px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && (
          <div style={{ padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(218,231,211,0.9)', borderTopColor: '#076818', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2433' }}>알림을 불러오는 중이에요</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && policies.length > 0 && policies.map(policy => (
          <NotificationCard key={policy.id} policy={policy} />
        ))}

        {!loading && policies.length === 0 && (
          <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(218,231,211,0.95)', borderRadius: 28, padding: '28px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#666' }}>아직 받을 알림이 없어요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
