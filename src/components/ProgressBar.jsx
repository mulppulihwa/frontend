export default function ProgressBar({ value }) {
  return (
    <div style={{ height: 5, background: '#e8e8e8', borderRadius: 999 }}>
      <div style={{
        height: '100%',
        width: `${value}%`,
        background: '#2d6a2d',
        borderRadius: 999,
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}
