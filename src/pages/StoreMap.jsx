import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown, MapPin, Phone, Navigation, Tractor, Wallet } from 'lucide-react'
import TopBar from '../components/TopBar'

const OKCHEON_CENTER = { lat: 36.3063, lng: 127.5718 }

const categories = [
  { id: 'farm', label: '농기구 구입처', icon: Tractor, color: '#2d6a2d', bg: '#e8f3e8' },
  { id: 'local', label: '지역화폐 사용처', icon: Wallet, color: '#e07b00', bg: '#fff3e0' },
]

const stores = {
  farm: [
    { name: '옥천농기계센터', address: '옥천읍 금구리 123', phone: '043-730-1111', lat: 36.3068, lng: 127.5725 },
    { name: '농협 농자재마트', address: '옥천읍 하계리 45', phone: '043-730-2222', lat: 36.3045, lng: 127.5700 },
    { name: '금강농기계', address: '옥천읍 문정리 67', phone: '043-730-3333', lat: 36.3080, lng: 127.5750 },
  ],
  local: [
    { name: '옥천전통시장', address: '옥천읍 문정리 1', phone: '043-730-4444', lat: 36.3055, lng: 127.5730 },
    { name: '하나로마트 옥천점', address: '옥천읍 금구리 200', phone: '043-730-5555', lat: 36.3072, lng: 127.5695 },
    { name: '옥천군 가맹점 일대', address: '옥천읍 일원', phone: '043-730-6666', lat: 36.3090, lng: 127.5710 },
  ],
}

const markerColors = { farm: '#2d6a2d', local: '#e07b00' }

const COLLAPSED_H = 190
const EXPANDED_H = 460

export default function StoreMap() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [activeCategory, setActiveCategory] = useState('farm')
  const [sheetH, setSheetH] = useState(COLLAPSED_H)
  const [selectedStore, setSelectedStore] = useState(null)
  const dragRef = useRef({ startY: 0, startH: 0, dragging: false })

  const expanded = sheetH > (COLLAPSED_H + EXPANDED_H) / 2

  const onDragStart = (e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY
    dragRef.current = { startY: y, startH: sheetH, dragging: true }
  }

  const onDragMove = (e) => {
    if (!dragRef.current.dragging) return
    const y = e.touches ? e.touches[0].clientY : e.clientY
    const delta = dragRef.current.startY - y
    const next = Math.min(EXPANDED_H, Math.max(COLLAPSED_H, dragRef.current.startH + delta))
    setSheetH(next)
  }

  const onDragEnd = () => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    setSheetH(expanded ? EXPANDED_H : COLLAPSED_H)
  }

  useEffect(() => {
    const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
    const scriptId = 'kakao-map-sdk'

    const initMap = () => {
      window.kakao.maps.load(() => {
        const container = mapRef.current
        if (!container) return
        mapInstanceRef.current = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(OKCHEON_CENTER.lat, OKCHEON_CENTER.lng),
          level: 5,
        })
        drawMarkers(activeCategory)
      })
    }

    if (window.kakao?.maps) { initMap(); return }
    if (document.getElementById(scriptId)) {
      document.getElementById(scriptId).addEventListener('load', initMap)
      return
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=services`
    script.onload = initMap
    document.head.appendChild(script)
  }, [])

  const drawMarkers = (categoryId) => {
    const map = mapInstanceRef.current
    if (!map) return
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    const color = markerColors[categoryId]
    stores[categoryId].forEach(store => {
      const position = new window.kakao.maps.LatLng(store.lat, store.lng)
      const svg = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.2"/></filter>
        <path d="M18 2C10.8 2 5 7.8 5 15c0 10 13 27 13 27S31 25 31 15C31 7.8 25.2 2 18 2z" fill="${color}" filter="url(#s)"/>
        <circle cx="18" cy="15" r="6" fill="white"/>
      </svg>`
      const markerImage = new window.kakao.maps.MarkerImage(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        new window.kakao.maps.Size(36, 44),
        { offset: new window.kakao.maps.Point(18, 44) }
      )
      const marker = new window.kakao.maps.Marker({ position, image: markerImage, map })
      window.kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedStore(store)
        setExpanded(true)
        map.panTo(position)
      })
      markersRef.current.push(marker)
    })
  }

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId)
    setSelectedStore(null)
    drawMarkers(categoryId)
  }

  const handleStoreClick = (store) => {
    setSelectedStore(store)
    mapInstanceRef.current?.panTo(new window.kakao.maps.LatLng(store.lat, store.lng))
  }

  const activeCat = categories.find(c => c.id === activeCategory)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#FDFCF8' }}>

      <TopBar title="우리 마을 곳곳 사용처" />

      {/* Map */}
      <div style={{ position: 'relative', flex: 1 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 0 }} />

        {/* Kakao map button */}
        <button
          onClick={() => window.open(`https://map.kakao.com/?q=옥천군+${activeCat?.label}`, '_blank')}
          style={{
            position: 'absolute', top: 12, right: 16, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff', border: '2px solid #2d6a2d', borderRadius: 24,
            padding: '10px 16px', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          }}
        >
          <MapPin size={15} color="#2d6a2d" strokeWidth={2.5} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#2d6a2d' }}>카카오맵에서 보기</span>
        </button>

      {/* Bottom sheet */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          height: sheetH,
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.10)',
          transition: dragRef.current.dragging ? 'none' : 'height 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
      >
        {/* Drag handle */}
        <div
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          onClick={() => setSheetH(expanded ? COLLAPSED_H : EXPANDED_H)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 8px', cursor: 'grab', flexShrink: 0, userSelect: 'none' }}
        >
          <div style={{ width: 32, height: 4, borderRadius: 2, background: '#ddd' }} />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px', flexShrink: 0 }}>
          {categories.map(cat => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: isActive ? cat.color : '#fff',
                  boxShadow: isActive ? `0 4px 14px ${cat.color}33` : '0 1px 4px rgba(0,0,0,0.07)',
                  fontFamily: 'inherit', transition: 'all 0.2s ease',
                }}
              >
                <Icon size={18} color={isActive ? '#fff' : cat.color} strokeWidth={2.2} />
                <span style={{ fontSize: 15, fontWeight: 700, color: isActive ? '#fff' : '#444', letterSpacing: '-0.2px' }}>
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Expand hint / store count */}
        <div
          onClick={() => setSheetH(expanded ? COLLAPSED_H : EXPANDED_H)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 18px 10px', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: '#888' }}>
            {stores[activeCategory].length}개 장소
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#aaa' }}>
              {expanded ? '접기' : '목록 보기'}
            </span>
            {expanded
              ? <ChevronDown size={16} color="#aaa" strokeWidth={2.5} />
              : <ChevronUp size={16} color="#aaa" strokeWidth={2.5} />
            }
          </div>
        </div>

        {/* Store list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 12px' }}>
          {stores[activeCategory].map((store, i) => {
            const isSelected = selectedStore?.name === store.name
            const CatIcon = activeCat.icon
            return (
              <div
                key={i}
                onClick={() => handleStoreClick(store)}
                style={{
                  borderRadius: 18,
                  marginBottom: 10,
                  background: '#fff',
                  border: `2px solid ${isSelected ? activeCat.color : '#ebebeb'}`,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'border-color 0.18s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 12px' }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                    background: isSelected ? activeCat.color : activeCat.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.18s',
                  }}>
                    <CatIcon size={22} color={isSelected ? '#fff' : activeCat.color} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 17, fontWeight: 700, color: '#1a1a1a',
                      letterSpacing: '-0.3px', marginBottom: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {store.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} color="#888" strokeWidth={2} />
                      <span style={{ fontSize: 13, color: '#888', letterSpacing: '-0.1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {store.address}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', borderTop: '1.5px solid #ebebeb' }}>
                  <a
                    href={`tel:${store.phone}`}
                    onClick={e => e.stopPropagation()}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 6, padding: '11px 0', textDecoration: 'none',
                      borderRight: '1.5px solid #ebebeb',
                    }}
                  >
                    <Phone size={15} color="#2d6a2d" strokeWidth={2.5} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#2d6a2d', fontFamily: 'inherit' }}>전화하기</span>
                  </a>
                  <button
                    onClick={e => { e.stopPropagation(); handleStoreClick(store); setSheetH(COLLAPSED_H) }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 6, padding: '11px 0', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Navigation size={15} color="#555" strokeWidth={2.5} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>지도 보기</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      </div>
    </div>
  )
}
