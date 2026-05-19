import { useNavigate, useLocation } from 'react-router-dom'
import { Home, MapPin, User } from 'lucide-react'

const tabs = [
  { label: '홈', icon: Home, path: '/home' },
  { label: '사용처', icon: MapPin, path: '/map' },
  { label: '마이페이지', icon: User, path: '/mypage' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 390,
      background: '#fff',
      borderRadius: '28px 28px 0 0',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
      display: 'flex',
      zIndex: 100,
    }}>
      {tabs.map(({ label, icon: Icon, path }) => {
        const active = pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '14px 0 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Icon size={26} color={active ? '#076818' : '#ccc'} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{
              fontSize: 11,
              fontWeight: active ? 700 : 500,
              color: active ? '#076818' : '#ccc',
              letterSpacing: '-0.1px',
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
