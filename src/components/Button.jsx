const styles = {
  primary: {
    background: '#2d6a2d',
    color: '#fff',
    border: 'none',
    minHeight: 58,
    padding: '16px',
    borderRadius: 18,
    fontSize: 16,
    fontWeight: 600,
  },
  pill: {
    background: '#2d6a2d',
    color: '#fff',
    border: 'none',
    minHeight: 'unset',
    padding: '14px 0',
    borderRadius: 50,
    fontSize: 15,
    fontWeight: 700,
  },
  outline: {
    background: '#fff',
    color: '#2d6a2d',
    border: '2px solid #2d6a2d',
    minHeight: 58,
    padding: '16px',
    borderRadius: 18,
    fontSize: 16,
    fontWeight: 600,
  },
  ghost: {
    background: '#fff',
    color: '#1a1a1a',
    border: '1.5px solid #e0e0e0',
    minHeight: 58,
    padding: '16px',
    borderRadius: 18,
    fontSize: 16,
    fontWeight: 600,
  },
}

export default function Button({ children, variant = 'primary', onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        letterSpacing: '-0.2px',
        opacity: disabled ? 0.35 : 1,
        transition: 'opacity 0.15s ease',
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}
