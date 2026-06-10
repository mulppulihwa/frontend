import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, ChevronRight, Clock3, MapPin, User, X } from 'lucide-react'
import { fetchPlaces, fetchPolicyChecklist, fetchProfile, fetchSavedPolicies, saveCheckedItems } from '../lib/api'
import { findDisplayName, getKakaoUserName } from '../lib/auth'
import { getPlaceCategoryMeta } from '../lib/placeCategories'
import { filterPlacesByPolicy } from '../lib/placePolicyFilter'

const OKCHEON_CENTER = { lat: 36.3063, lng: 127.5718 }
const HOME_CHECKLIST_CACHE_KEY = 'home-checklist-items'

function getDday(deadlineStr) {
  if (!deadlineStr) return '-'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(deadlineStr)
  if (Number.isNaN(deadline.getTime())) return '-'
  const diff = Math.ceil((deadline - today) / 86400000)
  if (diff === 0) return 'D-DAY'
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`
}

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

function MiniRing({ done = 0, total = 0 }) {
  const r = 10
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  const complete = total > 0 && done >= total
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      {complete ? (
        <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#076818', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={17} color="#fff" strokeWidth={2.8} />
        </span>
      ) : (
        <svg width="30" height="30" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r={r} fill="none" stroke="#e8e8e8" strokeWidth="3" />
          <circle cx="15" cy="15" r={r} fill="none" stroke="#FFA100" strokeWidth="3" strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 15 15)" />
        </svg>
      )}
      <span style={{ fontSize: 10, fontWeight: 600, color: complete ? '#076818' : '#888' }}>준비물 {done}/{total}</span>
    </div>
  )
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1f2433', letterSpacing: '-0.3px' }}>{children}</h2>
      {action}
    </div>
  )
}

function SummaryTile({ label, value, color, bar }) {
  return (
    <div style={{
      minWidth: 0,
      minHeight: 86,
      borderRadius: 18,
      background: '#FFFFFF',
      border: '1px solid rgba(218,231,211,0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 4px',
      boxSizing: 'border-box',
    }}>
      <span style={{ width: 28, height: 5, borderRadius: 999, background: bar, marginBottom: 10 }} />
      <strong style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color }}>{value}</strong>
      <span style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: '#777', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

function SummaryCard({ counts, navigate }) {
  const total = counts.completed + counts.planned + counts.ignored + counts.unset
  return (
    <section>
      <SectionTitle action={<button type="button" onClick={() => navigate('/grant-status')} style={{ display: 'flex', alignItems: 'center', gap: 2, border: 'none', background: '#fff', borderRadius: 999, padding: '8px 10px 8px 13px', color: '#888', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>전체 보기 <ChevronRight size={14} /></button>}>
        진단 받은 정책
      </SectionTitle>
      <div style={{ background: '#fff', border: '1px solid rgba(218,231,211,0.95)', borderRadius: 30, padding: 18 }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, background: 'linear-gradient(135deg, #e8f3e8 0%, #fff7e8 100%)', padding: '20px 18px 22px', marginBottom: 12 }}>
          <div style={{ position: 'absolute', right: 22, bottom: 24, display: 'flex', alignItems: 'flex-end', gap: 7, opacity: 0.32 }}>
            {[32, 46, 40, 56, 72].map((height, index) => <span key={height} style={{ width: 9, height, borderRadius: 999, background: index === 4 ? '#FFA100' : '#076818', display: 'block' }} />)}
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#5a7a5e', marginBottom: 8 }}>진단 받은 정책</p>
          <p style={{ fontSize: 42, fontWeight: 800, color: '#1f2433', lineHeight: 1 }}>{total}건</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, calc((100% - 24px) / 4))', justifyContent: 'center', gap: 8 }}>
          <SummaryTile label="완료" value={counts.completed} color="#076818" bar="#e8f3e8" />
          <SummaryTile label="예정" value={counts.planned} color="#FFA100" bar="#fff3e0" />
          <SummaryTile label="관심 없음" value={counts.ignored} color="#d93025" bar="#fff0ef" />
        </div>
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
    <section>
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
                {items.map(item => (
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
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1f2433' }}>미완성 체크리스트 정책이 없습니다.</p>
            <p style={{ marginTop: 6, fontSize: 12, fontWeight: 500, color: '#888' }}>모든 준비 항목을 확인했어요.</p>
          </div>
        )}
      </div>
    </section>
  )
}

const statusMeta = {
  신청완료: { label: '신청 완료', color: '#076818', bg: '#e8f3e8', Icon: Check },
  신청예정: { label: '신청 예정', color: '#FFA100', bg: '#fff3e0', Icon: Clock3 },
  관심없음: { label: '관심 없음', color: '#d93025', bg: '#fff0ef', Icon: X },
}

function ActivePolicyCard({ policy, navigate }) {
  const status = policy.user_status || policy.status
  const cfg = statusMeta[status] || { label: '미입력', color: '#8a8a8a', bg: '#f5f3ef', Icon: Clock3 }
  const Icon = cfg.Icon
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(218,231,211,0.95)', borderRadius: 26, padding: '16px 16px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <p style={{ width: 52, fontSize: 13, fontWeight: 800, color: '#d93025', flexShrink: 0 }}>{getDday(policy.deadline)}</p>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1f2433', marginBottom: 6, wordBreak: 'keep-all' }}>{policy.title}</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 999, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 800 }}>
            <Icon size={11} strokeWidth={2.5} /> {cfg.label}
          </span>
        </div>
        <MiniRing done={policy.checkDone} total={policy.checkTotal} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button type="button" onClick={() => navigate(`/checklist?policyId=${encodeURIComponent(policy.id)}`, { state: { grant: policy } })} style={{ flex: 1, minHeight: 46, borderRadius: 999, border: 'none', background: '#076818', color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>준비물 확인 →</button>
        <button type="button" onClick={() => navigate('/map', { state: { policy } })} style={{ flex: 1, minHeight: 46, borderRadius: 999, border: '1.5px solid #076818', background: '#fff', color: '#076818', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>사용처 보기</button>
      </div>
    </div>
  )
}

function PlacesMapPreview({ policy, places, navigate }) {
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const policyPlaces = policy ? filterPlacesByPolicy(places, policy) : places
  const relatedPlaces = policyPlaces.length > 0 ? policyPlaces : places
  const mapPlaces = relatedPlaces.filter(place => Number.isFinite(place.lat) && Number.isFinite(place.lng)).slice(0, 5)
  const featuredPlace = mapPlaces[0] || relatedPlaces[0] || null
  const featuredMeta = getPlaceCategoryMeta(featuredPlace?.category)
  const FeaturedIcon = featuredMeta.icon
  const openMap = () => navigate('/map', { state: policy ? { policy } : undefined })

  useEffect(() => {
    const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
    const scriptId = 'kakao-map-sdk'
    if (!KAKAO_KEY || !mapRef.current) return undefined

    let active = true

    const clearMarkers = () => {
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
    }

    const initMap = () => {
      if (!active || !mapRef.current || !window.kakao?.maps) return
      window.kakao.maps.load(() => {
        if (!active || !mapRef.current) return
        clearMarkers()
        const centerPlace = mapPlaces[0]
        const center = new window.kakao.maps.LatLng(
          centerPlace?.lat || OKCHEON_CENTER.lat,
          centerPlace?.lng || OKCHEON_CENTER.lng,
        )
        const map = new window.kakao.maps.Map(mapRef.current, { center, level: mapPlaces.length > 1 ? 6 : 4 })
        map.setDraggable(false)
        map.setZoomable(false)

        const bounds = new window.kakao.maps.LatLngBounds()
        mapPlaces.forEach((place, index) => {
          const position = new window.kakao.maps.LatLng(place.lat, place.lng)
          bounds.extend(position)
          const color = ['#076818', '#FFA100', '#c2185b', '#4b7bec', '#2f8f83'][index % 5]
          const svg = `<svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
            <filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.22"/></filter>
            <path d="M17 2C10.4 2 5 7.4 5 14c0 9.2 12 25.5 12 25.5S29 23.2 29 14C29 7.4 23.6 2 17 2z" fill="${color}" filter="url(#s)"/>
            <circle cx="17" cy="14" r="5.5" fill="white"/>
          </svg>`
          const markerImage = new window.kakao.maps.MarkerImage(
            `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
            new window.kakao.maps.Size(34, 42),
            { offset: new window.kakao.maps.Point(17, 42) },
          )
          markersRef.current.push(new window.kakao.maps.Marker({ position, image: markerImage, map }))
        })
        if (mapPlaces.length > 1) map.setBounds(bounds)
      })
    }

    if (window.kakao?.maps) {
      initMap()
    } else {
      const existing = document.getElementById(scriptId)
      if (existing) {
        existing.addEventListener('load', initMap)
      } else {
        const script = document.createElement('script')
        script.id = scriptId
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=services`
        script.onload = initMap
        document.head.appendChild(script)
      }
    }

    return () => {
      active = false
      clearMarkers()
      document.getElementById(scriptId)?.removeEventListener('load', initMap)
    }
  }, [mapPlaces, policy])

  return (
    <section>
      <SectionTitle>
        우리 마을 곳곳 사용처
      </SectionTitle>
      <div
        role="button"
        tabIndex={0}
        onClick={openMap}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openMap()
          }
        }}
        style={{
          width: '100%',
          border: '1px solid rgba(218,231,211,0.95)',
          borderRadius: 26,
          background: '#FFFFFF',
          padding: 0,
          overflow: 'hidden',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <div style={{ background: '#FFFFFF', overflow: 'hidden' }}>
          <div style={{ position: 'relative', height: 210, overflow: 'hidden' }}>
          <div ref={mapRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          {mapPlaces.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777', fontSize: 13, fontWeight: 700 }}>
              사용처 지도를 불러오는 중이에요
            </div>
          )}
            <div style={{ position: 'absolute', left: 14, top: 14, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 999, background: '#FFFFFF', border: '1.5px solid #076818', color: '#076818', fontSize: 12, fontWeight: 800, boxShadow: '0 4px 14px rgba(31,36,51,0.10)' }}>
              <FeaturedIcon size={15} strokeWidth={2.3} />
              {featuredMeta.label || '사용처'}
            </div>
          </div>
          <div style={{ margin: '-18px 12px 14px', position: 'relative', zIndex: 2, borderRadius: 22, background: '#FFFFFF', border: '1.5px solid #e8e8e8', boxShadow: '0 -4px 18px rgba(31,36,51,0.08)', padding: '12px 12px 13px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: '#e2e2e2', margin: '0 auto 10px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#888' }}>
                {relatedPlaces.length || places.length}개 장소
              </p>
            </div>
            {featuredPlace ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, padding: '12px 10px', borderRadius: 18, border: '1.5px solid #ededed', background: '#FFFFFF' }}>
                <span style={{ width: 42, height: 42, borderRadius: 14, background: featuredMeta.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FeaturedIcon size={21} color={featuredMeta.color} strokeWidth={2.4} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#1f2433', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{featuredPlace.name}</p>
                  <p style={{ marginTop: 4, fontSize: 12, fontWeight: 400, color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{featuredPlace.address || '주소 확인 필요'}</p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, fontWeight: 700, color: '#777', textAlign: 'center', padding: '12px 0' }}>
                사용처를 지도에서 확인해보세요
              </p>
            )}
          </div>
        </div>
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

export default function Home() {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState([])
  const [selectedPolicyId, setSelectedPolicyId] = useState(null)
  const [user, setUser] = useState(() => ({
    name: getKakaoUserName(),
    region: readJsonSafe('submittedDiagnosisProfile').location || '',
  }))
  const [places, setPlaces] = useState([])
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
    fetchPlaces()
      .then(nextPlaces => {
        if (active) setPlaces(nextPlaces)
      })
      .catch(() => {})
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

  const counts = {
    completed: policies.filter(policy => (policy.user_status || policy.status) === '신청완료').length,
    planned: policies.filter(policy => (policy.user_status || policy.status) === '신청예정').length,
    ignored: policies.filter(policy => (policy.user_status || policy.status) === '관심없음').length,
    unset: policies.filter(policy => !(policy.user_status || policy.status)).length,
  }
  const activePolicies = policies.filter(policy => {
    const status = policy.user_status || policy.status
    return status === '신청완료' || status === '신청예정'
  })
  const urgentPolicy = [...activePolicies].sort(compareDeadlineUrgency)[0]
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
        <SummaryCard counts={counts} navigate={navigate} />
        {urgentPolicy && (
          <section>
            <SectionTitle>신청 진행 중</SectionTitle>
            <ActivePolicyCard policy={urgentPolicy} navigate={navigate} />
          </section>
        )}
        <PlacesMapPreview policy={urgentPolicy} places={places} navigate={navigate} />
      </div>
    </div>
  )
}
