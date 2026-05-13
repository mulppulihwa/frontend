import { Search, Home as HomeIcon, Compass, Sparkles, User, Star, MapPin } from 'lucide-react'

const categories = ['All', 'Food', 'Places', 'Activities', 'Shopping']

const recommendations = [
  { id: 1, title: 'Sushi Masa', tag: 'Japanese · 0.8 km', rating: 4.8, img: '🍣', color: '#fff4e6' },
  { id: 2, title: 'Lumpini Park', tag: 'Outdoor · 1.2 km', rating: 4.6, img: '🌿', color: '#e6f4ec' },
  { id: 3, title: 'Terminal 21', tag: 'Shopping · 2.0 km', rating: 4.5, img: '🛍️', color: '#e6eeff' },
  { id: 4, title: 'Muay Thai Gym', tag: 'Sport · 1.5 km', rating: 4.7, img: '🥊', color: '#fdecea' },
]

const navItems = [
  { icon: HomeIcon, label: 'Home', active: true },
  { icon: Compass, label: 'Explore' },
  { icon: Sparkles, label: 'For You' },
  { icon: User, label: 'Profile' },
]

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fafafa' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 12px', background: '#fff' }}>
        <p style={{ fontSize: 13, color: '#999', marginBottom: 2 }}>Good morning 👋</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
          What are you<br />looking for today?
        </h1>

        {/* Search bar */}
        <div style={{
          marginTop: 16,
          background: '#f2f2f2',
          borderRadius: 14,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Search size={16} color="#aaa" />
          <span style={{ fontSize: 14, color: '#aaa' }}>Search places, food, activities…</span>
        </div>
      </div>

      {/* Category pills */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '12px 20px',
        overflowX: 'auto',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
      }}>
        {categories.map((cat, i) => (
          <div key={cat} style={{
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            background: i === 0 ? '#111' : '#f2f2f2',
            color: i === 0 ? '#fff' : '#555',
            cursor: 'pointer',
          }}>
            {cat}
          </div>
        ))}
      </div>

      {/* AI Picks banner */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #6c47ff 0%, #a855f7 100%)',
          borderRadius: 18,
          padding: '16px 18px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 11, opacity: 0.8, marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>AI Recommendation</p>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Picked just for you</p>
            <p style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Based on your taste & location</p>
          </div>
          <Sparkles size={32} color="#fff" opacity={0.9} />
        </div>
      </div>

      {/* Recommendation cards */}
      <div style={{ padding: '8px 20px 88px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4 }}>Nearby for you</p>
        {recommendations.map(item => (
          <div key={item.id} style={{
            background: '#fff',
            borderRadius: 18,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: item.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              flexShrink: 0,
            }}>
              {item.img}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{item.title}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <MapPin size={11} color="#aaa" />
                <p style={{ fontSize: 12, color: '#999' }}>{item.tag}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star size={13} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{item.rating}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        width: 480,
        height: 64,
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 8,
        zIndex: 100,
      }}>
        {navItems.map(({ icon: Icon, label, active }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            <Icon size={22} color={active ? '#111' : '#bbb'} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: 10, color: active ? '#111' : '#bbb', fontWeight: active ? 600 : 400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
