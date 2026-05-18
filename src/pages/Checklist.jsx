import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, MapPin, Phone, Clock } from 'lucide-react'
import TopBar from '../components/TopBar'

const accentColor = '#c2185b'

const sections = [
  {
    title: '신청 요건',
    items: ['귀농교육 100시간 이상 이수'],
    link: { label: '교육이수 페이지 바로가기', href: '#' },
  },
  {
    title: '제출 서류',
    items: ['주민등록등본', '귀농교육 이수서', '소득분위 증명서'],
  },
  {
    title: '필요 물건',
    items: ['신분증', '인감도장'],
  },
]

const office = {
  name: '청산면 행정복지센터',
  address: '충북 옥천군 청산면 청산로 71 청산면행정복지센터',
  phone: '043-730-XXXX',
  hours: '평일 09:00~18:00',
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

const OFFICE_LAT = 36.2614
const OFFICE_LNG = 127.6413

function OfficeMap() {
  const mapRef = useRef(null)

  useEffect(() => {
    const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
    const scriptId = 'kakao-map-sdk'

    const initMap = () => {
      window.kakao.maps.load(() => {
        const container = mapRef.current
        if (!container) return
        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(OFFICE_LAT, OFFICE_LNG),
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
          position: new window.kakao.maps.LatLng(OFFICE_LAT, OFFICE_LNG),
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
  }, [])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}

export default function Checklist() {
  const navigate = useNavigate()
  const [checked, setChecked] = useState({})

  const toggle = (key) => setChecked(p => ({ ...p, [key]: !p[key] }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>
      <TopBar title="준비물 확인" onBack={() => navigate(-1)} />

      <p style={{
        fontSize: 14, color: '#888', textAlign: 'center',
        letterSpacing: '-0.1px', padding: '4px 0 20px',
      }}>
        주민센터 방문 전 놓친 것이 있나 확인해보세요
      </p>

      <div style={{ padding: '0 18px 100px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {sections.map((section, si) => (
          <div key={section.title}>
            <div style={{
              background: '#fff', borderRadius: 18,
              border: '1.5px solid #e8e8e8',
              padding: '16px 18px',
            }}>
              <p style={{
                fontSize: 14, fontWeight: 700, color: accentColor,
                letterSpacing: '-0.2px', marginBottom: 12,
              }}>
                {section.title}
              </p>
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
                <a
                  href={section.link.href}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 13, fontWeight: 500, color: '#888',
                    textDecoration: 'none', marginTop: 10,
                  }}
                >
                  {section.link.label}
                  <ArrowUpRight size={14} color="#888" strokeWidth={2} />
                </a>
              )}
            </div>

            {si < sections.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                <ArrowDown size={18} color="#ccc" strokeWidth={2} />
              </div>
            )}
          </div>
        ))}

        {/* divider arrow */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
          <ArrowDown size={18} color="#ccc" strokeWidth={2} />
        </div>

        {/* Office card */}
        <div style={{
          background: '#fff', borderRadius: 18,
          border: '1.5px solid #e8e8e8',
          overflow: 'hidden',
        }}>
          <p style={{
            fontSize: 14, fontWeight: 700, color: accentColor,
            letterSpacing: '-0.2px', padding: '16px 18px 12px',
          }}>
            행정복지센터 방문하기
          </p>

          {/* Map */}
          <div style={{
            margin: '0 18px 14px',
            height: 160,
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <OfficeMap />
          </div>

          <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.2px' }}>
              {office.name}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { Icon: MapPin, label: '주소', value: office.address },
                { Icon: Phone, label: '연락처', value: office.phone },
                { Icon: Clock, label: '운영시간', value: office.hours },
              ].map(({ Icon, label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#888', letterSpacing: '-0.1px', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px', lineHeight: 1.5 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
