import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export default function SelectField({
  label,
  value,
  options,
  onChange,
  required,
  placeholder = '선택해 주세요',
  compact = false,
  ariaLabel,
}) {
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
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 7, position: 'relative' }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 650, color: '#333', letterSpacing: '-0.1px' }}>
          {label}{required && <span style={{ color: '#e53e3e', marginLeft: 2 }}>*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={ariaLabel}
        style={{
          width: '100%',
          height: compact ? 36 : 48,
          minHeight: compact ? 36 : 48,
          padding: compact ? '0 10px' : '0 14px',
          border: `1.5px solid ${open || focused ? '#076818' : '#e4e6e2'}`,
          borderRadius: compact ? 10 : 14,
          fontSize: compact ? 12.5 : 14,
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
          boxShadow: open || focused ? '0 0 0 2px rgba(7,104,24,0.08)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ color: selected ? '#1a1a1a' : '#aaa' }}>{selected?.label || placeholder}</span>
        <ChevronDown
          size={18}
          color="#076818"
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
          borderRadius: compact ? 10 : 14,
          border: '1.5px solid #e4e6e2',
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
                disabled={opt.disabled}
                onClick={() => {
                  if (opt.disabled) return
                  onChange(opt.value)
                  setOpen(false)
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8f8f8' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fff' }}
                style={{
                  width: '100%',
                  minHeight: compact ? 38 : 44,
                  padding: compact ? '8px 10px' : '11px 14px',
                  border: 'none',
                  borderTop: i > 0 ? '1px solid #f4f4f4' : 'none',
                  background: isSelected ? '#f0f7f0' : '#fff',
                  fontSize: compact ? 12.5 : 14,
                  fontFamily: 'inherit',
                  fontWeight: isSelected ? 500 : 400,
                  color: opt.disabled ? '#aaa' : isSelected ? '#076818' : '#1a1a1a',
                  cursor: opt.disabled ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  letterSpacing: '-0.2px',
                  textAlign: 'left',
                  transition: 'background 0.1s ease',
                }}
              >
                {opt.label}
                {isSelected && <Check size={16} color="#076818" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
