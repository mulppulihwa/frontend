import { Home, Map } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const items = [
  { label: '홈', path: '/home', icon: Home },
  { label: '지도', path: '/map', icon: Map },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      aria-label="주요 메뉴"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(100%, 430px)',
        height: 'calc(70px + env(safe-area-inset-bottom))',
        padding: '8px 54px max(8px, env(safe-area-inset-bottom))',
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        alignItems: 'center',
        background: '#FFFFFF',
        borderTop: '1px solid #ecece8',
        zIndex: 120,
      }}
    >
      {items.map(({ label, path, icon: Icon }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            type="button"
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            onClick={() => navigate(path)}
            style={{
              width: 52,
              height: 52,
              justifySelf: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '50%',
              background: active ? '#e8f3e8' : 'transparent',
              color: active ? '#076818' : '#9a9a96',
              cursor: 'pointer',
            }}
          >
            <Icon size={24} strokeWidth={active ? 2.4 : 2} />
          </button>
        )
      })}
    </nav>
  )
}
