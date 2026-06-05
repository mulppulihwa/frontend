import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, Bell, BellRing, Check, Search, X } from 'lucide-react'
import TopBar from '../components/TopBar'
import StatusCheckboxes from '../components/StatusCheckboxes'
import farmer from '../assets/farmer.png'
import { cachePolicyStatus, fetchProfile, fetchSavedPolicies, savePolicy, updateSavedPolicyStatus } from '../lib/api'
import { findDisplayName, getKakaoUserName } from '../lib/auth'

const filters = [
  { key: '전체', label: '전체' },
  { key: '신청예정', label: '신청 예정' },
  { key: '신청완료', label: '신청 완료' },
  { key: '관심없음', label: '관심 없음' },
  { key: '미입력', label: '미입력' },
]

const statusConfig = {
  신청예정: { label: '신청 예정', color: '#FFA100', bg: '#fff3e0' },
  신청완료: { label: '신청 완료', color: '#076818', bg: '#e8f3e8' },
  관심없음: { label: '관심 없음', color: '#d93025', bg: '#fff0ef' },
}

const NOTIFICATION_STATUS_KEY = 'policyNotificationStatus'

function readNotificationStatus() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATION_STATUS_KEY) || '{}')
  } catch {
    return {}
  }
}

function formatAddedDate(dateLike) {
  const date = dateLike ? new Date(dateLike) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일에 추가되었습니다.`
}

function GrantCard({ grant, status, onStatusChange, navigate, onNotify, notified }) {
  const isCompleted = status === '신청완료'
  const days = grant.countdown?.days ?? grant.days ?? 0
  const BellIcon = notified ? BellRing : Bell

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(218,231,211,0.9)', borderRadius: 28, overflow: 'hidden' }}>
      <div
        onClick={() => navigate('/detail', { state: { grant } })}
        style={{ padding: '16px 16px 12px', display: 'grid', gridTemplateColumns: '56px minmax(0, 1fr) 34px', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <p style={{ fontSize: 15, fontWeight: 800, color: '#d93025', letterSpacing: '-0.2px', textAlign: 'center' }}>
          D-{days}
        </p>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1f2433', wordBreak: 'keep-all', overflowWrap: 'break-word' }}>{grant.title}</p>
          <p style={{ fontSize: 13, color: '#555', letterSpacing: '-0.1px' }}>{grant.subtitle}</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#d93025', letterSpacing: '-0.1px' }}>
            {isCompleted ? '지급일까지' : '마감까지'} D-{days}
          </p>
          <p style={{ fontSize: 12, fontWeight: 400, color: '#8a8a8a', letterSpacing: '-0.1px' }}>
            {formatAddedDate(grant.addedAt)}
          </p>
        </div>
        <button
          type="button"
          aria-label={notified ? '알림 설정됨' : '알림 받기'}
          onClick={e => { e.stopPropagation(); onNotify() }}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `1.5px solid ${notified ? '#FFA100' : '#e8e8e8'}`,
            background: notified ? '#fff3e0' : '#fff',
            cursor: 'pointer',
            color: notified ? '#FFA100' : '#444',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <BellIcon size={17} strokeWidth={2.3} />
        </button>
      </div>

      <div style={{ borderTop: '1px solid rgba(218,231,211,0.6)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <StatusCheckboxes value={status} onChange={onStatusChange} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/checklist?policyId=${encodeURIComponent(grant.id)}`, { state: { grant } }) }}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 999,
              border: 'none', background: '#076818',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.2px',
            }}
          >
            준비물 확인 →
          </button>
          <button
            onClick={e => { e.stopPropagation(); navigate('/map', { state: { policy: grant } }) }}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 999,
              border: '1.5px solid #076818', background: '#fff',
              color: '#076818', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.2px',
            }}
          >
            사용처 보기
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusSection({ title, grants, statuses, notificationStatus, onStatusChange, navigate, onNotify }) {
  const cfg = statusConfig[title]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ paddingLeft: 2 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: cfg.color, letterSpacing: '-0.2px' }}>{cfg.label}</p>
      </div>
      {grants.map(g => (
        <GrantCard
          key={g.id}
          grant={g}
          status={statuses[g.id]}
          notified={!!notificationStatus[g.id]}
          onStatusChange={val => onStatusChange(g.id, val)}
          navigate={navigate}
          onNotify={() => onNotify(g.id)}
        />
      ))}
    </div>
  )
}

function Toast({ visible }) {
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed', bottom: 120, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#1a1a1a', borderRadius: 50, padding: '12px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        animation: 'fadeInUp 0.22s ease',
        whiteSpace: 'nowrap',
      }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#076818', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={13} color="#fff" strokeWidth={2.5} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-0.2px' }}>지원현황이 수정되었습니다</p>
      </div>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

function NotificationSetModal({ visible, onClose }) {
  if (!visible) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 36,
        background: 'rgba(253,252,248,0.72)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 286,
          borderRadius: 26,
          border: '1.5px solid #dbead5',
          background: '#FFFFFF',
          padding: '24px 22px 22px',
          textAlign: 'center',
          boxSizing: 'border-box',
          animation: 'modalPop 0.2s ease',
        }}
      >
        <img src={farmer} alt="" style={{ width: 70, height: 54, objectFit: 'cover', objectPosition: 'top center', marginBottom: 22 }} />
        <p style={{ fontSize: 20, fontWeight: 800, color: '#ff5538', lineHeight: 1.25, letterSpacing: '-0.4px' }}>
          알림 설정 완료
        </p>
        <p style={{ marginTop: 24, fontSize: 17, fontWeight: 500, color: '#000', lineHeight: 1.42, letterSpacing: '-0.3px', wordBreak: 'keep-all' }}>
          신청 마감일을 잊지 않도록 맞춤 알림을 보내드릴게요!
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            minHeight: 48,
            marginTop: 30,
            border: 'none',
            borderRadius: 999,
            background: '#076818',
            color: '#FFFFFF',
            fontSize: 20,
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: 'pointer',
            letterSpacing: '-0.5px',
          }}
        >
          확인
        </button>
      </div>
      <style>{`@keyframes modalPop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  )
}

export default function GrantStatus() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('전체')
  const [statuses, setStatuses] = useState({})
  const [grantsData, setGrantsData] = useState([])
  const [toastVisible, setToastVisible] = useState(false)
  const [notificationModalVisible, setNotificationModalVisible] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState(() => readNotificationStatus())
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('마감순')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState(getKakaoUserName)
  const toastTimer = useRef(null)

  useEffect(() => {
    let active = true
    // fetch real name from profile API (works even without re-login)
    fetchProfile()
      .then(profile => {
        if (!active) return
        const name = findDisplayName(profile)
        if (name) {
          setUserName(name)
          if (!getKakaoUserName()) localStorage.setItem('kakaoUserName', name)
        }
      })
      .catch(() => {})
    fetchSavedPolicies()
      .then(policies => {
        if (!active) return
        setGrantsData(policies)
        setStatuses(policies.reduce((acc, policy) => ({
          ...acc,
          [policy.id]: policy.user_status || null,
        }), {}))
      })
      .catch(() => {
        if (!active) return
        setGrantsData([])
        setStatuses({})
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const showToast = () => {
    setToastVisible(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000)
  }

  const handleStatusChange = async (grantId, val) => {
    const previous = statuses[grantId] || null
    const grant = grantsData.find(item => item.id === grantId)
    setStatuses(p => ({ ...p, [grantId]: val }))
    cachePolicyStatus(grantId, val, grant)
    if (!val) return
    try {
      await savePolicy(grantId).catch(() => null)
      await updateSavedPolicyStatus(grantId, val)
      showToast()
    } catch (err) {
      setStatuses(p => ({ ...p, [grantId]: previous }))
      setError(err.message || '지원현황을 수정하지 못했습니다.')
    }
  }

  const handleNotificationClick = (grantId) => {
    const next = { ...notificationStatus, [grantId]: true }
    setNotificationStatus(next)
    localStorage.setItem(NOTIFICATION_STATUS_KEY, JSON.stringify(next))
    setNotificationModalVisible(true)
  }

  const grants = grantsData.map(g => ({ ...g, status: statuses[g.id] }))
  const isAll = activeFilter === '전체'
  const sortFn = sort === '마감순'
    ? (a, b) => a.days - b.days
    : (a, b) => a.title.localeCompare(b.title, 'ko')
  const filtered = (isAll
    ? grants
    : activeFilter === '미입력'
      ? grants.filter(g => !g.status)
      : grants.filter(g => g.status === activeFilter)
  ).filter(g => g.title.includes(query) || g.subtitle.includes(query))
   .sort(sortFn)
  const grouped = !isAll && filtered.reduce((acc, g) => {
    const key = g.status || '미입력'
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>
      <TopBar title="지원 현황" onBack={() => navigate('/home')} />

      <div style={{ padding: '12px 18px 100px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div style={{ textAlign: 'center', lineHeight: 1.55, padding: '4px 0 0' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
            {userName || '내'}님의 <span style={{ color: '#076818' }}>지원 현황</span>은
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
            다음과 같아요
          </p>
        </div>

        {/* Search box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 16, padding: '11px 16px', border: '1.5px solid #e8e8e8' }}>
          <Search size={16} color="#bbb" strokeWidth={2.2} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="지원금 검색"
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 14, color: '#1a1a1a', fontFamily: 'inherit', letterSpacing: '-0.1px' }}
          />
          {query.length > 0 && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={15} color="#bbb" strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {filters.map(f => {
            const active = activeFilter === f.key
            const count = f.key === '전체'
              ? grants.length
              : f.key === '미입력'
                ? grants.filter(g => !statuses[g.id]).length
                : grants.filter(g => statuses[g.id] === f.key).length
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  padding: '8px 16px', borderRadius: 999,
                  border: `1.5px solid ${active ? '#076818' : '#e8e8e8'}`,
                  background: active ? '#076818' : '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? '#fff' : '#666',
                  letterSpacing: '-0.1px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {f.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Sort toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -14 }}>
          <button
            onClick={() => setSort(s => s === '마감순' ? '가나다순' : '마감순')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#888',
              padding: 0,
            }}
          >
            <ArrowUpDown size={13} color="#aaa" strokeWidth={2.2} />
            {sort}
          </button>
        </div>

        {loading && (
          <div style={{
            background: 'none',
            border: 'none',
            padding: '48px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid rgba(218,231,211,0.9)', borderTopColor: '#076818',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2433', letterSpacing: '-0.2px' }}>
              지원 현황을 불러오는 중이에요
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '12px 16px', color: '#d93025', fontSize: 14, border: '1.5px solid #f1d0cd', borderRadius: 16, background: '#fff' }}>
            {error}
          </div>
        )}

        {!loading && isAll ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(g => (
              <GrantCard
                key={g.id}
                grant={g}
                status={statuses[g.id]}
                notified={!!notificationStatus[g.id]}
                onStatusChange={val => handleStatusChange(g.id, val)}
                navigate={navigate}
                onNotify={() => handleNotificationClick(g.id)}
              />
            ))}
          </div>
        ) : !loading ? (
          <>
            {['신청예정', '신청완료', '관심없음'].map(status =>
              grouped[status]?.length ? (
                <StatusSection
                  key={status}
                  title={status}
                  grants={grouped[status]}
                  statuses={statuses}
                  notificationStatus={notificationStatus}
                  onStatusChange={handleStatusChange}
                  navigate={navigate}
                  onNotify={handleNotificationClick}
                />
              ) : null
            )}
            {grouped['미입력']?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ paddingLeft: 2 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#8a8a8a', letterSpacing: '-0.2px' }}>미입력</p>
                </div>
                {grouped['미입력'].map(g => (
                  <GrantCard
                    key={g.id}
                    grant={g}
                    status={statuses[g.id]}
                    notified={!!notificationStatus[g.id]}
                    onStatusChange={val => handleStatusChange(g.id, val)}
                    navigate={navigate}
                    onNotify={() => handleNotificationClick(g.id)}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: 14 }}>
            해당하는 지원금이 없어요
          </div>
        )}

      </div>

      <Toast visible={toastVisible} />
      <NotificationSetModal visible={notificationModalVisible} onClose={() => setNotificationModalVisible(false)} />
    </div>
  )
}
