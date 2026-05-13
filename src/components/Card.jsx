export default function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 22,
      border: '1.5px solid #e8e8e8',
      padding: '16px 18px',
      ...style,
    }}>
      {children}
    </div>
  )
}
