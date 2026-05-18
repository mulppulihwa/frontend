import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export default function SelectField({ label, value, options, onChange, required }) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
      {label && (
        <label style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.1px' }}>
          {label}{required && <span style={{ color: '#e53e3e', marginLeft: 2 }}>*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          minHeight: 56,
          padding: '12px 14px',
          border: `1.5px solid ${open || focused ? '#2d6a2d' : '#e8e8e8'}`,
          borderRadius: 16,
          fontSize: 18,
          color: '#1a1a1a',
          background: '#fff',
          fontFamily: 'inherit',
          fontWeight: 400,
          outline: 'none',
          letterSpacing: '-0.2px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxSizing: 'border-box',
          boxShadow: open || focused ? '0 0 0 4px rgba(45,106,45,0.08)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected?.label}</span>
        <ChevronDown
          size={18}
          color="#2d6a2d"
          strokeWidth={2.5}
          style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown list */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: '#fff',
          borderRadius: 18,
          border: '1.5px solid #e8e8e8',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          zIndex: 200,
          overflow: 'hidden',
          maxHeight: 260,
          overflowY: 'auto',
        }}>
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8f8f8' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fff' }}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  border: 'none',
                  borderTop: i > 0 ? '1px solid #f4f4f4' : 'none',
                  background: isSelected ? '#f0f7f0' : '#fff',
                  fontSize: 19,
                  fontFamily: 'inherit',
                  fontWeight: isSelected ? 500 : 400,
                  color: isSelected ? '#2d6a2d' : '#1a1a1a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  letterSpacing: '-0.2px',
                  textAlign: 'left',
                  transition: 'background 0.1s ease',
                }}
              >
                {opt.label}
                {isSelected && <Check size={16} color="#2d6a2d" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
