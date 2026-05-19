import { Check, Clock3, X } from 'lucide-react'

const statuses = [
  { key: '신청완료', label: '신청 완료', Icon: Check,  activeColor: '#2d6a2d', activeBg: '#e8f3e8' },
  { key: '신청예정', label: '신청 예정', Icon: Clock3, activeColor: '#FFA100', activeBg: '#fff3e0' },
  { key: '관심없음', label: '관심 없음', Icon: X,       activeColor: '#d93025', activeBg: '#fff0ef' },
]

export default function StatusCheckboxes({ value, onChange }) {
  return (
    <div style={{
      display: 'flex',
      background: '#fff',
      border: '1.5px solid #e8e8e8',
      borderRadius: 16,
      padding: 4,
      gap: 4,
    }}>
      {statuses.map(({ key, label, Icon, activeColor, activeBg }) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(active ? null : key)}
            style={{
              flex: 1,
              minHeight: 54,
              padding: '8px 4px',
              border: '1.5px solid transparent',
              borderRadius: 12,
              background: active ? activeBg : 'transparent',
              boxShadow: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 500,
              color: active ? activeColor : '#444',
              letterSpacing: '-0.2px',
              transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Icon size={16} strokeWidth={2.4} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
