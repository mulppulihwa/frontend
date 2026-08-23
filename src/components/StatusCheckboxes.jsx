import { Check, Clock3, X } from 'lucide-react'

const statuses = [
  { key: '신청완료', label: '신청 완료', Icon: Check,  activeBg: '#e8f3e8', activeColor: '#076818' },
  { key: '신청예정', label: '신청 예정', Icon: Clock3, activeBg: '#fff3e0', activeColor: '#FFA100' },
  { key: '관심없음', label: '관심 없음', Icon: X,       activeBg: '#fff0ef', activeColor: '#d93025' },
]

export default function StatusCheckboxes({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 7 }}>
      {statuses.map(({ key, label, Icon, activeBg, activeColor }) => {
        const active = value === key
        const fgColor = active ? (activeColor || '#fff') : '#999'
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(active ? null : key)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '10px 3px',
              borderRadius: 999,
              border: 'none',
              background: active ? activeBg : '#f7f7f7',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              color: fgColor,
              letterSpacing: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <Icon size={15} strokeWidth={active ? 2.8 : 2.2} color={fgColor} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
