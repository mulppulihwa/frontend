import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Check } from 'lucide-react'
import TopBar from '../components/TopBar'
import { fetchPolicyChecklist, saveCheckedItems } from '../lib/api'

const accentColor = '#c2185b'

const checklistSectionSources = [
  {
    key: 'requirements',
    title: '신청 요건',
    fields: ['requirements', 'application_requirements', 'eligibility', 'conditions', 'qualification', 'qualifications', '신청 요건', '신청요건'],
  },
  {
    key: 'documents',
    title: '제출 서류',
    fields: ['documents', 'required_documents', 'submission_documents', 'application_documents', 'paperwork', '제출 서류', '제출서류', '신청 서류', '신청서류'],
  },
  {
    key: 'items',
    title: '필요 물건',
    fields: ['items', 'required_items', 'materials', 'preparations', 'things_to_bring', '필요 물건', '필요물건', '준비물'],
  },
  {
    key: 'office',
    title: '행정복지센터 방문하기',
    fields: ['visit', 'visit_office_checklist', 'office_visit', 'administrative_center', '행정복지센터 방문하기', '방문하기'],
  },
]

function firstPresent(source, fields) {
  if (!source || typeof source !== 'object') return undefined
  for (const field of fields) {
    if (source[field] !== undefined && source[field] !== null) return source[field]
  }
  return undefined
}

function normalizeItemLabel(item) {
  if (typeof item === 'string') return item
  if (typeof item === 'number') return String(item)
  if (!item || typeof item !== 'object') return ''
  return item.label || item.title || item.name || item.text || item.content || item.description || item.requirement || item.document || item.item || ''
}

function normalizeChecklistItem(item, sectionKey, index) {
  const label = normalizeItemLabel(item)
  if (!label) return null
  const rawId = item && typeof item === 'object' ? (item.id ?? item.checklist_id ?? item.item_id) : null
  return {
    id: rawId ?? `${sectionKey}-${index}`,
    order: item && typeof item === 'object' ? (item.order ?? item.sort_order ?? index) : index,
    label,
    persistable: rawId !== null && rawId !== undefined,
  }
}

function toChecklistArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map(text => text.replace(/^[-•\d.)\s]+/, '').trim())
      .filter(Boolean)
  }
  if (typeof value === 'object') {
    if (Array.isArray(value.items)) return value.items
    if (Array.isArray(value.results)) return value.results
    if (Array.isArray(value.checklist)) return value.checklist
    return Object.values(value).filter(v => typeof v === 'string')
  }
  return []
}

function looksLikeChecklistItem(item) {
  return Boolean(normalizeItemLabel(item))
}

function normalizeChecklistResponse(data) {
  const payload = data?.checklist && !Array.isArray(data.checklist) ? data.checklist : data
  const source = payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : payload
  const sections = []

  for (const config of checklistSectionSources) {
    const value = firstPresent(source, config.fields)
    const items = toChecklistArray(value)
      .map((item, index) => normalizeChecklistItem(item, config.key, index))
      .filter(Boolean)
      .sort((a, b) => a.order - b.order)
    if (items.length > 0) sections.push({ title: config.title, items })
  }

  if (sections.length > 0) return sections

  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.checklist)
      ? data.checklist
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : []

  if (!Array.isArray(raw) || raw.length === 0) return []

  const grouped = raw.reduce((acc, item, index) => {
    if (!looksLikeChecklistItem(item)) return acc
    const sectionTitle = item.section || item.category || item.group || item.type || '준비 항목'
    if (!acc[sectionTitle]) acc[sectionTitle] = []
    acc[sectionTitle].push(normalizeChecklistItem(item, `flat-${sectionTitle}`, index))
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([title, items]) => ({ title, items: items.filter(Boolean).sort((a, b) => a.order - b.order) }))
    .filter(section => section.items.length > 0)
}

function normalizeOffice(data) {
  const source = data?.checklist && !Array.isArray(data.checklist) ? data.checklist : data
  const payload = source?.office || source?.center || source?.agency_office || source?.visit_office || source?.administrative_center || source?.행정복지센터
  if (!payload || typeof payload !== 'object') return null
  return {
    name: payload.name || payload.title || payload.office_name || '',
    address: payload.address || payload.road_address || '',
    phone: payload.phone || payload.tel || payload.contact || '',
    hours: payload.hours || payload.opening_hours || '',
    lat: Number(payload.lat ?? payload.latitude),
    lng: Number(payload.lng ?? payload.longitude),
  }
}

function CheckItem({ label, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', padding: '2px 0', textAlign: 'left',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        border: `1.5px solid ${checked ? accentColor : '#ccc'}`,
        background: checked ? accentColor : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease',
      }}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.8 7L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{
        fontSize: 14, fontWeight: 400, color: checked ? '#aaa' : '#1a1a1a',
        letterSpacing: '-0.2px',
        textDecoration: checked ? 'line-through' : 'none',
        transition: 'color 0.15s ease',
      }}>
        {label}
      </span>
    </button>
  )
}

function ChecklistProgress({ done, total }) {
  const radius = 13
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? done / total : 0
  const complete = total > 0 && done >= total

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
      {complete ? (
        <span style={{ width: 46, height: 46, borderRadius: '50%', background: '#076818', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={27} color="#FFFFFF" strokeWidth={2.7} />
        </span>
      ) : (
        <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
          <circle cx="23" cy="23" r={radius} fill="none" stroke="#e8e8e8" strokeWidth="5" />
          <circle
            cx="23"
            cy="23"
            r={radius}
            fill="none"
            stroke="#FFA100"
            strokeWidth="5"
            strokeDasharray={`${progress * circumference} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 23 23)"
          />
        </svg>
      )}
      <span style={{ fontSize: 13, fontWeight: 700, color: complete ? '#076818' : '#888' }}>
        준비물 {done}/{total}
      </span>
    </div>
  )
}

function OfficeMap({ officeInfo }) {
  const mapRef = useRef(null)

  useEffect(() => {
    const lat = Number.isFinite(officeInfo.lat) ? officeInfo.lat : 36.2614
    const lng = Number.isFinite(officeInfo.lng) ? officeInfo.lng : 127.6413
    const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
    const scriptId = 'kakao-map-sdk'

    const initMap = () => {
      window.kakao.maps.load(() => {
        const container = mapRef.current
        if (!container) return
        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(lat, lng),
          level: 4,
        })
        const svg = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 2C10.8 2 5 7.8 5 15c0 10 13 27 13 27S31 25 31 15C31 7.8 25.2 2 18 2z" fill="${accentColor}"/>
          <circle cx="18" cy="15" r="6" fill="white"/>
        </svg>`
        const markerImage = new window.kakao.maps.MarkerImage(
          `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
          new window.kakao.maps.Size(36, 44),
          { offset: new window.kakao.maps.Point(18, 44) }
        )
        new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(lat, lng),
          image: markerImage,
          map,
        })
      })
    }

    if (window.kakao?.maps) { initMap(); return }
    if (document.getElementById(scriptId)) {
      document.getElementById(scriptId).addEventListener('load', initMap)
      return
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`
    script.onload = initMap
    document.head.appendChild(script)
  }, [officeInfo.lat, officeInfo.lng])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}

export default function Checklist() {
  const navigate = useNavigate()
  const { state, search } = useLocation()
  const grant = state?.grant
  const policyId = grant?.id || new URLSearchParams(search).get('policyId')
  const [checklistSections, setChecklistSections] = useState([])
  const [officeInfo, setOfficeInfo] = useState(null)
  const [loading, setLoading] = useState(Boolean(policyId))
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const storageKey = policyId ? `checklist-checked-${policyId}` : null
  const [checked, setChecked] = useState(() => {
    // Initialize from grant.checked_items (array of IDs from backend)
    if (grant?.checked_items?.length) {
      return grant.checked_items.reduce((acc, id) => ({ ...acc, [id]: true }), {})
    }
    // Fall back to localStorage
    if (!storageKey) return {}
    try { return JSON.parse(localStorage.getItem(storageKey)) || {} } catch { return {} }
  })
  const checklistItems = checklistSections.flatMap(section => section.items)
  const totalChecklistItems = checklistItems.length
  const completedChecklistItems = checklistItems.filter(item => !!checked[item.id]).length

  const toggle = async (itemId) => {
    const next = { ...checked, [itemId]: !checked[itemId] }
    setChecked(next)
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
    const checkedIds = Object.entries(next)
      .filter(([, v]) => v)
      .map(([k]) => Number(k))
      .filter(id => Number.isFinite(id))
    try { await saveCheckedItems(policyId, checkedIds) } catch { /* saved locally */ }
  }

  useEffect(() => {
    let active = true
    if (!policyId) {
      setError('정책 ID가 없어 체크리스트를 불러올 수 없습니다.')
      setChecklistSections([])
      setOfficeInfo(null)
      setLoading(false)
      return () => {
        active = false
      }
    }

    setLoading(true)
    setParsing(false)
    setError('')

    const MAX_RETRIES = 4
    const RETRY_DELAY = 3000

    const attemptFetch = async (attempt) => {
      try {
        const data = await fetchPolicyChecklist(policyId)
        if (!active) return
        const sections = normalizeChecklistResponse(data)
        if (sections.length === 0 && attempt < MAX_RETRIES) {
          // Backend is still parsing — show "분석 중" and retry
          setParsing(true)
          setLoading(false)
          await new Promise(res => setTimeout(res, RETRY_DELAY))
          if (active) attemptFetch(attempt + 1)
          return
        }
        setParsing(false)
        setChecklistSections(sections)
        setOfficeInfo(normalizeOffice(data))
        const backendChecked = Array.isArray(data?.checked_items) ? data.checked_items : Array.isArray(data?.checkedItems) ? data.checkedItems : []
        if (backendChecked.length > 0) {
          setChecked(prev => {
            const next = backendChecked.reduce((acc, id) => ({ ...acc, [id]: true }), { ...prev })
            if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
            return next
          })
        }
        const total = sections.reduce((sum, s) => sum + s.items.length, 0)
        if (policyId && total > 0) localStorage.setItem(`checklist-total-${policyId}`, total)
        setLoading(false)
      } catch (err) {
        if (!active) return
        setError(err.message || '체크리스트를 불러오지 못했습니다.')
        setChecklistSections([])
        setOfficeInfo(null)
        setParsing(false)
        setLoading(false)
      }
    }

    attemptFetch(0)

    return () => {
      active = false
    }
  }, [policyId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>
      <TopBar title="준비물 확인" onBack={() => navigate(-1)} />

      <p style={{
        fontSize: 14, color: '#888', textAlign: 'center',
        letterSpacing: '-0.1px', padding: '4px 0 20px',
      }}>
        주민센터 방문 전 놓친 것이 있나 확인해보세요
      </p>

      <div style={{ padding: '0 18px 124px' }}>
        {!loading && !parsing && !error && totalChecklistItems > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 8px 14px' }}>
            <ChecklistProgress done={completedChecklistItems} total={totalChecklistItems} />
          </div>
        )}
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
              체크리스트를 불러오는 중이에요
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {parsing && !error && (
          <div style={{
            background: 'transparent',
            border: 'none',
            borderRadius: 28,
            padding: '40px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid rgba(218,231,211,0.9)', borderTopColor: '#076818',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2433', letterSpacing: '-0.2px' }}>
              준비물을 불러오는 중이에요
            </p>
            <p style={{ fontSize: 12, color: '#5a7a5e', letterSpacing: '-0.1px' }}>
              잠시만 기다려 주세요
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {!loading && !parsing && error && (
          <p style={{ fontSize: 13, fontWeight: 700, color: '#d93025', textAlign: 'center', lineHeight: 1.45, padding: '14px 0 20px' }}>
            {error}
          </p>
        )}
        {!loading && !parsing && !error && checklistSections.length === 0 && !officeInfo && (
          <p style={{ fontSize: 14, fontWeight: 600, color: '#666', textAlign: 'center', lineHeight: 1.5, padding: '24px 0' }}>
            등록된 체크리스트 정보가 없습니다.
          </p>
        )}
        {/* Section steps */}
        {!loading && !parsing && checklistSections.map((section) => {
          const done = section.items.filter(item => !!checked[item.id]).length
          const total = section.items.length
          const complete = done === total
          const started = done > 0

          return (
          <div key={section.title} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: '0 14px' }}>
            {/* Stepper left */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {complete ? (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#076818', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : started ? (
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #076818', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#076818' }} />
                </div>
              ) : (
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #e0e0e0', background: '#fff', flexShrink: 0 }} />
              )}
            </div>
            {/* Card */}
            <div style={{ paddingBottom: 16 }}>
              <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e8e8e8', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: accentColor, letterSpacing: '-0.2px' }}>
                    {section.title}
                  </p>
                  <span style={{ fontSize: 12, fontWeight: 600, color: complete ? '#076818' : '#aaa' }}>
                    {done}/{total}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {section.items.map((item) => (
                    <CheckItem
                      key={item.id}
                      label={item.label}
                      checked={!!checked[item.id]}
                      onToggle={() => toggle(item.id)}
                    />
                  ))}
                </div>
                {section.link && (
                  <a href={section.link.href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, color: '#888', textDecoration: 'none', marginTop: 10 }}>
                    {section.link.label}
                    <ArrowUpRight size={14} color="#888" strokeWidth={2} />
                  </a>
                )}
              </div>
            </div>
          </div>
          )
        })}

        {/* Office step */}
        {!loading && !parsing && officeInfo && (
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: '0 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #e0e0e0', background: '#fff', flexShrink: 0 }} />
          </div>
          <div>
            <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e8e8e8', overflow: 'hidden' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: accentColor, letterSpacing: '-0.2px', padding: '16px 18px 12px' }}>
                행정복지센터 방문하기
              </p>
              {(Number.isFinite(officeInfo.lat) && Number.isFinite(officeInfo.lng)) && (
              <div style={{ margin: '0 18px 14px', height: 160, borderRadius: 12, overflow: 'hidden' }}>
                <OfficeMap officeInfo={officeInfo} />
              </div>
              )}
              <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.2px' }}>{officeInfo.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: '주소', value: officeInfo.address },
                    { label: '연락처', value: officeInfo.phone },
                    { label: '운영시간', value: officeInfo.hours },
                  ].filter(item => item.value).map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#888', letterSpacing: '-0.1px', marginBottom: 2 }}>{label}</p>
                      <p style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px', lineHeight: 1.5 }}>{value}</p>
                    </div>
                  ))}
                </div>
                {officeInfo.name && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <a
                    href={`https://map.kakao.com/?q=${encodeURIComponent(officeInfo.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, color: '#888', textDecoration: 'none' }}
                  >
                    지도에서 보기
                    <ArrowUpRight size={14} color="#888" strokeWidth={2} />
                  </a>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {grant && (
        <div style={{
          position: 'fixed',
          left: '50%',
          bottom: 0,
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          padding: '14px 18px 22px',
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, rgba(253,252,248,0) 0%, #FDFCF8 22%, #FDFCF8 100%)',
          display: 'flex',
          gap: 8,
          zIndex: 80,
        }}>
          <button
            type="button"
            onClick={() => navigate('/detail', { state: { grant } })}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: 999,
              border: '1.5px solid #076818',
              background: '#FFFFFF',
              color: '#076818',
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            자세히 보기
          </button>
          <button
            type="button"
            onClick={() => navigate('/map', { state: { policy: grant } })}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: 999,
              border: '1.5px solid #076818',
              background: '#FFFFFF',
              color: '#076818',
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            사용처 보기
          </button>
        </div>
      )}
    </div>
  )
}
