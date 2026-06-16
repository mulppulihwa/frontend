import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, Bell, BellRing, Check, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import TopBar from '../components/TopBar'
import LoadingProgress from '../components/LoadingProgress'
import useLoadingProgress from '../hooks/useLoadingProgress'
import StatusCheckboxes from '../components/StatusCheckboxes'
import PreparationButton from '../components/PreparationButton'
import okcheonCharacter from '../assets/okcheon-character.png'
import { cachePolicyStatus, fetchProfile, fetchSavedPolicies, getCachedSavedPolicies, savePolicy, updateSavedPolicyStatus } from '../lib/api'
import { findDisplayName, getKakaoUserName } from '../lib/auth'

const filters = [
  { key: '전체', label: '전체' },
  { key: '신청예정', label: '신청 예정' },
  { key: '신청완료', label: '신청 완료' },
  { key: '관심없음', label: '관심 없음' },
]

const statusConfig = {
  신청예정: { label: '신청 예정', color: '#FFA100', bg: '#fff3e0' },
  신청완료: { label: '신청 완료', color: '#076818', bg: '#e8f3e8' },
  관심없음: { label: '관심 없음', color: '#d93025', bg: '#fff0ef' },
}

const NOTIFICATION_STATUS_KEY = 'policyNotificationStatus'
const POLICIES_PER_PAGE = 10
const PAGE_LOADED_AT = Date.now()
const PAGE_LOADED_DAY_START = new Date(PAGE_LOADED_AT)
PAGE_LOADED_DAY_START.setHours(0, 0, 0, 0)
const sortOptions = [
  { key: 'deadline', label: '마감 임박' },
  { key: 'recent', label: '최근 추가' },
  { key: 'name', label: '이름순' },
]

function getDateTimestamp(dateLike) {
  if (!dateLike) return null
  const timestamp = new Date(dateLike).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

function getDeadlineTimestamp(grant) {
  const deadlineTimestamp = getDateTimestamp(grant.deadline)
  if (deadlineTimestamp !== null) return deadlineTimestamp

  const countdownDays = Number(grant.countdown?.days ?? grant.days)
  if (!Number.isFinite(countdownDays) || countdownDays <= 0) return null
  return PAGE_LOADED_DAY_START.getTime() + countdownDays * 86400000
}

function comparePolicyTitles(a, b) {
  return String(a.title || '').localeCompare(String(b.title || ''), 'ko')
}

function compareByDeadline(a, b, reversed = false) {
  const aDeadline = getDeadlineTimestamp(a)
  const bDeadline = getDeadlineTimestamp(b)

  if (aDeadline === null && bDeadline === null) return comparePolicyTitles(a, b)
  if (aDeadline === null) return 1
  if (bDeadline === null) return -1

  const aExpired = aDeadline < PAGE_LOADED_AT
  const bExpired = bDeadline < PAGE_LOADED_AT

  if (aExpired !== bExpired) return aExpired ? 1 : -1
  if (aDeadline !== bDeadline) {
    const deadlineOrder = aExpired ? bDeadline - aDeadline : aDeadline - bDeadline
    return reversed ? -deadlineOrder : deadlineOrder
  }
  return comparePolicyTitles(a, b)
}

function compareByRecentlyAdded(a, b, reversed = false) {
  const aAdded = getDateTimestamp(a.addedAt)
  const bAdded = getDateTimestamp(b.addedAt)

  if (aAdded === null && bAdded === null) return comparePolicyTitles(a, b)
  if (aAdded === null) return 1
  if (bAdded === null) return -1

  const addedOrder = bAdded - aAdded
  return (reversed ? -addedOrder : addedOrder) || comparePolicyTitles(a, b)
}

function getSortDirectionLabel(sort, reversed) {
  if (sort === 'deadline') return reversed ? '마감 여유순' : '마감 빠른순'
  if (sort === 'recent') return reversed ? '오래된순' : '최신순'
  return reversed ? '역순' : '가나다순'
}

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
  const deadlineTimestamp = getDeadlineTimestamp(grant)
  const days = deadlineTimestamp === null ? null : Math.ceil((deadlineTimestamp - PAGE_LOADED_AT) / 86400000)
  const dDayLabel = days && days > 0 ? `D-${days}` : '-'
  const BellIcon = notified ? BellRing : Bell

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(218,231,211,0.9)', borderRadius: 28, overflow: 'hidden' }}>
      <div
        onClick={() => navigate('/detail', { state: { grant } })}
        style={{ padding: '16px 16px 12px', display: 'grid', gridTemplateColumns: '56px minmax(0, 1fr) 34px', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <p style={{ fontSize: 15, fontWeight: 800, color: '#d93025', letterSpacing: '-0.2px', textAlign: 'center' }}>
          {dDayLabel}
        </p>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1f2433', wordBreak: 'keep-all', overflowWrap: 'break-word' }}>{grant.title}</p>
          <p style={{ fontSize: 13, color: '#555', letterSpacing: '-0.1px' }}>{grant.subtitle}</p>
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
        <div style={{ display: 'flex', width: '100%' }}>
          <PreparationButton
            onClick={e => { e.stopPropagation(); navigate(`/checklist?policyId=${encodeURIComponent(grant.id)}`, { state: { grant } }) }}
          />
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

function NotificationSetModal({ visible, mode, onClose }) {
  if (!visible) return null
  const isUnset = mode === 'unset'
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
        padding: 28,
        background: 'rgba(0,0,0,0.32)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 318,
          borderRadius: 24,
          border: '1.5px solid #dbead5',
          background: '#FFFFFF',
          padding: '28px 22px 20px',
          textAlign: 'center',
          boxSizing: 'border-box',
          animation: 'modalPop 0.2s ease',
        }}
      >
        <img src={okcheonCharacter} alt="" style={{ width: 70, height: 70, objectFit: 'contain', objectPosition: 'center', marginBottom: 18 }} />
        <p style={{ fontSize: 20, fontWeight: 800, color: '#ff5538', lineHeight: 1.25, letterSpacing: '-0.4px' }}>
          {isUnset ? '알림 해지 완료' : '알림 설정 완료'}
        </p>
        <p style={{ marginTop: 24, fontSize: 17, fontWeight: 500, color: '#000', lineHeight: 1.42, letterSpacing: '-0.3px', wordBreak: 'keep-all' }}>
          {isUnset ? '이제 이 정책의 마감 알림을 보내드리지 않을게요.' : '신청 마감일을 잊지 않도록 맞춤 알림을 보내드릴게요!'}
        </p>
        <button
          className="app-action-button"
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            minHeight: 46,
            marginTop: 24,
            border: 'none',
            borderRadius: 999,
            background: '#076818',
            color: '#FFFFFF',
            fontSize: 14,
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
  const [statuses, setStatuses] = useState(() => {
    const cached = getCachedSavedPolicies()
    return cached.reduce((acc, p) => ({ ...acc, [p.id]: p.user_status || null }), {})
  })
  const [grantsData, setGrantsData] = useState(() => getCachedSavedPolicies())
  const [toastVisible, setToastVisible] = useState(false)
  const [notificationModalVisible, setNotificationModalVisible] = useState(false)
  const [notificationModalMode, setNotificationModalMode] = useState('set')
  const [notificationStatus, setNotificationStatus] = useState(() => readNotificationStatus())
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('deadline')
  const [sortReversed, setSortReversed] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(() => getCachedSavedPolicies().length === 0)
  const statusProgress = useLoadingProgress(loading)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState(getKakaoUserName)
  const toastTimer = useRef(null)

  useEffect(() => {
    let active = true
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
      .catch(() => {})
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
    const currentlyNotified = !!notificationStatus[grantId]
    const next = { ...notificationStatus }
    if (currentlyNotified) {
      delete next[grantId]
    } else {
      next[grantId] = true
    }
    setNotificationStatus(next)
    localStorage.setItem(NOTIFICATION_STATUS_KEY, JSON.stringify(next))
    setNotificationModalMode(currentlyNotified ? 'unset' : 'set')
    setNotificationModalVisible(true)
  }

  const grants = grantsData.map(g => ({ ...g, status: statuses[g.id] }))
  const isAll = activeFilter === '전체'
  const sortFn = sort === 'deadline'
    ? (a, b) => compareByDeadline(a, b, sortReversed)
    : sort === 'recent'
      ? (a, b) => compareByRecentlyAdded(a, b, sortReversed)
      : (a, b) => (sortReversed ? -1 : 1) * comparePolicyTitles(a, b)
  const sortDirectionLabel = getSortDirectionLabel(sort, sortReversed)
  const directionPointsUp = sort === 'recent' ? sortReversed : !sortReversed
  const filtered = (isAll
    ? grants
    : activeFilter === '미입력'
      ? grants.filter(g => !g.status)
      : grants.filter(g => g.status === activeFilter)
  ).filter(g => g.title.includes(query) || g.subtitle.includes(query))
   .sort(sortFn)
  const totalPages = Math.max(1, Math.ceil(filtered.length / POLICIES_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedGrants = filtered.slice(
    (currentPage - 1) * POLICIES_PER_PAGE,
    currentPage * POLICIES_PER_PAGE,
  )
  const grouped = !isAll && paginatedGrants.reduce((acc, g) => {
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
            onChange={e => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="지원금 검색"
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 14, color: '#1a1a1a', fontFamily: 'inherit', letterSpacing: '-0.1px' }}
          />
          {query.length > 0 && (
            <button onClick={() => { setQuery(''); setPage(1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
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
                onClick={() => {
                  setActiveFilter(f.key)
                  setPage(1)
                }}
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

        {/* Sort selector */}
        <div
          aria-label="정렬 방식"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
            marginBottom: -12,
          }}
        >
          <select
            aria-label="정렬 기준"
            value={sort}
            onChange={event => {
              setSort(event.target.value)
              setSortReversed(false)
              setPage(1)
            }}
            style={{
              width: 112,
              height: 36,
              padding: '0 28px 0 11px',
              border: '1px solid #dfe4dc',
              borderRadius: 10,
              background: '#fff',
              color: '#333',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 650,
              cursor: 'pointer',
            }}
          >
            {sortOptions.map(option => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
          <button
            type="button"
            aria-label={`정렬 방향 변경, 현재 ${sortDirectionLabel}`}
            onClick={() => {
              setSortReversed(value => !value)
              setPage(1)
            }}
            title={sortDirectionLabel}
            style={{
              width: 36,
              height: 36,
              padding: 0,
              border: '1px solid #dfe4dc',
              borderRadius: 10,
              background: '#fff',
              color: '#076818',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              cursor: 'pointer',
              justifySelf: 'center',
            }}
          >
            {directionPointsUp
              ? <ArrowUp size={16} color="#076818" strokeWidth={2.4} />
              : <ArrowDown size={16} color="#076818" strokeWidth={2.4} />}
          </button>
        </div>

        {statusProgress.visible && (
          <div style={{
            background: 'none',
            border: 'none',
            padding: '48px 20px',
            display: 'flex', justifyContent: 'center',
          }}>
            <LoadingProgress progress={statusProgress.progress} label="지원 현황을 불러오는 중이에요" />
          </div>
        )}

        {!statusProgress.visible && error && (
          <div style={{ textAlign: 'center', padding: '12px 16px', color: '#d93025', fontSize: 14, border: '1.5px solid #f1d0cd', borderRadius: 16, background: '#fff' }}>
            {error}
          </div>
        )}

        {!statusProgress.visible && isAll ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {paginatedGrants.map(g => (
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
        ) : !statusProgress.visible ? (
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

        {!statusProgress.visible && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: 14 }}>
            해당하는 지원금이 없어요
          </div>
        )}

        {!statusProgress.visible && filtered.length > 0 && totalPages > 1 && (
          <nav
            aria-label="지원 정책 페이지"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '8px 0 2px' }}
          >
            <button
              className="app-action-button"
              type="button"
              aria-label="이전 페이지"
              disabled={currentPage === 1}
              onClick={() => {
                setPage(current => Math.max(1, current - 1))
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              style={{
                width: 42,
                border: '1.5px solid #dfe4dc',
                borderRadius: '50%',
                background: '#FFFFFF',
                color: '#076818',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage === 1 ? 'default' : 'pointer',
                opacity: currentPage === 1 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={19} strokeWidth={2.4} />
            </button>
            <span style={{ minWidth: 58, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#333' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              className="app-action-button"
              type="button"
              aria-label="다음 페이지"
              disabled={currentPage === totalPages}
              onClick={() => {
                setPage(current => Math.min(totalPages, current + 1))
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              style={{
                width: 42,
                border: 'none',
                borderRadius: '50%',
                background: '#076818',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage === totalPages ? 'default' : 'pointer',
                opacity: currentPage === totalPages ? 0.4 : 1,
              }}
            >
              <ChevronRight size={19} strokeWidth={2.4} />
            </button>
          </nav>
        )}

      </div>

      <Toast visible={toastVisible} />
      <NotificationSetModal visible={notificationModalVisible} mode={notificationModalMode} onClose={() => setNotificationModalVisible(false)} />
    </div>
  )
}
