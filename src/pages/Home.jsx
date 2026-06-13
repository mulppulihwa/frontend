import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, ChevronRight, Clock3, User } from 'lucide-react'
import { fetchPolicyChecklist, fetchProfile, fetchSavedPolicies, saveCheckedItems } from '../lib/api'
import { findDisplayName, getKakaoUserName } from '../lib/auth'
import HomeTutorial from '../components/HomeTutorial'
import PreparationButton from '../components/PreparationButton'

const HOME_CHECKLIST_CACHE_KEY = 'home-checklist-items'

function getDeadlineText(deadlineStr) {
  if (!deadlineStr) return '마감일 확인 필요'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(deadlineStr)
  if (Number.isNaN(deadline.getTime())) return '마감일 확인 필요'
  deadline.setHours(0, 0, 0, 0)
  const diff = Math.ceil((deadline - today) / 86400000)
  if (diff === 0) return '오늘 마감'
  if (diff > 0) return `마감까지 ${diff}일 남음`
  return `마감 ${Math.abs(diff)}일 지남`
}

function getDeadlineDays(deadlineStr) {
  if (!deadlineStr) return Number.POSITIVE_INFINITY
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(deadlineStr)
  if (Number.isNaN(deadline.getTime())) return Number.POSITIVE_INFINITY
  deadline.setHours(0, 0, 0, 0)
  return Math.ceil((deadline - today) / 86400000)
}

function compareDeadlineUrgency(a, b) {
  const aDays = getDeadlineDays(a.deadline)
  const bDays = getDeadlineDays(b.deadline)
  const getGroup = days => {
    if (!Number.isFinite(days)) return 2
    return days >= 0 ? 0 : 1
  }
  const groupDiff = getGroup(aDays) - getGroup(bDays)
  if (groupDiff !== 0) return groupDiff
  return Math.abs(aDays) - Math.abs(bDays)
}

function readJsonSafe(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}

function readChecklistCache() {
  const cached = readJsonSafe(HOME_CHECKLIST_CACHE_KEY)
  if (!cached || typeof cached !== 'object' || Array.isArray(cached)) return {}
  return Object.fromEntries(
    Object.entries(cached).filter(([, items]) => Array.isArray(items)),
  )
}

function firstValue(source, keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1f2433', letterSpacing: '-0.3px' }}>{children}</h2>
      {action}
    </div>
  )
}

function MiniRing({ done = 0, total = 0 }) {
  const radius = 10
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? done / total : 0
  const complete = total > 0 && done >= total

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      {complete ? (
        <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#076818', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={17} color="#fff" strokeWidth={2.8} />
        </span>
      ) : (
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <circle cx="15" cy="15" r={radius} fill="none" stroke="#e8e8e8" strokeWidth="3" />
          <circle
            cx="15"
            cy="15"
            r={radius}
            fill="none"
            stroke="#FFA100"
            strokeWidth="3"
            strokeDasharray={`${progress * circumference} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 15 15)"
          />
        </svg>
      )}
      <span style={{ fontSize: 10, fontWeight: 600, color: complete ? '#076818' : '#888', whiteSpace: 'nowrap' }}>
        준비물 {done}/{total}
      </span>
    </div>
  )
}

const diagnosedStatusMeta = {
  신청완료: { label: '신청 완료', color: '#076818', background: '#e8f3e8', Icon: Check },
  신청예정: { label: '신청 예정', color: '#FFA100', background: '#fff3e0', Icon: Clock3 },
  관심없음: { label: '관심 없음', color: '#d93025', background: '#fff0ef', Icon: Check },
}

function getDday(deadline) {
  const days = getDeadlineDays(deadline)
  if (!Number.isFinite(days)) return '-'
  if (days === 0) return '-'
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`
}

function DiagnosedPolicyCard({ policy, checklistItems, navigate }) {
  const status = policy.user_status || policy.status
  const statusMeta = diagnosedStatusMeta[status] || {
    label: '상태 미입력',
    color: '#888',
    background: '#f5f3ef',
    Icon: Clock3,
  }
  const StatusIcon = statusMeta.Icon
  const progress = getChecklistProgress(policy, checklistItems)

  return (
    <article style={{ background: '#fff', border: '1px solid rgba(218,231,211,0.95)', borderRadius: 24, padding: '16px 14px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <p style={{ width: 54, flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#d93025', textAlign: 'center' }}>
          {getDday(policy.deadline)}
        </p>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 750, color: '#1f2433', lineHeight: 1.35, wordBreak: 'keep-all' }}>
            {policy.title}
          </p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '4px 8px', borderRadius: 999, background: statusMeta.background, color: statusMeta.color, fontSize: 11, fontWeight: 700 }}>
            <StatusIcon size={11} strokeWidth={2.5} />
            {statusMeta.label}
          </span>
        </div>
        <MiniRing done={progress.done} total={progress.total} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
        <PreparationButton
          onClick={() => navigate(`/checklist?policyId=${encodeURIComponent(policy.id)}`, { state: { grant: policy } })}
        />
      </div>
    </article>
  )
}

function DiagnosedPolicies({ policies, checklistItemsByPolicy, navigate }) {
  const visiblePolicies = [...policies]
    .sort((a, b) => {
      const aStatus = a.user_status || a.status
      const bStatus = b.user_status || b.status
      const statusOrder = { 신청완료: 0, 신청예정: 1, 관심없음: 2 }
      const statusDifference = (statusOrder[aStatus] ?? 3) - (statusOrder[bStatus] ?? 3)
      return statusDifference || compareDeadlineUrgency(a, b)
    })
    .slice(0, 2)

  return (
    <section data-tutorial="summary">
      <SectionTitle action={<button type="button" onClick={() => navigate('/grant-status')} style={{ display: 'flex', alignItems: 'center', gap: 2, border: 'none', background: '#fff', borderRadius: 999, padding: '8px 10px 8px 13px', color: '#888', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>전체 보기 <ChevronRight size={14} /></button>}>
        <span>
          진단 받은 정책
          <small style={{ display: 'block', marginTop: 2, fontSize: 12, fontWeight: 500, color: '#333', letterSpacing: 0 }}>
            내 조건에 맞춰 쏙쏙 골라낸 옥천의 혜택들이 대기 중이에요
          </small>
        </span>
      </SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visiblePolicies.map(policy => (
          <DiagnosedPolicyCard
            key={policy.id}
            policy={policy}
            checklistItems={checklistItemsByPolicy[String(policy.id)] || []}
            navigate={navigate}
          />
        ))}
        {visiblePolicies.length === 0 && (
          <div style={{ minHeight: 116, display: 'grid', placeItems: 'center', border: '1px solid rgba(218,231,211,0.95)', borderRadius: 24, background: '#fff', color: '#888', fontSize: 13, fontWeight: 600 }}>
            아직 진단 받은 정책이 없어요.
          </div>
        )}
      </div>
    </section>
  )
}

const homeScheduleMessages = [
  '마감 임박! 신청 전에 꼭 챙겨야 할 것들이에요',
  '이번 주 마감 지원금, 이것만 준비하면 끝나요!',
  '놓치면 안 되는 마감 임박 정책 준비물이에요',
]

const checklistBucketFields = [
  ['requirements', 'application_requirements', 'eligibility', 'conditions', 'qualification', 'qualifications', '신청 요건', '신청요건'],
  ['documents', 'required_documents', 'submission_documents', 'application_documents', 'paperwork', '제출 서류', '제출서류', '신청 서류', '신청서류'],
  ['items', 'required_items', 'materials', 'preparations', 'things_to_bring', '필요 물건', '필요물건', '준비물'],
  ['visit', 'visit_office_checklist', 'office_visit', 'administrative_center', '행정복지센터 방문하기', '방문하기'],
]

function getChecklistLabel(item) {
  if (typeof item === 'string') return item
  if (typeof item === 'number') return String(item)
  if (!item || typeof item !== 'object') return ''
  return item.label || item.title || item.name || item.text || item.content || item.description || item.requirement || item.document || item.item || ''
}

function getChecklistArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    return value.split(/\r?\n|,/).map(text => text.replace(/^[-•\d.)\s]+/, '').trim()).filter(Boolean)
  }
  if (typeof value === 'object') {
    if (Array.isArray(value.items)) return value.items
    if (Array.isArray(value.results)) return value.results
    if (Array.isArray(value.checklist)) return value.checklist
  }
  return []
}

function normalizeChecklistItem(item, fallbackId, index) {
  const id = item && typeof item === 'object' ? (item.id ?? item.checklist_id ?? item.item_id) : null
  return {
    id: id ?? `${fallbackId}-${index}`,
    order: item && typeof item === 'object' ? (item.order ?? item.sort_order ?? index) : index,
    label: getChecklistLabel(item),
    persistable: id !== null && id !== undefined,
  }
}

function normalizeChecklistItems(data) {
  const payload = data?.checklist && !Array.isArray(data.checklist) ? data.checklist : data
  const source = payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : payload
  const bucketed = checklistBucketFields.flatMap((fields, bucketIndex) => {
    const value = fields.map(field => source?.[field]).find(item => item !== undefined && item !== null)
    return getChecklistArray(value).map((item, index) => normalizeChecklistItem(item, `home-${bucketIndex}`, index))
  })
  if (bucketed.length > 0) return bucketed.filter(item => item.label).sort((a, b) => a.order - b.order)

  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.checklist)
      ? data.checklist
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : []
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, index) => normalizeChecklistItem(item, 'home-flat', index))
    .filter(item => item.label)
    .sort((a, b) => a.order - b.order)
}

function getBackendCheckedItems(data) {
  const candidates = [
    data?.checked_items,
    data?.checkedItems,
    data?.checklist?.checked_items,
    data?.data?.checked_items,
  ]
  const value = candidates.find(Array.isArray)
  return value || []
}

function loadStoredChecks(policy) {
  if (!policy?.id) return {}
  const backendChecks = policy.checked_items?.reduce((acc, id) => ({ ...acc, [id]: true }), {}) || {}
  try {
    return {
      ...backendChecks,
      ...JSON.parse(localStorage.getItem(`checklist-checked-${policy.id}`) || '{}'),
    }
  } catch {
    return backendChecks
  }
}

function getChecklistProgress(policy, items = []) {
  if (!policy?.id || items.length === 0) return { done: 0, total: items.length, remaining: items.length, complete: false }
  const checked = loadStoredChecks(policy)
  const done = items.filter(item => Boolean(checked[item.id])).length
  const total = items.length
  return { done, total, remaining: total - done, complete: total > 0 && done >= total }
}

function HomeCheckItem({ item, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
    >
      <span style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: `1.5px solid ${checked ? '#c2185b' : '#d0d0d0'}`,
        background: checked ? '#c2185b' : '#FFFFFF',
        flexShrink: 0,
        marginTop: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}>
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <p style={{ fontSize: 14, fontWeight: 600, color: checked ? '#aaa' : '#333', lineHeight: 1.35, textDecoration: checked ? 'line-through' : 'none' }}>
        {item.label}
      </p>
    </button>
  )
}

function TodayChecklist({ policy, checklistItems, userName, navigate, onComplete, loading = false }) {
  const [items, setItems] = useState(checklistItems)
  const [checked, setChecked] = useState({})
  const [completeAnimation, setCompleteAnimation] = useState(false)
  const completedPolicyIdRef = useRef(null)
  const [scheduleMessage] = useState(() => homeScheduleMessages[Math.floor(Math.random() * homeScheduleMessages.length)])
  const done = items.filter(item => !!checked[item.id]).length
  const total = items.length
  const visibleItems = [
    ...items.filter(item => !checked[item.id]),
    ...items.filter(item => !!checked[item.id]),
  ].slice(0, 3)
  const deadlineText = getDeadlineText(policy?.deadline)

  useEffect(() => {
    completedPolicyIdRef.current = null
    setItems(checklistItems)
    setChecked(loadStoredChecks(policy))
  }, [checklistItems, policy])

  useEffect(() => {
    if (!policy?.id || total === 0 || done !== total || completedPolicyIdRef.current === policy.id) return undefined
    completedPolicyIdRef.current = policy.id
    setCompleteAnimation(true)
    const animationTimer = window.setTimeout(() => setCompleteAnimation(false), 920)
    const swapTimer = window.setTimeout(() => onComplete?.(policy), 360)
    return () => {
      window.clearTimeout(animationTimer)
      window.clearTimeout(swapTimer)
    }
  }, [done, onComplete, policy, total])

  const toggleItem = async (item) => {
    const next = { ...checked, [item.id]: !checked[item.id] }
    setChecked(next)
    if (policy?.id) localStorage.setItem(`checklist-checked-${policy.id}`, JSON.stringify(next))
    if (policy?.id) localStorage.setItem(`home-checklist-total-${policy.id}`, total)

    if (!policy?.id || !item.persistable) return
    const checkedIds = Object.entries(next)
      .filter(([, value]) => value)
      .map(([id]) => Number(id))
      .filter(id => Number.isFinite(id))
    try {
      await saveCheckedItems(policy.id, checkedIds)
    } catch {
      // Kept in localStorage so the UI still matches the checklist page locally.
    }
  }

  return (
    <section data-tutorial="schedule">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1f2433', letterSpacing: '-0.3px', lineHeight: 1.35 }}>{userName || '00'}님의 오늘의 맞춤 일정</h1>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {scheduleMessage}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button type="button" aria-label="알림" onClick={() => navigate('/alarm')} style={{ width: 38, height: 38, border: 'none', borderRadius: '50%', background: '#FFFFFF', color: '#1f2433', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Bell size={19} strokeWidth={2.3} />
          </button>
          <button type="button" aria-label="프로필 수정" onClick={() => navigate('/basic-info')} style={{ width: 38, height: 38, border: 'none', borderRadius: '50%', background: '#FFFFFF', color: '#1f2433', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <User size={20} strokeWidth={2.3} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes homeChecklistSwap {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          38% { opacity: 0; transform: translateY(-38px) scale(0.96); }
          39% { opacity: 0; transform: translateY(40px) scale(0.96); }
          72% { opacity: 1; transform: translateY(-4px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes homeChecklistLoading {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.85; }
        }
      `}</style>
      <div style={{ minHeight: 230 }} aria-live="polite">
        {loading && !policy?.id ? (
          <div
            aria-label="오늘의 맞춤 일정을 불러오는 중"
            style={{
              minHeight: 230,
              borderRadius: 24,
              border: '1px solid rgba(218,231,211,0.95)',
              background: '#f3f7f1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 24,
              animation: 'homeChecklistLoading 1.2s ease-in-out infinite',
            }}
          >
            <Clock3 size={28} color="#5a7a5e" strokeWidth={2} />
            <p style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: '#5a7a5e' }}>맞춤 체크리스트를 불러오고 있어요.</p>
            <p style={{ marginTop: 5, fontSize: 12, fontWeight: 500, color: '#888' }}>잠시만 기다려 주세요.</p>
          </div>
        ) : policy?.id ? (
          <div
            style={{
              minHeight: 230,
              background: '#fff',
              border: `1px solid ${total > 0 && done === total ? 'rgba(7,104,24,0.24)' : 'rgba(218,231,211,0.95)'}`,
              borderRadius: 24,
              overflow: 'hidden',
              transformOrigin: 'center center',
              animation: completeAnimation ? 'homeChecklistSwap 0.92s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
              transition: 'border-color 0.18s ease, opacity 0.18s ease',
              willChange: completeAnimation ? 'transform, opacity' : 'auto',
            }}
          >
            <button type="button" onClick={() => navigate(`/checklist?policyId=${encodeURIComponent(policy.id)}`, { state: { grant: policy } })} style={{ width: '100%', border: 'none', background: '#e8f3e8', padding: '14px 16px 12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#1f2433', lineHeight: 1.35, wordBreak: 'keep-all' }}>
                {policy.title}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#5a7a5e', lineHeight: 1.25 }}>
                  {deadlineText}
                </span>
              </div>
            </button>
            <div style={{ padding: '12px 16px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#c2185b' }}>준비 항목</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: total > 0 && done === total ? '#076818' : '#aaa' }}>{done}/{total}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {visibleItems.map(item => (
                  <HomeCheckItem key={item.id} item={item} checked={!!checked[item.id]} onToggle={() => toggleItem(item)} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            minHeight: 230,
            borderRadius: 24,
            border: '1px solid rgba(218,231,211,0.95)',
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
          }}>
            <span style={{ width: 42, height: 42, borderRadius: '50%', background: '#e8f3e8', color: '#076818', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Check size={22} strokeWidth={2.4} />
            </span>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1f2433' }}>미완성 체크리스트가 없습니다.</p>
            <p style={{ marginTop: 6, fontSize: 12, fontWeight: 500, color: '#888' }}>모든 준비 항목을 확인했어요.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function normalizeUser(profile) {
  const profileData = profile?.profile || profile?.user_profile || profile?.userProfile || profile || {}
  const submitted = readJsonSafe('submittedDiagnosisProfile')
  const regionCode = firstValue(profileData, ['region_code', 'regionCode'])
  const regionMap = { 4329: '옥천', 43: '충청북도', 26: '부산광역시', 11: '서울특별시' }
  return {
    name: findDisplayName(profile) || findDisplayName(profileData) || getKakaoUserName(),
    region: submitted.location || submitted.region || regionMap[String(regionCode)] || '',
  }
}

export default function Home({ tutorial = false }) {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState([])
  const [selectedPolicyId, setSelectedPolicyId] = useState(null)
  const [user, setUser] = useState(() => ({
    name: getKakaoUserName(),
    region: readJsonSafe('submittedDiagnosisProfile').location || '',
  }))
  const [policiesLoaded, setPoliciesLoaded] = useState(false)
  const [, setChecklistRevision] = useState(0)
  const [checklistItemsByPolicy, setChecklistItemsByPolicy] = useState(readChecklistCache)
  const [checklistsLoaded, setChecklistsLoaded] = useState(false)

  useEffect(() => {
    let active = true
    fetchProfile()
      .then(profile => {
        if (active) setUser(normalizeUser(profile))
      })
      .catch(() => setUser({ name: getKakaoUserName(), region: readJsonSafe('submittedDiagnosisProfile').location || '' }))
    fetchSavedPolicies()
      .then(savedPolicies => {
        if (!active) return
        setPolicies(savedPolicies)
        setPoliciesLoaded(true)
      })
      .catch(() => {
        if (active) setPoliciesLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!policiesLoaded) {
      setChecklistsLoaded(false)
      return () => {
        active = false
      }
    }
    if (policies.length === 0) {
      setChecklistItemsByPolicy({})
      setChecklistsLoaded(true)
      return () => {
        active = false
      }
    }

    setChecklistsLoaded(false)
    localStorage.removeItem('home-checklist-completed')
    const activePolicyIds = new Set(policies.map(policy => String(policy.id)))
    const cachedItems = Object.fromEntries(
      Object.entries(readChecklistCache()).filter(([policyId]) => activePolicyIds.has(policyId)),
    )
    setChecklistItemsByPolicy(cachedItems)

    const requests = policies.map(async policy => {
      try {
        const data = await fetchPolicyChecklist(policy.id)
        const items = normalizeChecklistItems(data)
        const backendChecked = getBackendCheckedItems(data)
        if (backendChecked.length > 0) {
          const checked = backendChecked.reduce((acc, id) => ({ ...acc, [id]: true }), {})
          localStorage.setItem(`checklist-checked-${policy.id}`, JSON.stringify(checked))
        }
        localStorage.setItem(`checklist-total-${policy.id}`, items.length)
        localStorage.setItem(`home-checklist-total-${policy.id}`, items.length)
        if (active) {
          setChecklistItemsByPolicy(current => {
            const next = { ...current, [String(policy.id)]: items }
            localStorage.setItem(HOME_CHECKLIST_CACHE_KEY, JSON.stringify(next))
            return next
          })
        }
      } catch {
        // Preserve the last successful checklist instead of flashing an empty card.
      }
    })

    Promise.allSettled(requests).then(() => {
      if (!active) return
      setChecklistsLoaded(true)
    })

    return () => {
      active = false
    }
  }, [policies, policiesLoaded])

  const activePolicies = policies.filter(policy => {
    const status = policy.user_status || policy.status
    return status === '신청완료' || status === '신청예정'
  })
  const activePolicyIds = new Set(activePolicies.map(policy => String(policy.id)))
  const checklistPolicies = [
    ...activePolicies,
    ...policies.filter(policy => !activePolicyIds.has(String(policy.id))),
  ].sort(compareDeadlineUrgency)
  const getPolicyChecklistItems = policy => checklistItemsByPolicy[String(policy?.id)] || []
  const isHomeChecklistComplete = policy => getChecklistProgress(policy, getPolicyChecklistItems(policy)).complete
  const prioritizedChecklistPolicies = checklistPolicies
    .filter(policy => getPolicyChecklistItems(policy).length > 0 && !isHomeChecklistComplete(policy))
    .sort((a, b) => {
      const deadlineOrder = compareDeadlineUrgency(a, b)
      if (deadlineOrder !== 0) return deadlineOrder
      const aRemaining = getChecklistProgress(a, getPolicyChecklistItems(a)).remaining
      const bRemaining = getChecklistProgress(b, getPolicyChecklistItems(b)).remaining
      return bRemaining - aRemaining
    })
  const selectedPolicy = prioritizedChecklistPolicies.find(policy => String(policy.id) === String(selectedPolicyId))
  const todayPolicy = selectedPolicy || prioritizedChecklistPolicies[0]
  const todayChecklistItems = getPolicyChecklistItems(todayPolicy)

  const handleChecklistComplete = (completedPolicy) => {
    if (!completedPolicy?.id) return
    setChecklistRevision(revision => revision + 1)
    const candidates = checklistPolicies
      .filter(policy => String(policy.id) !== String(completedPolicy.id))
      .filter(policy => getPolicyChecklistItems(policy).length > 0 && !isHomeChecklistComplete(policy))
      .sort((a, b) => {
        const deadlineOrder = compareDeadlineUrgency(a, b)
        if (deadlineOrder !== 0) return deadlineOrder
        const aRemaining = getChecklistProgress(a, getPolicyChecklistItems(a)).remaining
        const bRemaining = getChecklistProgress(b, getPolicyChecklistItems(b)).remaining
        return bRemaining - aRemaining
      })
    const nextPolicy = candidates[0]
    if (nextPolicy?.id) setSelectedPolicyId(nextPolicy.id)
    else setSelectedPolicyId(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDFCF8', overflowX: 'hidden' }}>
      <div style={{ padding: '26px 18px 116px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <TodayChecklist
          key={todayPolicy?.id || 'empty-checklist'}
          policy={todayPolicy}
          checklistItems={todayChecklistItems}
          userName={user.name}
          navigate={navigate}
          onComplete={handleChecklistComplete}
          loading={!checklistsLoaded}
        />
        <DiagnosedPolicies policies={policies} checklistItemsByPolicy={checklistItemsByPolicy} navigate={navigate} />
      </div>
      {tutorial && <HomeTutorial userName={user.name} onFinish={() => navigate('/home', { replace: true })} />}
    </div>
  )
}
