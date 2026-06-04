import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Clock3, MapPin, User, X } from 'lucide-react'
import { fetchPolicyChecklist, fetchProfile, fetchSavedPolicies, saveCheckedItems } from '../lib/api'
import { findDisplayName, getKakaoUserName } from '../lib/auth'

function getDday(deadlineStr) {
  if (!deadlineStr) return 'D-0'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(deadlineStr)
  if (Number.isNaN(deadline.getTime())) return 'D-0'
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

function formatLastDiagnosis() {
  const raw = localStorage.getItem('lastDiagnosisDate')
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  const ago = days === 0 ? '오늘' : `${days}일 전`
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} (${ago})`
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

const defaultChecklistItems = [
  { id: 'home-0', label: '사회복지서비스 및 급여제공(변경) 신청서', persistable: false },
  { id: 'home-1', label: '사회복지서비스 이용권(바우처) 제공(변경) 신청서', persistable: false },
  { id: 'home-2', label: '아이사랑 카드발급 신청 및 개인신용정보의 조회·제공·이용 동의서', persistable: false },
]

function normalizeChecklistItems(data) {
  const raw = Array.isArray(data) ? data : (data?.checklist || data?.data || [])
  if (!Array.isArray(raw)) return []
  return raw
    .map(item => ({
      id: item.id,
      order: item.order ?? 0,
      label: item.label,
      persistable: item.id !== null && item.id !== undefined,
    }))
    .filter(item => item.id !== null && item.id !== undefined && item.label)
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

function TodayChecklist({ policy, userName, navigate }) {
  const [items, setItems] = useState(defaultChecklistItems)
  const [checked, setChecked] = useState({})
  const [completeAnimation, setCompleteAnimation] = useState(false)
  const visibleItems = items.slice(0, 3)
  const done = visibleItems.filter(item => !!checked[item.id]).length
  const total = visibleItems.length
  const deadlineText = getDeadlineText(policy?.deadline)

  useEffect(() => {
    let active = true
    setItems(defaultChecklistItems)
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
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [policy])

  useEffect(() => {
    if (total === 0 || done !== total) return undefined
    setCompleteAnimation(true)
    const timer = window.setTimeout(() => setCompleteAnimation(false), 760)
    return () => window.clearTimeout(timer)
  }, [done, total])

  const toggleItem = async (item) => {
    const next = { ...checked, [item.id]: !checked[item.id] }
    setChecked(next)
    if (policy?.id) localStorage.setItem(`checklist-checked-${policy.id}`, JSON.stringify(next))

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <button type="button" aria-label="프로필 수정" onClick={() => navigate('/basic-info')} style={{ width: 38, height: 38, marginLeft: 'auto', border: 'none', borderRadius: '50%', background: '#FFFFFF', color: '#1f2433', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <User size={20} strokeWidth={2.3} />
        </button>
      </div>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1f2433', letterSpacing: '-0.3px', lineHeight: 1.35 }}>{userName || '00'}님의 오늘의 맞춤 일정</h1>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          마감 임박! 신청 전에 꼭 챙겨야 할 것들이에요
        </p>
      </div>
      <style>{`
        @keyframes homeChecklistComplete {
          0% { transform: translateY(0) rotateX(0deg); }
          36% { transform: translateY(-12px) rotateX(8deg); }
          68% { transform: translateY(6px) rotateX(-3deg); }
          100% { transform: translateY(0) rotateX(0deg); }
        }
      `}</style>
      <div
        style={{
          background: '#fff',
          border: `1px solid ${done === total ? 'rgba(7,104,24,0.24)' : 'rgba(218,231,211,0.95)'}`,
          borderRadius: 24,
          overflow: 'hidden',
          transformOrigin: 'center center',
          animation: completeAnimation ? 'homeChecklistComplete 0.76s cubic-bezier(0.2, 0.9, 0.2, 1)' : 'none',
          transition: 'border-color 0.18s ease',
          willChange: completeAnimation ? 'transform' : 'auto',
        }}
      >
        <button type="button" onClick={() => policy?.id && navigate(`/checklist?policyId=${encodeURIComponent(policy.id)}`, { state: { grant: policy } })} style={{ width: '100%', border: 'none', background: '#e8f3e8', padding: '14px 16px 12px', textAlign: 'left', cursor: policy?.id ? 'pointer' : 'default', fontFamily: 'inherit' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#1f2433', lineHeight: 1.35, wordBreak: 'keep-all' }}>
            {policy?.title || '귀농인의 집 (충청북도)'}
          </p>
          <p style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: '#5a7a5e', lineHeight: 1.25 }}>
            {deadlineText}
          </p>
        </button>
        <div style={{ padding: '12px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#c2185b' }}>준비 항목</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: done === total ? '#076818' : '#aaa' }}>{done}/{total}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visibleItems.map(item => (
              <HomeCheckItem key={item.id} item={item} checked={!!checked[item.id]} onToggle={() => toggleItem(item)} />
            ))}
          </div>
        </div>
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
  const isCompleted = status === '신청완료'
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
        {isCompleted && <button type="button" onClick={() => navigate('/map', { state: { policy } })} style={{ flex: 1, minHeight: 46, borderRadius: 999, border: '1.5px solid #076818', background: '#fff', color: '#076818', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>사용처 보기</button>}
      </div>
    </div>
  )
}

function ProfileCard({ user, navigate }) {
  const lastDiagnosis = formatLastDiagnosis()
  return (
    <section style={{ background: '#fff', border: '1px solid rgba(218,231,211,0.95)', borderRadius: 30, padding: '20px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#8a8a8a', marginTop: 4 }}><MapPin size={13} /> {user.region || '지역 미등록'} 거주</p>
        </div>
        <button type="button" onClick={() => navigate('/basic-info')} style={{ border: 'none', borderRadius: 999, background: '#e8f3e8', color: '#076818', padding: '8px 12px', fontSize: 12, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>프로필 정보</button>
      </div>
      {lastDiagnosis && <p style={{ fontSize: 12, color: '#666', marginTop: 18 }}>최종 진단 : {lastDiagnosis}</p>}
      <button type="button" onClick={() => navigate('/step1')} style={{ width: '100%', minHeight: 48, border: 'none', borderRadius: 999, background: '#076818', color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', marginTop: 10 }}>나의 맞춤 지원금 다시 찾기</button>
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
  const [user, setUser] = useState({ name: '', region: '' })

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
  const todayPolicy = activePolicies[0] || policies[0]

  return (
    <div style={{ minHeight: '100vh', background: '#FDFCF8', overflowX: 'hidden' }}>
      <div style={{ padding: '26px 18px 116px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <TodayChecklist policy={todayPolicy} userName={user.name} navigate={navigate} />
        <SummaryCard counts={counts} navigate={navigate} />
        <section>
          <SectionTitle>신청 진행 중</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activePolicies.length > 0 ? activePolicies.slice(0, 2).map(policy => <ActivePolicyCard key={policy.id} policy={policy} navigate={navigate} />) : (
              <div style={{ background: '#fff', border: '1px solid rgba(218,231,211,0.95)', borderRadius: 26, padding: '20px 18px', color: '#666', fontSize: 14, fontWeight: 700 }}>
                아직 저장된 지원 현황이 없어요.
              </div>
            )}
          </div>
        </section>
        <ProfileCard user={user} navigate={navigate} />
      </div>
    </div>
  )
}
