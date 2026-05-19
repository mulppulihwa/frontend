import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, X, MapPin, Phone, Tractor, Wallet } from 'lucide-react'

const categories = [
  { id: 'farm', label: '농기구 구입처', icon: Tractor, color: '#2d6a2d', bg: '#e8f3e8' },
  { id: 'local', label: '지역화폐 사용처', icon: Wallet, color: '#FFA100', bg: '#fff3e0' },
]

const stores = [
  { name: '옥천농기계센터', address: '옥천읍 금구리 123', phone: '043-730-1111', category: 'farm' },
  { name: '농협 농자재마트', address: '옥천읍 하계리 45', phone: '043-730-2222', category: 'farm' },
  { name: '금강농기계', address: '옥천읍 문정리 67', phone: '043-730-3333', category: 'farm' },
  { name: '옥천전통시장', address: '옥천읍 문정리 1', phone: '043-730-4444', category: 'local' },
  { name: '하나로마트 옥천점', address: '옥천읍 금구리 200', phone: '043-730-5555', category: 'local' },
  { name: '옥천군 가맹점 일대', address: '옥천읍 일원', phone: '043-730-6666', category: 'local' },
]

export default function StoreSearch() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = query.trim()
    ? stores.filter(s => s.name.includes(query) || s.address.includes(query))
    : []

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
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 16, padding: '11px 14px', border: '1.5px solid #e8e8e8' }}>
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

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {query.trim() === '' && (
          <p style={{ textAlign: 'center', color: '#bbb', fontSize: 14, marginTop: 40 }}>찾고 싶은 장소를 검색해보세요</p>
        )}
        {query.trim() !== '' && filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#bbb', fontSize: 14, marginTop: 40 }}>검색 결과가 없어요</p>
        )}
        {filtered.map((store, i) => {
          const cat = categories.find(c => c.id === store.category)
          const Icon = cat.icon
          return (
            <div key={i} style={{ background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 18, overflow: 'hidden' }}>
              <div
                onClick={() => navigate('/map', { state: { store } })}
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
                  <Phone size={14} color="#2d6a2d" strokeWidth={2.5} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#2d6a2d', fontFamily: 'inherit' }}>전화하기</span>
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
