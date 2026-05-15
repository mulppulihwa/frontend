const styles = {
  primary: {
    background: '#2d6a2d',
    color: '#fff',
    border: 'none',
  },
  outline: {
    background: '#fff',
    color: '#2d6a2d',
    border: '2px solid #2d6a2d',
  },
  ghost: {
    background: '#fff',
    color: '#1a1a1a',
    border: '1.5px solid #e0e0e0',
  },
}

export default function Button({ children, variant = 'primary', onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        minHeight: 58,
        padding: '16px',
        borderRadius: 18,
        fontSize: 18,
        fontWeight: 600,
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
