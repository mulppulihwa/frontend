import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Banknote, Clock, MapPin, Phone } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'

export default function StoreDetail() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const store = state?.store

  if (!store) {
    return (
      <div style={{ minHeight: '100vh', background: '#FDFCF8' }}>
        <TopBar title="상세 정보" />
        <div style={{ padding: '48px 18px', textAlign: 'center', color: '#888', fontSize: 14 }}>
          표시할 사용처 정보가 없어요
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto', overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch', background: '#FDFCF8',
    }}>
      <TopBar title="상세 정보" onBack={() => navigate(-1)} />

      <div style={{ padding: '4px 24px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.4px', lineHeight: 1.4 }}>
          {store.name}
        </p>
        <p style={{ fontSize: 14, fontWeight: 400, color: '#888', marginTop: 4, letterSpacing: '-0.1px' }}>
          {store.category === 'local' ? '지역화폐 사용처' : '농기구 구입처'}
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#e8f3e8', borderRadius: 12, padding: '8px 18px', marginTop: 12,
        }}>
          <Banknote size={16} color="#076818" strokeWidth={2.2} />
          <span style={{ fontSize: 15, fontWeight: 500, color: '#076818', letterSpacing: '-0.2px' }}>API 사용처 정보</span>
        </div>
      </div>

      <div style={{ padding: '0 18px 140px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1.5px solid #e3e3e3' }}>
            <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={16} color="#076818" strokeWidth={2.2} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.1px' }}>매장 정보</p>
          </div>

          {[
            { Icon: MapPin, label: '주소', value: store.address },
            { Icon: Phone, label: '연락처', value: store.phone },
            { Icon: Clock, label: '운영시간', value: store.hours },
          ].filter(({ value }) => value).map(({ Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <Icon size={15} color="#888" strokeWidth={2.2} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#888', letterSpacing: '-0.1px', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px', lineHeight: 1.5 }}>{value}</p>
              </div>
            </div>
          ))}
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 0', borderRadius: 999, background: '#076818', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}
            >
              <Phone size={15} color="#fff" strokeWidth={2.4} />
              전화하기
            </a>
          )}
          <a
            href={`https://map.kakao.com/?q=${encodeURIComponent(store.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 0', borderRadius: 999, background: '#f5f5f5', color: '#555', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}
          >
            <ArrowUpRight size={15} color="#555" strokeWidth={2.4} />
            지도 보기
          </a>
        </div>
      </div>
    </div>
  )
}
