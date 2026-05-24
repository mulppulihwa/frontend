import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronUp, ChevronDown, MapPin, Phone, Navigation, Tractor, Wallet, Search, X, Clock } from 'lucide-react'
import TopBar from '../components/TopBar'
import { fetchPlaces } from '../lib/api'

const OKCHEON_CENTER = { lat: 36.3063, lng: 127.5718 }

const categories = [
  { id: 'farm', label: '농기구 구입처', icon: Tractor, color: '#076818', bg: '#e8f3e8' },
  { id: 'local', label: '지역화폐 사용처', icon: Wallet, color: '#FFA100', bg: '#fff3e0' },
]

const emptyStores = { farm: [], local: [] }

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return d < 1000 ? `${Math.round(d)}m` : `${(d/1000).toFixed(1)}km`
}

const markerColors = { farm: '#076818', local: '#FFA100' }

const COLLAPSED_H = 160
const EXPANDED_H = 440
const FULLSCREEN_H = () => window.innerHeight - 80

export default function StoreMap() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const mapAreaRef = useRef(null)
  const [activeCategory, setActiveCategory] = useState('farm')
  const [sheetH, setSheetH] = useState(COLLAPSED_H)
  const [selectedStore, setSelectedStore] = useState(null)
  const [stores, setStores] = useState(emptyStores)
  const [query, setQuery] = useState('')
  const [detailPopup, setDetailPopup] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [userPos, setUserPos] = useState(null)
  const dragRef = useRef({ startY: 0, startH: 0, dragging: false })

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  useEffect(() => {
    let active = true
    fetchPlaces()
      .then(places => {
        if (!active) return
        setStores({
          farm: places.filter(place => place.category === 'farm'),
          local: places.filter(place => place.category === 'local'),
        })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const fullscreen = sheetH > EXPANDED_H + 50
  const expanded = sheetH > (COLLAPSED_H + EXPANDED_H) / 2

  const onDragStart = (e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY
    dragRef.current = { startY: y, startH: sheetH, dragging: true }
  }

  const onDragMove = (e) => {
    if (!dragRef.current.dragging) return
    const y = e.touches ? e.touches[0].clientY : e.clientY
    const delta = dragRef.current.startY - y
    const next = Math.min(FULLSCREEN_H(), Math.max(COLLAPSED_H, dragRef.current.startH + delta))
    setSheetH(next)
  }

  const onDragEnd = () => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    if (fullscreen) setSheetH(FULLSCREEN_H())
    else if (expanded) setSheetH(EXPANDED_H)
    else setSheetH(COLLAPSED_H)
  }

  const cycleSheet = () => {
    if (fullscreen) setSheetH(COLLAPSED_H)
    else if (expanded) setSheetH(FULLSCREEN_H())
    else setSheetH(EXPANDED_H)
  }

  useEffect(() => {
    const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
    const scriptId = 'kakao-map-sdk'

    const initMap = () => {
      window.kakao.maps.load(() => {
        const container = mapRef.current
        if (!container) return
        const center = state?.store
          ? new window.kakao.maps.LatLng(state.store.lat, state.store.lng)
          : new window.kakao.maps.LatLng(OKCHEON_CENTER.lat, OKCHEON_CENTER.lng)
        mapInstanceRef.current = new window.kakao.maps.Map(container, { center, level: 3 })
        const category = state?.store?.category ?? activeCategory
        if (state?.store) setActiveCategory(category)
        drawMarkers(category)
        if (state?.store) {
          setSelectedStore(state.store)
          setSheetH(EXPANDED_H)
        }
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

  function drawMarkers(categoryId) {
    const map = mapInstanceRef.current
    if (!map) return
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    const color = markerColors[categoryId]
    ;(stores[categoryId] || []).forEach(store => {
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
        setSheetH(EXPANDED_H)
        map.panTo(position)
      })
      markersRef.current.push(marker)
    })
  }

  useEffect(() => {
    drawMarkers(activeCategory)
  }, [stores, activeCategory])

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId)
    setSelectedStore(null)
    setQuery('')
    drawMarkers(categoryId)
  }

  const filteredStores = (stores[activeCategory] || []).filter(s =>
    s.name.includes(query) || s.address.includes(query)
  )

  const handleStoreClick = (store) => {
    setSelectedStore(store)
    if (fullscreen) setSheetH(COLLAPSED_H)
    window.setTimeout(() => {
      mapInstanceRef.current?.panTo(new window.kakao.maps.LatLng(store.lat, store.lng))
    }, fullscreen ? 120 : 0)
  }

  const activeCat = categories.find(c => c.id === activeCategory)

  const openDetail = (store) => {
    setDetailPopup({ ...store, kakaoResult: null })
    setDetailLoading(true)
    if (window.kakao?.maps?.services) {
      const ps = new window.kakao.maps.services.Places()
      ps.keywordSearch(store.name, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
          const p = data[0]
          setDetailPopup({
            ...store,
            kakaoResult: {
              address: p.road_address_name || p.address_name,
              phone: p.phone || store.phone,
              placeUrl: p.place_url,
            },
          })
        }
        setDetailLoading(false)
      })
    } else {
      setDetailLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f0f0f0' }}>

      <div style={{ background: '#FDFCF8' }}>
        <TopBar title="우리 마을 곳곳 사용처" />
      </div>

      {/* Map */}
      <div ref={mapAreaRef} style={{ position: 'relative', flex: 1 }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 0 }} />

        {/* Floating search trigger + category pills */}
        <div style={{
          position: 'absolute', top: 12, left: 16, right: 16, zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div
            onClick={() => navigate('/store-search')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff', borderRadius: 16, padding: '11px 16px',
              border: '1.5px solid #e8e8e8',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)', cursor: 'pointer',
            }}
          >
            <Search size={16} color="#bbb" strokeWidth={2.2} />
            <span style={{ fontSize: 14, color: '#bbb', fontFamily: 'inherit', letterSpacing: '-0.1px' }}>장소 또는 주소 검색</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
          {categories.map(cat => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 16px', borderRadius: 24,
                  border: `1.5px solid ${isActive ? cat.color : '#e8e8e8'}`,
                  background: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <Icon size={16} color={cat.color} strokeWidth={2.2} />
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? cat.color : '#555', letterSpacing: '-0.1px' }}>
                  {cat.label}
                </span>
              </button>
            )
          })}
          </div>
        </div>

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
            onClick={cycleSheet}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 8px', cursor: 'grab', flexShrink: 0, userSelect: 'none' }}
          >
            <div style={{ width: 32, height: 4, borderRadius: 2, background: '#ddd' }} />
          </div>


          {/* Store count + expand toggle */}
          <div
            onClick={cycleSheet}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 18px 12px', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>
              {filteredStores.length}개 장소
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#aaa' }}>
                {fullscreen ? '접기' : expanded ? '전체 보기' : '목록 보기'}
              </span>
              {fullscreen
                ? <ChevronDown size={16} color="#aaa" strokeWidth={2.5} />
                : <ChevronUp size={16} color="#aaa" strokeWidth={2.5} />
              }
            </div>
          </div>

          {/* Store list */}
	          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 118px', scrollPaddingBottom: 118 }}>
            {filteredStores.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 14 }}>
                검색 결과가 없어요
              </div>
            )}
            {filteredStores.map((store) => {
              const i = (stores[activeCategory] || []).indexOf(store)
              const isSelected = selectedStore?.name === store.name
              const CatIcon = activeCat.icon
              return (
                <div
                  key={i}
                  onClick={() => handleStoreClick(store)}
                  style={{
                    borderRadius: 18, marginBottom: 10,
                    background: '#fff',
                    border: `1.5px solid ${isSelected ? activeCat.color : '#ebebeb'}`,
                    cursor: 'pointer', overflow: 'hidden',
                    transition: 'border-color 0.18s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 12px' }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                      background: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.18s',
                    }}>
                      <CatIcon size={22} color={activeCat.color} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {store.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#FFA100' }}>★ {store.rating}</span>
                        <span style={{ fontSize: 11, color: '#888' }}>({store.reviews})</span>
                        {userPos && (
                          <>
                            <span style={{ fontSize: 11, color: '#bbb' }}>·</span>
                            <span style={{ fontSize: 12, color: '#666' }}>{haversine(userPos.lat, userPos.lng, store.lat, store.lng)}</span>
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <MapPin size={13} color="#999" strokeWidth={2} />
                        <span style={{ fontSize: 12, color: '#666', letterSpacing: '-0.1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {store.address}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} color="#999" strokeWidth={2} />
                        <span style={{ fontSize: 12, color: '#666', letterSpacing: '-0.1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {store.hours}
                        </span>
                      </div>
                    </div>
                  </div>

	                  <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 14px' }}>
	                    <button
	                      onClick={e => { e.stopPropagation(); openDetail(store) }}
	                      style={{ minWidth: 132, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 18px', background: '#f7f7f7', border: '1.5px solid #e5e5e5', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit' }}
	                    >
                      <Navigation size={15} color="#555" strokeWidth={2.5} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>자세히 보기</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detail popup */}
      {detailPopup && (
        <div
          onClick={() => setDetailPopup(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 320, background: '#fff', borderRadius: 24, padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeInScale 0.2s ease' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>{detailPopup.name}</p>
              <button onClick={() => setDetailPopup(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color="#888" strokeWidth={2} />
              </button>
            </div>

            {detailLoading ? (
              <p style={{ fontSize: 14, color: '#aaa', textAlign: 'center', padding: '12px 0' }}>불러오는 중...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { Icon: MapPin, value: detailPopup.kakaoResult?.address || detailPopup.address },
                  { Icon: Phone, value: detailPopup.kakaoResult?.phone || detailPopup.phone },
                  { Icon: Clock, value: detailPopup.hours },
                ].filter(({ value }) => value).map(({ Icon, value }) => (
                  <div key={value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Icon size={16} color="#888" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#1a1a1a', letterSpacing: '-0.1px', lineHeight: 1.5 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setDetailPopup(null)
                  navigate('/store-detail', { state: { store: detailPopup } })
                }}
                style={{ flex: 1, padding: '13px 0', borderRadius: 50, background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#555', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                지도에서 보기
              </button>
              <a
                href={`tel:${detailPopup.kakaoResult?.phone || detailPopup.phone}`}
                style={{ flex: 1, padding: '13px 0', borderRadius: 50, background: '#076818', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'inherit' }}
              >
                전화하기
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
