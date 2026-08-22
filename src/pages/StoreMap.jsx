import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronUp, ChevronDown, MapPin, Phone, Search, X, Clock, Plus, Trash2, MessageSquareText, Pencil, ThumbsUp } from 'lucide-react'
import TopBar from '../components/TopBar'
import SelectField from '../components/SelectField'
import { createPlace, deletePlace, fetchPlaces, updatePlace } from '../lib/api'
import { getPlaceCategories, getPlaceCategoryMeta, PLACE_CATEGORIES } from '../lib/placeCategories'
import { filterPlacesByPolicy } from '../lib/placePolicyFilter'
import okcheonRecommendation from '../assets/okcheon-recommendation.png'
import okcheonSearch from '../assets/okcheon-search.png'

const OKCHEON_CENTER = { lat: 36.3063, lng: 127.5718 }
const GREEN = '#076818'

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return d < 1000 ? `${Math.round(d)}m` : `${(d/1000).toFixed(1)}km`
}

function toApiCoordinate(value) {
  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate.toFixed(7) : null
}

const COLLAPSED_H = 220
const EXPANDED_H = 400
const SHOW_RECOMMENDATION_BADGE_MOCK = true
const POSTCODE_SCRIPT_SRC = '//t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
const USER_PLACE_CATEGORIES = PLACE_CATEGORIES.map(category => category.id)
const API_PLACE_CATEGORY = {
  ...Object.fromEntries(USER_PLACE_CATEGORIES.map(category => [category, category])),
  집: '생활',
  부동산: '건축자재',
  수도: '생활',
  교육센터: '행정',
  레저시설: '생활',
  명소: '생활',
  맛집: '음식점',
}
const EDITABLE_PLACE_CATEGORY = {
  ...API_PLACE_CATEGORY,
}
const PLACE_RECOMMEND_KEY = 'okcheonPlaceRecommendations'

function readRecommendations() {
  try { return JSON.parse(localStorage.getItem(PLACE_RECOMMEND_KEY) || '{}') } catch { return {} }
}

function writeRecommendations(value) {
  localStorage.setItem(PLACE_RECOMMEND_KEY, JSON.stringify(value))
}

const INSTITUTION_RECOMMENDATION_TYPES = [
  {
    id: 'okcheon_news',
    label: '옥천신문 추천',
    matches: value => value.includes('옥천신문') || value.includes('okcheonnews') || value.includes('newspaper'),
  },
  {
    id: 'okcheon_counseling_center',
    label: '옥천군 상담센터 추천',
    matches: value => value.includes('상담센터') || value.includes('counselingcenter') || value.includes('consultingcenter'),
  },
]

function getInstitutionRecommendationTypes(place) {
  const rawValues = [
    place.recommendationTypes,
    place.recommendation_types,
    place.recommendationType,
    place.recommendation_type,
    place.recommendedBy,
    place.recommended_by,
    place.verificationTypes,
    place.verification_types,
  ]
    .flatMap(value => Array.isArray(value) ? value : [value])
    .flatMap(value => typeof value === 'string' ? value.split(/[,|]/) : [])
    .map(value => value.toLowerCase().replace(/[\s_-]/g, ''))

  if (place.okcheon_news_recommended || place.is_okcheon_news_recommended || place.recommended_by_okcheon_news) {
    rawValues.push('okcheonnews')
  }
  if (place.counseling_center_recommended || place.is_counseling_center_recommended || place.recommended_by_counseling_center) {
    rawValues.push('counselingcenter')
  }

  const matchedTypes = INSTITUTION_RECOMMENDATION_TYPES.filter(type => rawValues.some(type.matches))
  return matchedTypes.slice(0, 1)
}

function getRecommendKey(place) {
  return String(place?.id || `${place?.name}-${place?.address}`)
}

function getRecommendedCount(place, recommendations = readRecommendations()) {
  const key = getRecommendKey(place)
  return Number(recommendations[key]?.count ?? place?.recommend_count ?? place?.recommendCount ?? 0)
}

function isPlaceRecommended(place, recommendations = readRecommendations()) {
  return Boolean(recommendations[getRecommendKey(place)]?.recommended)
}

function ResidentRecommendationBadge({ count, large = false }) {
  if (count < 5) return null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: large ? 5 : 3,
      width: large ? 104 : 76,
      flexShrink: 0,
      alignSelf: large ? 'center' : 'auto',
    }}>
      <img
        src={okcheonRecommendation}
        alt=""
        aria-hidden="true"
        style={{
          width: large ? 70 : 50,
          height: large ? 70 : 50,
          flexShrink: 0,
          objectFit: 'contain',
        }}
      />
      <span style={{
        width: '100%',
        color: '#20242f',
        fontSize: large ? 12.5 : 10.5,
        fontWeight: 750,
        lineHeight: 1.25,
        letterSpacing: 0,
        textAlign: 'center',
        wordBreak: 'keep-all',
      }}>
        옥천 주민 추천
      </span>
    </div>
  )
}

function InstitutionRecommendationBadge({ types, large = false }) {
  if (!types.length) return null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: large ? 5 : 3,
      width: large ? 112 : 82,
      flexShrink: 0,
      alignSelf: large ? 'center' : 'auto',
    }}>
      <img
        src={okcheonSearch}
        alt=""
        aria-hidden="true"
        style={{
          width: large ? 70 : 50,
          height: large ? 70 : 50,
          flexShrink: 0,
          objectFit: 'contain',
        }}
      />
      <span style={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        gap: 1,
        color: '#20242f',
        fontSize: large ? 12.5 : 10.5,
        fontWeight: 750,
        lineHeight: 1.25,
        letterSpacing: 0,
        textAlign: 'center',
        wordBreak: 'keep-all',
      }}>
        {types.map(type => <span key={type.id}>{type.label}</span>)}
      </span>
    </div>
  )
}

function loadPostcodeScript() {
  if (window.kakao?.Postcode) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${POSTCODE_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', () => reject(new Error('주소 검색을 불러오지 못했습니다.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = POSTCODE_SCRIPT_SRC
    script.onload = resolve
    script.onerror = () => reject(new Error('주소 검색을 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
}

function getKakaoMapUrl(place) {
  if (place?.kakaoResult?.placeUrl) return place.kakaoResult.placeUrl
  const query = [place?.name, place?.address].filter(Boolean).join(' ')
  return `https://map.kakao.com/?q=${encodeURIComponent(query)}`
}

export default function StoreMap() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const geocodeAttemptsRef = useRef(new Set())
  const mapAreaRef = useRef(null)
  const postcodeLayerRef = useRef(null)
  const [mapAreaHeight, setMapAreaHeight] = useState(0)
  const [mapReady, setMapReady] = useState(false)
  const [activeCategory, setActiveCategory] = useState('집')
  const [sheetH, setSheetH] = useState(COLLAPSED_H)
  const [selectedStore, setSelectedStore] = useState(null)
  const [stores, setStores] = useState([])
  const [query, setQuery] = useState('')
  const [detailPopup, setDetailPopup] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [addPlaceOpen, setAddPlaceOpen] = useState(false)
  const [addPlaceLoading, setAddPlaceLoading] = useState(false)
  const [addPlaceError, setAddPlaceError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deletePlaceLoading, setDeletePlaceLoading] = useState(false)
  const [editingPlaceId, setEditingPlaceId] = useState(null)
  const [hoveredPlaceId, setHoveredPlaceId] = useState(null)
  const [userFilter, setUserFilter] = useState('all')
  const [recommendations, setRecommendations] = useState(() => readRecommendations())
  const [newPlace, setNewPlace] = useState({ name: '', category: '생활', address: '', phone: '', hours: '', memo: '' })
  const [userPos, setUserPos] = useState(null)
  const dragRef = useRef({ startY: 0, startH: 0, dragging: false })
  const relatedPolicy = state?.policy || null
  const sheetMaxHeight = mapAreaHeight || Math.max(COLLAPSED_H, window.innerHeight - 144)
  const expandedHeight = Math.min(EXPANDED_H, sheetMaxHeight)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  useEffect(() => {
    loadPostcodeScript().catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    fetchPlaces()
      .then(places => {
        if (!active) return
        const relatedPlaces = relatedPolicy
          ? filterPlacesByPolicy(places, relatedPolicy)
          : places
        const previewCategory = relatedPlaces[0]?.category
        let previewIndex = 0
        const displayedPlaces = SHOW_RECOMMENDATION_BADGE_MOCK && relatedPlaces.length
          ? relatedPlaces.map(place => {
              if (place.category !== previewCategory || previewIndex > 2) return place
              const mockType = previewIndex++
              if (mockType === 0) {
                return {
                    ...place,
                    recommend_count: Math.max(Number(place.recommend_count ?? place.recommendCount ?? 0), 5),
                    isRecommendationMock: true,
                }
              }
              return {
                ...place,
                recommendation_types: [mockType === 1 ? '옥천신문' : '옥천군 상담센터'],
                isRecommendationMock: true,
              }
            })
          : relatedPlaces
        setStores(displayedPlaces)
        const nextCategory = state?.store?.category || displayedPlaces[0]?.category || ''
        if (nextCategory) setActiveCategory(nextCategory)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [relatedPolicy])

  const fullscreen = sheetH >= sheetMaxHeight - 8
  const expanded = sheetH > (COLLAPSED_H + expandedHeight) / 2

  const onDragStart = (e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY
    dragRef.current = { startY: y, startH: sheetH, dragging: true }
  }

  const onDragMove = (e) => {
    if (!dragRef.current.dragging) return
    const y = e.touches ? e.touches[0].clientY : e.clientY
    const delta = dragRef.current.startY - y
    const next = Math.min(sheetMaxHeight, Math.max(COLLAPSED_H, dragRef.current.startH + delta))
    setSheetH(next)
  }

  const onDragEnd = () => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    if (expanded) setSheetH(sheetMaxHeight)
    else setSheetH(COLLAPSED_H)
  }

  const cycleSheet = () => {
    if (fullscreen) setSheetH(COLLAPSED_H)
    else setSheetH(sheetMaxHeight)
  }

  useEffect(() => {
    const updateMapAreaHeight = () => {
      const nextHeight = Math.floor(mapAreaRef.current?.getBoundingClientRect().height || 0)
      if (!nextHeight) return
      setMapAreaHeight(nextHeight)
      setSheetH(current => Math.min(current, nextHeight))
    }

    updateMapAreaHeight()
    const observer = new ResizeObserver(updateMapAreaHeight)
    if (mapAreaRef.current) observer.observe(mapAreaRef.current)
    window.addEventListener('resize', updateMapAreaHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateMapAreaHeight)
    }
  }, [])

  useEffect(() => {
    const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
    const scriptId = 'kakao-map-sdk'

    const initMap = () => {
      window.kakao.maps.load(() => {
        const container = mapRef.current
        if (!container) return
        const hasStorePosition = Number.isFinite(Number(state?.store?.lat)) && Number.isFinite(Number(state?.store?.lng))
        const center = hasStorePosition
          ? new window.kakao.maps.LatLng(state.store.lat, state.store.lng)
          : new window.kakao.maps.LatLng(OKCHEON_CENTER.lat, OKCHEON_CENTER.lng)
        mapInstanceRef.current = new window.kakao.maps.Map(container, { center, level: 3 })
        setMapReady(true)
        const category = state?.store?.category || activeCategory
        if (state?.store) setActiveCategory(category)
        drawMarkers(category)
        if (state?.store) {
          setSelectedStore(state.store)
          setSheetH(expandedHeight)
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

  useEffect(() => {
    if (!window.kakao?.maps?.services || stores.length === 0) return
    const geocoder = new window.kakao.maps.services.Geocoder()

    stores.forEach(place => {
      const hasCoordinates = Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lng))
      const key = String(place.id || `${place.name}-${place.address}`)
      if (hasCoordinates || place.locationPrivate || !place.address || geocodeAttemptsRef.current.has(key)) return
      geocodeAttemptsRef.current.add(key)

      geocoder.addressSearch(place.address, (results, status) => {
        if (status !== window.kakao.maps.services.Status.OK || !results.length) return
        const lat = Number(results[0].y)
        const lng = Number(results[0].x)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
        setStores(current => current.map(item => (
          String(item.id) === String(place.id) ? { ...item, lat, lng } : item
        )))
      })
    })
  }, [stores, mapReady])

  function drawMarkers(categoryId) {
    const map = mapInstanceRef.current
    if (!map || !categoryId) return
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    const categoryMeta = getPlaceCategoryMeta(categoryId)
    if (!categoryMeta) return
    const color = categoryMeta.color
    stores
      .filter(place => place.category === categoryId)
      .filter(place => Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lng)))
      .forEach(store => {
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
        setSheetH(expandedHeight)
        map.panTo(position)
        openDetail(store)
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
    setUserFilter('all')
    drawMarkers(categoryId)
  }

  const categories = getPlaceCategories(stores)
  const filteredStores = stores
    .filter(s => s.category === activeCategory)
    .filter(s => s.name.includes(query) || s.address.includes(query))
    .filter(s => userFilter === 'added' ? s.userAdded : true)

  const handleStoreClick = (store) => {
    setSelectedStore(store)
    if (fullscreen) setSheetH(COLLAPSED_H)
    if (!Number.isFinite(Number(store.lat)) || !Number.isFinite(Number(store.lng))) return
    window.setTimeout(() => {
      mapInstanceRef.current?.panTo(new window.kakao.maps.LatLng(store.lat, store.lng))
    }, fullscreen ? 120 : 0)
  }

  const activeCat = categories.find(c => c.id === activeCategory) || getPlaceCategoryMeta(activeCategory)

  function openDetail(store) {
    setDetailPopup({ ...store, kakaoResult: null })
    if (store.locationPrivate) {
      setDetailLoading(false)
      return
    }
    setDetailLoading(true)
    if (window.kakao?.maps?.services) {
      const ps = new window.kakao.maps.services.Places()
      ps.keywordSearch([store.name, store.locationPrivate ? '' : store.address].filter(Boolean).join(' '), (data, status) => {
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

  const handleRecommendPlace = (place) => {
    const key = getRecommendKey(place)
    setRecommendations(current => {
      if (current[key]?.recommended) {
        const next = { ...current }
        delete next[key]
        writeRecommendations(next)
        return next
      }
      const next = {
        ...current,
        [key]: {
          recommended: true,
          count: getRecommendedCount(place, current) + 1,
        },
      }
      writeRecommendations(next)
      return next
    })
  }

  const openAddPlace = (event) => {
    event.stopPropagation()
    setAddPlaceError('')
    setEditingPlaceId(null)
    setNewPlace({
      name: '',
      category: '생활',
      address: '',
      phone: '',
      hours: '',
      memo: '',
    })
    setAddPlaceOpen(true)
  }

  const openEditPlace = (event, store) => {
    event.stopPropagation()
    setAddPlaceError('')
    setEditingPlaceId(store.id)
    setNewPlace({
      name: store.name || '',
      category: EDITABLE_PLACE_CATEGORY[store.sourceCategory]
        || EDITABLE_PLACE_CATEGORY[store.category]
        || store.category
        || '생활',
      address: store.address || '',
      phone: store.phone || '',
      hours: store.hours === '사용자가 추가한 장소' ? '' : store.hours || '',
      memo: store.memo || '',
    })
    setAddPlaceOpen(true)
  }

  const closePlaceForm = () => {
    if (addPlaceLoading) return
    setAddPlaceOpen(false)
    setEditingPlaceId(null)
  }

  const closePostcode = () => {
    if (postcodeLayerRef.current) postcodeLayerRef.current.style.display = 'none'
  }

  const openPostcode = async () => {
    setAddPlaceError('')
    try {
      await loadPostcodeScript()
    } catch (error) {
      setAddPlaceError(error.message)
      return
    }
    const layer = postcodeLayerRef.current
    if (!layer || !window.kakao?.Postcode) return

    new window.kakao.Postcode({
      oncomplete(data) {
        const address = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress
        setNewPlace(current => ({ ...current, address }))
        closePostcode()
      },
      width: '100%',
      height: '100%',
      maxSuggestItems: 5,
    }).embed(layer)

    layer.style.display = 'block'
  }

  const resolvePlacePosition = () => new Promise(resolve => {
    if (!window.kakao?.maps?.services || !newPlace.address) {
      resolve(null)
      return
    }

    const geocoder = new window.kakao.maps.services.Geocoder()
    geocoder.addressSearch(
      newPlace.address,
      (data, status) => {
        if (status !== window.kakao.maps.services.Status.OK || !data.length) {
          resolve(null)
          return
        }
        resolve({
          lat: Number(data[0].y),
          lng: Number(data[0].x),
          address: data[0].road_address?.address_name || data[0].address_name || newPlace.address,
        })
      },
    )
  })

  const handleAddPlace = async (event) => {
    event.preventDefault()
    if (!newPlace.name.trim() || !newPlace.address.trim()) {
      setAddPlaceError('장소 이름과 주소를 입력해 주세요.')
      return
    }

    setAddPlaceLoading(true)
    setAddPlaceError('')
    try {
      const position = await resolvePlacePosition()
      if (!position) {
        setAddPlaceError('주소의 위치를 찾지 못했어요. 주소를 다시 확인해 주세요.')
        return
      }

      const payload = {
        name: newPlace.name.trim(),
        category: API_PLACE_CATEGORY[newPlace.category] || newPlace.category,
        address: position.address || newPlace.address.trim(),
        phone: newPlace.phone.trim(),
        business_hours: newPlace.hours.trim(),
        local_memo: newPlace.memo.trim(),
        lat: toApiCoordinate(position.lat),
        lng: toApiCoordinate(position.lng),
      }
      const savedPlace = editingPlaceId
        ? await updatePlace(editingPlaceId, payload)
        : await createPlace(payload)

      setStores(current => editingPlaceId
        ? current.map(place => String(place.id) === String(editingPlaceId) ? savedPlace : place)
        : [...current, savedPlace])
      setActiveCategory(savedPlace.category)
      setSelectedStore(savedPlace)
      setSheetH(expandedHeight)
      setAddPlaceOpen(false)
      setEditingPlaceId(null)
      window.setTimeout(() => {
        mapInstanceRef.current?.panTo(new window.kakao.maps.LatLng(savedPlace.lat, savedPlace.lng))
      }, 80)
    } catch (error) {
      setAddPlaceError(error.message || '장소 정보를 저장하지 못했습니다.')
    } finally {
      setAddPlaceLoading(false)
    }
  }

  const handleDeletePlace = async () => {
    if (!deleteTarget?.id || deletePlaceLoading) return
    setDeletePlaceLoading(true)
    try {
      await deletePlace(deleteTarget.id)
      setStores(current => current.filter(place => String(place.id) !== String(deleteTarget.id)))
      if (String(selectedStore?.id) === String(deleteTarget.id)) setSelectedStore(null)
      if (String(detailPopup?.id) === String(deleteTarget.id)) setDetailPopup(null)
      setDeleteTarget(null)
    } catch (error) {
      setAddPlaceError(error.message || '장소를 삭제하지 못했습니다.')
      setDeleteTarget(null)
    } finally {
      setDeletePlaceLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 70px - env(safe-area-inset-bottom))', overflow: 'hidden', background: '#f0f0f0' }}>

      <div style={{ background: '#FDFCF8' }}>
        <TopBar title="우리 마을 정착 지도" hideBack />
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
            onClick={() => navigate('/store-search', { state: { policy: relatedPolicy } })}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff', borderRadius: 100, padding: '11px 16px',
              border: '1.5px solid #e8e8e8',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)', cursor: 'pointer',
            }}
          >
            <Search size={16} color="#bbb" strokeWidth={2.2} />
            <span style={{ fontSize: 14, color: '#bbb', fontFamily: 'inherit', letterSpacing: '-0.1px' }}>장소 또는 주소 검색</span>
          </div>
          {relatedPolicy && (
            <div style={{ background: 'rgba(255,255,255,0.95)', border: '1.5px solid #e8e8e8', borderRadius: 18, padding: '9px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#076818', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {relatedPolicy.title} 관련 사용처
              </p>
            </div>
          )}
          <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {categories.map(cat => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
                  padding: '9px 16px', borderRadius: 24,
                  border: `1.5px solid ${isActive ? cat.color : '#e8e8e8'}`,
                  background: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <Icon size={16} color={cat.color} strokeWidth={2.2} />
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? cat.color : '#555', letterSpacing: '-0.1px', whiteSpace: 'nowrap' }}>
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
            position: 'fixed',
            bottom: 'calc(70px + env(safe-area-inset-bottom))',
            left: '50%',
            zIndex: 110,
            width: 'min(100%, 430px)',
            height: sheetH,
            transform: 'translateX(-50%)',
            background: '#fff',
            borderRadius: fullscreen ? 0 : '24px 24px 0 0',
            boxShadow: '0 -2px 20px rgba(0,0,0,0.10)',
            transition: dragRef.current.dragging
              ? 'none'
              : 'height 0.52s cubic-bezier(0.22, 1, 0.36, 1), bottom 0.52s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.36s ease',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
        >
          {/* Drag handle (grab area, no visible bar) */}
          <div
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            onClick={cycleSheet}
            style={{ padding: '8px 0 4px', cursor: 'grab', flexShrink: 0, userSelect: 'none' }}
          />


          {/* Store count + expand toggle */}
          <div
            onClick={cycleSheet}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 18px 12px', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>
                {filteredStores.length}개 장소
              </span>
              {stores.some(s => s.category === activeCategory && s.userAdded) && (
              <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                {[{ id: 'all', label: '모두' }, { id: 'added', label: '직접 추가' }].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setUserFilter(id)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 12, fontWeight: 650,
                      background: userFilter === id ? '#076818' : '#f0f0f0',
                      color: userFilter === id ? '#fff' : '#777',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#aaa' }}>
                  {fullscreen ? '접기' : '전체 보기'}
                </span>
                {fullscreen
                  ? <ChevronDown size={16} color="#aaa" strokeWidth={2.5} />
                  : <ChevronUp size={16} color="#aaa" strokeWidth={2.5} />
                }
              </div>
              <button
                type="button"
                aria-label="장소 추가"
                onClick={openAddPlace}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#076818',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 5px 14px rgba(7,104,24,0.2)',
                }}
              >
                <Plus size={19} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Store list */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '0 16px 104px',
            scrollPaddingBottom: 104,
          }}>
            {filteredStores.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 14 }}>
                검색 결과가 없어요
              </div>
            )}
            {filteredStores.map((store) => {
              const i = stores.indexOf(store)
              const isSelected = selectedStore?.name === store.name
              const storeKey = store.id || `${store.name}-${i}`
              const isHovered = hoveredPlaceId === storeKey
              const CatIcon = activeCat.icon
              const institutionRecommendations = getInstitutionRecommendationTypes(store)
              const recommendCount = getRecommendedCount(store, recommendations)
              return (
                <div
                  key={storeKey}
                  onClick={() => handleStoreClick(store)}
                  onMouseEnter={() => setHoveredPlaceId(storeKey)}
                  onMouseLeave={() => setHoveredPlaceId(null)}
                  style={{
                    position: 'relative',
                    borderRadius: 22, marginBottom: 10,
                    background: '#fff',
                    border: 'none',
                    boxShadow: isSelected
                      ? '0 5px 20px rgba(7,104,24,0.16)'
                      : isHovered
                        ? '0 7px 22px rgba(31,45,35,0.11)'
                        : '0 4px 18px rgba(31,45,35,0.08)',
                    cursor: 'pointer', overflow: 'hidden',
                    transition: 'box-shadow 0.18s ease, transform 0.18s ease',
                    transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                  }}
                >
                  {store.userAdded && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        aria-label={`${store.name} 수정`}
                        onClick={event => openEditPlace(event, store)}
                        style={{ padding: 3, border: 'none', background: 'transparent', color: '#076818', display: 'inline-flex', cursor: 'pointer' }}
                      >
                        <Pencil size={18} strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        aria-label={`${store.name} 삭제`}
                        onClick={event => {
                          event.stopPropagation()
                          setDeleteTarget(store)
                        }}
                        style={{ padding: 3, border: 'none', background: 'transparent', color: '#d93025', display: 'inline-flex', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} strokeWidth={2.2} />
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 14px 12px' }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                      background: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 0,
                      transition: 'background 0.18s',
                    }}>
                      <CatIcon size={24} color={activeCat.color} strokeWidth={2.2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: store.userAdded ? 36 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, minWidth: 0 }}>
                        <p style={{
                          fontSize: 18,
                          lineHeight: 1.35,
                          fontWeight: 700,
                          color: '#1f2433',
                          letterSpacing: 0,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {store.name}
                        </p>
                        {store.userAdded && (
                          <span style={{
                            flexShrink: 0,
                            fontSize: 11, fontWeight: 650, color: '#076818',
                            background: '#e8f3e8', borderRadius: 6,
                            padding: '2px 6px', letterSpacing: '-0.1px',
                          }}>
                            직접 추가
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7, minHeight: 19 }}>
                        {(Number(store.rating) > 0 || Number(store.reviews) > 0) && (
                          <>
                            <span style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 650, color: '#d98200' }}>★ {store.rating}</span>
                            <span style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 550, color: '#4d554a' }}>({store.reviews})</span>
                          </>
                        )}
                        {recommendCount > 0 && (
                          <>
                            <span style={{ fontSize: 12, color: '#777' }}>·</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 13, lineHeight: 1.35, fontWeight: 650, color: '#076818' }}>
                              <ThumbsUp size={12} strokeWidth={2.4} /> {recommendCount}
                            </span>
                          </>
                        )}
                        {userPos && Number.isFinite(Number(store.lat)) && Number.isFinite(Number(store.lng)) && (
                          <>
                            <span style={{ fontSize: 12, color: '#777' }}>·</span>
                            <span style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 550, color: '#4d554a' }}>{haversine(userPos.lat, userPos.lng, store.lat, store.lng)}</span>
                          </>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '17px minmax(0, 1fr)', alignItems: 'center', columnGap: 6, marginBottom: 4 }}>
                        <MapPin size={15} color="#6d766a" strokeWidth={2.1} />
                        <span style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 550, color: '#4d554a', letterSpacing: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {store.address}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '17px minmax(0, 1fr)', alignItems: 'center', columnGap: 6 }}>
                        <Clock size={15} color="#6d766a" strokeWidth={2.1} />
                        <span style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 550, color: '#4d554a', letterSpacing: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {store.hours}
                        </span>
                      </div>
                    </div>
                    {(institutionRecommendations.length > 0 || recommendCount >= 5) && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        gap: 8,
                        flexShrink: 0,
                        marginTop: 0,
                      }}>
                        {institutionRecommendations.length > 0 && (
                          <InstitutionRecommendationBadge types={institutionRecommendations} />
                        )}
                        {recommendCount >= 5 && (
                          <ResidentRecommendationBadge count={recommendCount} />
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 14px' }}>
                    <button
                      className="app-action-button app-content-action-button"
                      onClick={e => { e.stopPropagation(); openDetail(store) }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 14px',
                        background: '#076818',
                        border: 'none',
                        borderRadius: 999,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>자세히 보기</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {addPlaceOpen && (
        <div
          onClick={closePlaceForm}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 320,
            background: 'rgba(20,24,20,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <form
            onSubmit={handleAddPlace}
            onClick={event => event.stopPropagation()}
            style={{
              width: 'min(100%, 390px)',
              maxHeight: 'calc(100dvh - 40px)',
              overflowY: 'auto',
              position: 'relative',
              boxSizing: 'border-box',
              background: '#FFFFFF',
              borderRadius: 24,
              padding: '22px 20px 24px',
              boxShadow: '0 18px 50px rgba(22,35,24,0.24)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 750, color: '#1f2433' }}>{editingPlaceId ? '내 장소 수정' : '내 장소 추가'}</h2>
                {editingPlaceId && (
                  <p style={{ margin: '5px 0 0', fontSize: 12, color: '#888' }}>등록한 장소 정보를 수정해 주세요.</p>
                )}
              </div>
              <button type="button" aria-label="닫기" onClick={closePlaceForm} disabled={addPlaceLoading} style={{ width: 34, height: 34, border: 'none', borderRadius: '50%', background: '#f4f5f2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} color="#6f776d" />
              </button>
            </div>

            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 650, color: '#333' }}>장소 이름</span>
              <input
                value={newPlace.name}
                onChange={event => setNewPlace(current => ({ ...current, name: event.target.value }))}
                placeholder="예: 옥천 귀농인 모임방"
                style={{ width: '100%', height: 48, boxSizing: 'border-box', borderRadius: 14, border: '1.5px solid #e4e6e2', padding: '0 14px', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
              />
            </label>

            <div style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 650, color: '#333' }}>주소</span>
              <button
                type="button"
                onClick={openPostcode}
                style={{ width: '100%', minHeight: 48, boxSizing: 'border-box', borderRadius: 14, border: '1.5px solid #e4e6e2', padding: '0 14px', background: '#FFFFFF', fontFamily: 'inherit', fontSize: 14, color: newPlace.address ? '#333' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, textAlign: 'left', cursor: 'pointer' }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {newPlace.address || '카카오 주소 검색'}
                </span>
                <MapPin size={18} color="#076818" strokeWidth={2.3} style={{ flexShrink: 0 }} />
              </button>
            </div>

            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 650, color: '#333' }}>전화번호</span>
              <input
                type="tel"
                inputMode="tel"
                value={newPlace.phone}
                onChange={event => setNewPlace(current => ({ ...current, phone: event.target.value }))}
                placeholder="예: 043-730-0000"
                style={{ width: '100%', height: 48, boxSizing: 'border-box', borderRadius: 14, border: '1.5px solid #e4e6e2', padding: '0 14px', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 650, color: '#333' }}>운영 시간 <span style={{ color: '#888', fontWeight: 500 }}>(선택)</span></span>
              <input
                value={newPlace.hours}
                onChange={event => setNewPlace(current => ({ ...current, hours: event.target.value }))}
                placeholder="예: 평일 09:00 - 18:00"
                style={{ width: '100%', height: 48, boxSizing: 'border-box', borderRadius: 14, border: '1.5px solid #e4e6e2', padding: '0 14px', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
              />
            </label>

            <div style={{ marginBottom: 14 }}>
              <SelectField
                label="카테고리"
                value={newPlace.category}
                onChange={category => setNewPlace(current => ({ ...current, category }))}
                options={USER_PLACE_CATEGORIES.map(category => ({ value: category, label: category }))}
              />
            </div>

            <label style={{ display: 'block', marginBottom: 8 }}>
              <span style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 650, color: '#333' }}>메모 <span style={{ color: '#888', fontWeight: 500 }}>(선택)</span></span>
              <textarea
                value={newPlace.memo}
                onChange={event => setNewPlace(current => ({ ...current, memo: event.target.value }))}
                placeholder="이 장소에 대한 정보를 간단히 적어주세요."
                rows={3}
                style={{ width: '100%', minHeight: 72, boxSizing: 'border-box', resize: 'vertical', borderRadius: 14, border: '1.5px solid #e4e6e2', padding: '12px 14px', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5, outline: 'none' }}
              />
            </label>

            <div
              ref={postcodeLayerRef}
              style={{ display: 'none', position: 'absolute', inset: 16, overflow: 'hidden', zIndex: 5, background: '#FFFFFF', border: '2px solid #076818', borderRadius: 18, boxShadow: '0 12px 30px rgba(22,35,24,0.22)' }}
            >
              <button type="button" aria-label="주소 검색 닫기" onClick={closePostcode} style={{ position: 'absolute', right: 8, top: 8, zIndex: 6, width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} color="#555" />
              </button>
            </div>

            {addPlaceError && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#d93025' }}>{addPlaceError}</p>}

            <button
              className="app-action-button"
              type="submit"
              disabled={addPlaceLoading}
              style={{ width: '54%', minWidth: 180, minHeight: 48, margin: '18px auto 0', border: 'none', borderRadius: 999, background: '#076818', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: addPlaceLoading ? 'wait' : 'pointer', opacity: addPlaceLoading ? 0.65 : 1 }}
            >
              {addPlaceLoading ? '장소를 찾는 중...' : editingPlaceId ? '수정 완료' : '장소 추가'}
            </button>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 340,
            background: 'rgba(20,24,20,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-place-title"
            onClick={event => event.stopPropagation()}
            style={{
              width: 'min(100%, 330px)',
              boxSizing: 'border-box',
              borderRadius: 24,
              border: '1.5px solid #cfe2c8',
              background: '#FFFFFF',
              padding: '24px 22px 20px',
              textAlign: 'center',
              boxShadow: '0 18px 50px rgba(22,35,24,0.22)',
            }}
          >
            <span style={{ width: 48, height: 48, margin: '0 auto 14px', borderRadius: '50%', background: '#fff0ef', color: '#d93025', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={22} strokeWidth={2.2} />
            </span>
            <h2 id="delete-place-title" style={{ margin: 0, fontSize: 18, fontWeight: 750, color: '#1f2433' }}>
              장소를 삭제하시겠어요?
            </h2>
            <p style={{ margin: '9px 0 20px', fontSize: 13, lineHeight: 1.5, color: '#777', wordBreak: 'keep-all' }}>
              직접 추가한 ‘{deleteTarget.name}’ 장소 정보가 삭제됩니다.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              <button
                className="app-action-button"
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletePlaceLoading}
                style={{ minHeight: 44, borderRadius: 999, border: '1.5px solid #dfe4dc', background: '#FFFFFF', color: '#555', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                className="app-action-button"
                type="button"
                onClick={handleDeletePlace}
                disabled={deletePlaceLoading}
                style={{ minHeight: 44, borderRadius: 999, border: 'none', background: '#d93025', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: deletePlaceLoading ? 'wait' : 'pointer', opacity: deletePlaceLoading ? 0.65 : 1 }}
              >
                {deletePlaceLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <ResidentRecommendationBadge
              count={getRecommendedCount(detailPopup, recommendations)}
              large
            />
            <InstitutionRecommendationBadge
              types={getInstitutionRecommendationTypes(detailPopup)}
              large
            />

            {detailLoading ? (
              <p style={{ fontSize: 14, color: '#aaa', textAlign: 'center', padding: '12px 0' }}>불러오는 중...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { Icon: MapPin, value: detailPopup.kakaoResult?.address || detailPopup.address },
                  { Icon: Phone, value: detailPopup.kakaoResult?.phone || detailPopup.phone },
                  { Icon: MessageSquareText, value: detailPopup.memo },
                  { Icon: Clock, value: detailPopup.hours },
                ].filter(({ value }) => value).map(({ Icon, value }) => (
                  <div key={value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Icon size={16} color="#888" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#1a1a1a', letterSpacing: '-0.1px', lineHeight: 1.5 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              className="app-action-button"
              type="button"
              onClick={() => handleRecommendPlace(detailPopup)}
              aria-pressed={isPlaceRecommended(detailPopup, recommendations)}
              style={{
                width: '76%',
                minWidth: 210,
                margin: '0 auto',
                borderRadius: 999,
                border: isPlaceRecommended(detailPopup, recommendations) ? '1px solid transparent' : '1px solid #e0e3de',
                background: isPlaceRecommended(detailPopup, recommendations) ? GREEN : '#f1f3f0',
                color: isPlaceRecommended(detailPopup, recommendations) ? '#FFFFFF' : '#555b55',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 750,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                cursor: 'pointer',
                boxShadow: isPlaceRecommended(detailPopup, recommendations) ? '0 5px 14px rgba(7,104,24,0.16)' : 'none',
                transition: 'background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease',
              }}
            >
              <ThumbsUp
                size={16}
                strokeWidth={2.3}
                fill={isPlaceRecommended(detailPopup, recommendations) ? '#FFFFFF' : 'none'}
              />
              {isPlaceRecommended(detailPopup, recommendations) ? '추천 취소' : '옥천 주민 추천하기'}
              <span style={{
                minWidth: 24,
                height: 24,
                padding: '0 6px',
                borderRadius: 999,
                background: isPlaceRecommended(detailPopup, recommendations) ? 'rgba(255,255,255,0.2)' : '#e2e5e0',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                fontSize: 11.5,
                fontWeight: 750,
              }}>
                {getRecommendedCount(detailPopup, recommendations)}
              </span>
            </button>

            {(!detailPopup.locationPrivate || detailPopup.kakaoResult?.phone || detailPopup.phone) && (
              <div style={{ display: 'flex', gap: 10 }}>
                {!detailPopup.locationPrivate && (
                  <a
                    className="app-action-button"
                    href={getKakaoMapUrl(detailPopup)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ flex: 1, padding: '13px 0', borderRadius: 50, background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#555', fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    지도에서 보기
                  </a>
                )}
                {(detailPopup.kakaoResult?.phone || detailPopup.phone) && (
                  <a
                    className="app-action-button"
                    href={`tel:${detailPopup.kakaoResult?.phone || detailPopup.phone}`}
                    style={{ flex: 1, padding: '13px 0', borderRadius: 50, background: '#076818', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'inherit' }}
                  >
                    전화하기
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
