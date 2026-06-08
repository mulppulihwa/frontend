import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, ChevronRight, Clock3, MapPin, Navigation, User, X } from 'lucide-react'
import { fetchPlaces, fetchPolicyChecklist, fetchProfile, fetchSavedPolicies, saveCheckedItems } from '../lib/api'
import { findDisplayName, getKakaoUserName } from '../lib/auth'
import { filterPlacesByPolicy } from '../lib/placePolicyFilter'

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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <svg width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r={r} fill="none" stroke="#e8e8e8" strokeWidth="3" />
        <circle cx="15" cy="15" r={r} fill="none" stroke="#FFA100" strokeWidth="3" strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 15 15)" />
      </svg>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#888' }}>준비물 {done}/{total}</span>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
          <SummaryTile label="완료" value={counts.completed} color="#076818" bar="#e8f3e8" />
          <SummaryTile label="예정" value={counts.planned} color="#FFA100" bar="#fff3e0" />
          <SummaryTile label="관심 없음" value={counts.ignored} color="#d93025" bar="#fff0ef" />
          <SummaryTile label="미입력" value={counts.unset} color="#8a8a8a" bar="#f0efec" />
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

function loadStoredChecks(policy) {
  if (policy?.checked_items?.length) {
    return policy.checked_items.reduce((acc, id) => ({ ...acc, [id]: true }), {})
  }
  if (!policy?.id) return {}
  try {
    return JSON.parse(localStorage.getItem(`checklist-checked-${policy.id}`) || '{}')
  } catch {
    return {}
  }
}

function getStoredChecklistProgress(policy) {
  if (!policy?.id) return { done: 0, total: 0, complete: false }
  const checked = loadStoredChecks(policy)
  const done = Object.values(checked).filter(Boolean).length
  const total = Number(localStorage.getItem(`home-checklist-total-${policy.id}`)) || Math.min(Number(localStorage.getItem(`checklist-total-${policy.id}`)) || Number(policy.checkTotal) || 0, 3)
  return { done, total, complete: total > 0 && done >= total }
}

function readHomeChecklistCompleted() {
  return readJsonSafe('home-checklist-completed')
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

function TodayChecklist({ policy, userName, navigate, onComplete, onEmptyChecklist }) {
  const [items, setItems] = useState([])
  const [checked, setChecked] = useState({})
  const [completeAnimation, setCompleteAnimation] = useState(false)
  const completedPolicyIdRef = useRef(null)
  const [scheduleMessage] = useState(() => homeScheduleMessages[Math.floor(Math.random() * homeScheduleMessages.length)])
  const visibleItems = items.slice(0, 3)
  const done = visibleItems.filter(item => !!checked[item.id]).length
  const total = visibleItems.length
  const deadlineText = getDeadlineText(policy?.deadline)
  const dday = getDday(policy?.deadline)

  useEffect(() => {
    let active = true
    completedPolicyIdRef.current = null
    setItems([])
    setChecked(loadStoredChecks(policy))

    if (!policy?.id) {
      return () => {
        active = false
      }
    }

    fetchPolicyChecklist(policy.id)
      .then(data => {
        if (!active) return
        const nextItems = normalizeChecklistItems(data)
        if (nextItems.length > 0) {
          setItems(nextItems)
          localStorage.setItem(`checklist-total-${policy.id}`, nextItems.length)
          localStorage.setItem(`home-checklist-total-${policy.id}`, Math.min(nextItems.length, 3))
        } else {
          onEmptyChecklist?.(policy)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [onEmptyChecklist, policy])

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
      `}</style>
      {policy?.id && (
        <div
          style={{
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
              {dday !== '-' && (
                <span style={{ fontSize: 13, fontWeight: 800, color: '#d93025', lineHeight: 1.25 }}>
                  {dday}
                </span>
              )}
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
      )}
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
  const relatedPlaces = policy ? filterPlacesByPolicy(places, policy) : places
  const previewPlaces = relatedPlaces.slice(0, 3)
  return (
    <section>
      <SectionTitle
        action={(
          <button
            type="button"
            onClick={() => navigate('/map', { state: policy ? { policy } : undefined })}
            style={{ display: 'flex', alignItems: 'center', gap: 2, border: 'none', background: '#fff', borderRadius: 999, padding: '8px 10px 8px 13px', color: '#888', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            전체 보기 <ChevronRight size={14} />
          </button>
        )}
      >
        우리 마을 곳곳 사용처
      </SectionTitle>
      <button
        type="button"
        onClick={() => navigate('/map', { state: policy ? { policy } : undefined })}
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
        <div style={{ position: 'relative', height: 150, background: '#eef6ea', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.9 }}>
            <span style={{ position: 'absolute', left: '-12%', top: 34, width: '124%', height: 34, borderRadius: 999, background: '#dfeede', transform: 'rotate(-7deg)' }} />
            <span style={{ position: 'absolute', left: '-10%', top: 92, width: '118%', height: 28, borderRadius: 999, background: '#fff4de', transform: 'rotate(11deg)' }} />
            <span style={{ position: 'absolute', left: 46, top: -24, width: 82, height: 210, borderRadius: 999, border: '16px solid rgba(255,255,255,0.72)', transform: 'rotate(35deg)' }} />
            <span style={{ position: 'absolute', right: -22, top: 12, width: 120, height: 120, borderRadius: '50%', background: 'rgba(7,104,24,0.08)' }} />
          </div>
          {[
            { left: '20%', top: '32%', color: '#076818' },
            { left: '56%', top: '24%', color: '#FFA100' },
            { left: '74%', top: '58%', color: '#c2185b' },
          ].map((pin, index) => (
            <span
              key={index}
              style={{
                position: 'absolute',
                left: pin.left,
                top: pin.top,
                width: 34,
                height: 34,
                borderRadius: '50% 50% 50% 0',
                background: pin.color,
                transform: 'rotate(-45deg)',
                boxShadow: '0 6px 16px rgba(31,36,51,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', display: 'block' }} />
            </span>
          ))}
          <div style={{ position: 'absolute', left: 14, bottom: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', color: '#076818', fontSize: 12, fontWeight: 800 }}>
            <MapPin size={14} strokeWidth={2.4} />
            {relatedPlaces.length || places.length}개 장소
          </div>
        </div>
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {previewPlaces.length > 0 ? previewPlaces.map(place => (
            <div key={place.id} style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: '#e8f3e8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={16} color="#076818" strokeWidth={2.4} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#1f2433', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</p>
                <p style={{ marginTop: 2, fontSize: 11, fontWeight: 500, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.address || '주소 확인 필요'}</p>
              </div>
            </div>
          )) : (
            <p style={{ fontSize: 13, fontWeight: 700, color: '#777', textAlign: 'center', padding: '8px 0' }}>
              사용처를 지도에서 확인해보세요
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, borderRadius: 999, border: '1.5px solid #076818', color: '#076818', fontSize: 14, fontWeight: 800 }}>
            <Navigation size={15} strokeWidth={2.4} />
            지도에서 보기
          </div>
        </div>
      </button>
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
  const [user, setUser] = useState({ name: '', region: '' })
  const [places, setPlaces] = useState([])
  const [homeChecklistCompleted, setHomeChecklistCompleted] = useState(() => readHomeChecklistCompleted())
  const [emptyChecklistPolicyIds, setEmptyChecklistPolicyIds] = useState({})

  useEffect(() => {
    let active = true
    fetchProfile()
      .then(profile => {
        if (active) setUser(normalizeUser(profile))
      })
      .catch(() => setUser({ name: getKakaoUserName(), region: readJsonSafe('submittedDiagnosisProfile').location || '' }))
    fetchSavedPolicies()
      .then(savedPolicies => {
        if (active) setPolicies(savedPolicies)
      })
      .catch(() => {})
    fetchPlaces()
      .then(nextPlaces => {
        if (active) setPlaces(nextPlaces)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

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
  const isHomeChecklistComplete = (policy, completedMap = homeChecklistCompleted) => (
    Boolean(completedMap[String(policy?.id)]) || getStoredChecklistProgress(policy).complete
  )
  const isEmptyChecklistPolicy = policy => Boolean(emptyChecklistPolicyIds[String(policy?.id)])
  const hasKnownChecklistItems = policy => getStoredChecklistProgress(policy).total > 0
  const isUnfinishedChecklistPolicy = policy => !isEmptyChecklistPolicy(policy) && !isHomeChecklistComplete(policy)
  const selectedPolicy = checklistPolicies.find(policy => String(policy.id) === String(selectedPolicyId) && isUnfinishedChecklistPolicy(policy))
  const firstUnfinishedWithItems = checklistPolicies.find(policy => isUnfinishedChecklistPolicy(policy) && hasKnownChecklistItems(policy))
  const firstUnfinishedPolicy = checklistPolicies.find(isUnfinishedChecklistPolicy)
  const todayPolicy = selectedPolicy || firstUnfinishedWithItems || firstUnfinishedPolicy || checklistPolicies.find(policy => !isEmptyChecklistPolicy(policy))

  const handleChecklistComplete = (completedPolicy) => {
    if (!completedPolicy?.id) return
    const completedMap = { ...homeChecklistCompleted, [String(completedPolicy.id)]: true }
    setHomeChecklistCompleted(completedMap)
    localStorage.setItem('home-checklist-completed', JSON.stringify(completedMap))
    const candidates = checklistPolicies.filter(policy => String(policy.id) !== String(completedPolicy?.id) && !isEmptyChecklistPolicy(policy))
    const nextPolicy = candidates.find(policy => !isHomeChecklistComplete(policy, completedMap) && hasKnownChecklistItems(policy))
      || candidates.find(policy => !isHomeChecklistComplete(policy, completedMap))
    if (nextPolicy?.id) setSelectedPolicyId(nextPolicy.id)
    else setSelectedPolicyId(null)
  }

  const handleEmptyChecklist = useCallback((policy) => {
    if (!policy?.id) return
    setEmptyChecklistPolicyIds(prev => ({ ...prev, [String(policy.id)]: true }))
    setSelectedPolicyId(prev => String(prev) === String(policy.id) ? null : prev)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#FDFCF8', overflowX: 'hidden' }}>
      <div style={{ padding: '26px 18px 116px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <TodayChecklist key={todayPolicy?.id || 'empty-checklist'} policy={todayPolicy} userName={user.name} navigate={navigate} onComplete={handleChecklistComplete} onEmptyChecklist={handleEmptyChecklist} />
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
