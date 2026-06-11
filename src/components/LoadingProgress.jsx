export default function LoadingProgress({ progress, label, detail }) {
  const value = Math.max(0, Math.min(100, Math.round(progress)))
  const progressAngle = value * 3.6

  return (
    <div style={{
      width: 'min(100%, 300px)',
      padding: '24px 22px 22px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
      textAlign: 'center',
      border: '1px solid rgba(173, 202, 147, 0.48)',
      borderRadius: 24,
      background: 'linear-gradient(145deg, #eef8e9 0%, #f8f7df 52%, #fff2bd 100%)',
      boxShadow: '0 14px 34px rgba(67, 92, 43, 0.08)',
    }}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        style={{
          width: 112,
          height: 112,
          padding: 8,
          borderRadius: '50%',
          background: `conic-gradient(from -90deg, #087326 0deg, #8ebf4f ${progressAngle * 0.72}deg, #f2bd3d ${progressAngle}deg, rgba(255, 255, 255, 0.66) ${progressAngle}deg 360deg)`,
          boxShadow: '0 10px 24px rgba(67, 104, 34, 0.14)',
          transition: 'background 0.25s ease',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.94)',
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.9)',
          }}
        >
          <strong style={{
            fontSize: 25,
            lineHeight: 1,
            fontWeight: 750,
            color: value === 100 ? '#076818' : '#28472b',
          }}>
            {value}
            <span style={{ marginLeft: 2, fontSize: 12, fontWeight: 650 }}>%</span>
          </strong>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: '#1f2433', letterSpacing: '-0.1px' }}>
          {label}
        </p>
        {detail && (
          <p style={{ margin: 0, fontSize: 12, fontWeight: 400, color: '#74796f' }}>
            {detail}
          </p>
        )}
      </div>
    </div>
  )
}
