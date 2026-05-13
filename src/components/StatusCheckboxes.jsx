import { Bookmark, Check, X } from 'lucide-react'

const statuses = [
  { key: '신청예정', label: '신청 예정', Icon: Bookmark, activeColor: '#FFA100' },
  { key: '신청완료', label: '신청 완료', Icon: Check,    activeColor: '#2d6a2d' },
  { key: '관심없음', label: '관심 없음', Icon: X,        activeColor: '#d93025' },
]

export default function StatusCheckboxes({ value, onChange }) {
  return (
    <div style={{
      display: 'flex',
      background: '#f2f2f2',
      borderRadius: 16,
      padding: 4,
      gap: 0,
    }}>
      {statuses.map(({ key, label, Icon, activeColor }) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(active ? null : key)}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: 12,
              background: active ? '#fff' : 'transparent',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 16,
              fontWeight: active ? 700 : 600,
              color: active ? activeColor : '#888',
              letterSpacing: '-0.2px',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Icon size={17} strokeWidth={2.2} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
