import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import TopBar from '../components/TopBar'
import { fetchPolicyChecklist } from '../lib/api'

const accentColor = '#c2185b'

const sectionTitleMap = {
  requirements: '신청 요건',
  requirement: '신청 요건',
  qualifications: '신청 요건',
  documents: '제출 서류',
  document: '제출 서류',
  required_documents: '제출 서류',
  submission_documents: '제출 서류',
  supplies: '필요 물건',
  items: '필요 물건',
  materials: '필요 물건',
  required_items: '필요 물건',
  belongings: '필요 물건',
}

function itemLabel(item) {
  if (typeof item === 'string') return item
  return item?.label || item?.title || item?.name || item?.text || item?.content || ''
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return []
  return items.map(itemLabel).filter(Boolean)
}

function normalizeChecklistResponse(data) {
  const payload = data?.checklist || data?.data || data
  const rawSections = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.sections)
      ? payload.sections
      : null

  if (rawSections) {
    const flatItems = rawSections
      .filter(item => item && typeof item === 'object' && !Array.isArray(item) && !item.items && !item.checklist)
      .map(item => ({
        category: item.category || item.type || 'items',
        label: itemLabel(item),
      }))
      .filter(item => item.label)

    if (flatItems.length === rawSections.length) {
      const grouped = flatItems.reduce((acc, item) => {
        const title = sectionTitleMap[item.category] || item.category || '준비 항목'
        acc[title] = [...(acc[title] || []), item.label]
        return acc
      }, {})
      const normalized = Object.entries(grouped).map(([title, items]) => ({ title, items }))
      if (normalized.length > 0) return normalized
    }

    const normalized = rawSections.map((section, index) => {
      if (typeof section === 'string') {
        return { title: index === 0 ? '준비 항목' : `준비 항목 ${index + 1}`, items: [section] }
      }
      return {
        title: section.title || section.name || sectionTitleMap[section.category] || sectionTitleMap[section.type] || section.category || `준비 항목 ${index + 1}`,
        items: normalizeItems(section.items || section.checklist || section.values || section.documents || section.requirements),
        link: section.link || section.url ? { label: section.link_label || '관련 페이지 바로가기', href: section.link || section.url } : undefined,
      }
    }).filter(section => section.items.length > 0)
    if (normalized.length > 0) return normalized
  }

  if (payload && typeof payload === 'object') {
    const grouped = Object.entries(sectionTitleMap).reduce((acc, [key, title]) => {
      const items = normalizeItems(payload[key])
      if (items.length > 0) acc[title] = [...(acc[title] || []), ...items]
      return acc
    }, {})
    const normalized = Object.entries(grouped).map(([title, items]) => ({ title, items }))
    if (normalized.length > 0) return normalized
  }

  return []
}

function normalizeOffice(data) {
  const payload = data?.office || data?.center || data?.agency_office || data?.visit_office
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
  const [error, setError] = useState('')
  const [checked, setChecked] = useState({})

  const toggle = (key) => setChecked(p => ({ ...p, [key]: !p[key] }))

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
    setError('')
    fetchPolicyChecklist(policyId)
      .then(data => {
        if (!active) return
        setChecklistSections(normalizeChecklistResponse(data))
        setOfficeInfo(normalizeOffice(data))
      })
      .catch(err => {
        if (!active) return
        setError(err.message || '체크리스트를 불러오지 못했습니다.')
        setChecklistSections([])
        setOfficeInfo(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

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

      <div style={{ padding: '0 18px 100px' }}>
        {loading && (
          <p style={{ fontSize: 14, fontWeight: 600, color: '#888', textAlign: 'center', padding: '24px 0' }}>
            체크리스트를 불러오는 중입니다.
          </p>
        )}
        {!loading && error && (
          <p style={{ fontSize: 13, fontWeight: 700, color: '#d93025', textAlign: 'center', lineHeight: 1.45, padding: '14px 0 20px' }}>
            {error}
          </p>
        )}
        {!loading && !error && checklistSections.length === 0 && !officeInfo && (
          <p style={{ fontSize: 14, fontWeight: 600, color: '#666', textAlign: 'center', lineHeight: 1.5, padding: '24px 0' }}>
            등록된 체크리스트 정보가 없습니다.
          </p>
        )}
        {/* Section steps */}
        {!loading && checklistSections.map((section, si) => {
          const done = section.items.filter(item => !!checked[`${si}-${item}`]).length
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
              <div style={{ flex: 1, width: 2, background: '#e8e8e8', margin: '4px 0' }} />
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
                      key={item}
                      label={item}
                      checked={!!checked[`${si}-${item}`]}
                      onToggle={() => toggle(`${si}-${item}`)}
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
        {!loading && officeInfo && (
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
    </div>
  )
}
