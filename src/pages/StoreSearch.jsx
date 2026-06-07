import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, X, MapPin, Phone } from 'lucide-react'
import { fetchPlaces } from '../lib/api'
import { getPlaceCategories, getPlaceCategoryMeta } from '../lib/placeCategories'
import { filterPlacesByPolicy } from '../lib/placePolicyFilter'

export default function StoreSearch() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const relatedPolicy = state?.policy || null
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [stores, setStores] = useState([])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    let active = true
    fetchPlaces()
      .then(places => {
        if (active) setStores(filterPlacesByPolicy(places, relatedPolicy))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [relatedPolicy])

  const filtered = query.trim()
    ? stores.filter(s => s.name.includes(query) || s.address.includes(query))
    : []
  const categories = getPlaceCategories(stores)
  const categoryCounts = stores.reduce((acc, s) => {
    if (s.category) acc[s.category] = (acc[s.category] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>

      {/* Search header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px', background: '#FDFCF8', flexShrink: 0 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0 }}
        >
          <ArrowLeft size={22} color="#1a1a1a" strokeWidth={2} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 100, padding: '11px 14px', border: '1.5px solid #e8e8e8' }}>
          <Search size={16} color="#bbb" strokeWidth={2.2} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="장소 또는 주소 검색"
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 14, color: '#1a1a1a', fontFamily: 'inherit', letterSpacing: '-0.1px' }}
          />
          {query.length > 0 && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={15} color="#bbb" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Registered place categories */}
      {categories.length > 0 && (
        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', flexShrink: 0 }}>
          {categories.map(cat => {
            const Icon = cat.icon
            return (
              <div
                key={cat.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
                  padding: '8px 14px', borderRadius: 24,
                  background: cat.bg,
                  fontFamily: 'inherit',
                }}
              >
                <Icon size={15} color={cat.color} strokeWidth={2.2} />
                <span style={{ fontSize: 13, fontWeight: 700, color: cat.color, letterSpacing: '-0.1px' }}>
                  {cat.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: cat.color, opacity: 0.65 }}>
                  {categoryCounts[cat.id] || 0}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {query.trim() === '' && (
          <p style={{ textAlign: 'center', color: '#bbb', fontSize: 14, marginTop: 40 }}>
            {relatedPolicy ? `${relatedPolicy.title} 관련 사용처를 검색해보세요` : '찾고 싶은 장소를 검색해보세요'}
          </p>
        )}
        {query.trim() !== '' && filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#bbb', fontSize: 14, marginTop: 40 }}>검색 결과가 없어요</p>
        )}
        {filtered.map((store, i) => {
          const cat = categories.find(c => c.id === store.category) || getPlaceCategoryMeta(store.category)
          const Icon = cat.icon
          return (
            <div key={i} style={{ background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 30, overflow: 'hidden' }}>
              <div
                onClick={() => navigate('/map', { state: { store, policy: relatedPolicy } })}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 12px', cursor: 'pointer' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={cat.color} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.2px', marginBottom: 3 }}>{store.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color="#888" strokeWidth={2} />
                    <span style={{ fontSize: 13, color: '#888', letterSpacing: '-0.1px' }}>{store.address}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', borderTop: '1.5px solid #ebebeb' }}>
                <a
                  href={`tel:${store.phone}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', textDecoration: 'none', borderRight: '1.5px solid #ebebeb' }}
                >
                  <Phone size={14} color="#076818" strokeWidth={2.5} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#076818', fontFamily: 'inherit' }}>전화하기</span>
                </a>
                <a
                  href={`https://map.kakao.com/?q=${encodeURIComponent(store.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', textDecoration: 'none' }}
                >
                  <MapPin size={14} color="#FFA100" strokeWidth={2.5} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#FFA100', fontFamily: 'inherit' }}>지도 보기</span>
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
