import { Check, Clock3, X } from 'lucide-react'

const statuses = [
  { key: '신청완료', label: '신청 완료', Icon: Check,  activeColor: '#076818', activeBg: '#e8f3e8', activeBorder: '#076818' },
  { key: '신청예정', label: '신청 예정', Icon: Clock3, activeColor: '#d07000', activeBg: '#fff3e0', activeBorder: '#FFA100' },
  { key: '관심없음', label: '관심 없음', Icon: X,       activeColor: '#b52a20', activeBg: '#fff0ef', activeBorder: '#d93025' },
]

export default function StatusCheckboxes({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 7 }}>
      {statuses.map(({ key, label, Icon, activeColor, activeBg, activeBorder }) => {
        const active = value === key
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
              padding: '9px 4px',
              borderRadius: 12,
              border: `1.5px solid ${active ? activeBorder : '#e8e8e8'}`,
              background: active ? activeBg : '#fafafa',
              boxShadow: active ? `0 2px 8px ${activeBorder}22` : 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              color: active ? activeColor : '#999',
              letterSpacing: '-0.2px',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon size={13} strokeWidth={active ? 2.8 : 2.2} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
