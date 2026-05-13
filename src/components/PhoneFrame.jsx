export default function PhoneFrame({ children }) {
  return (
    <div style={{
      width: 390,
      height: 844,
      background: '#fff',
      borderRadius: 40,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{
        height: 44,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <rect x="0" y="3" width="3" height="9" rx="1" fill="#000"/>
            <rect x="4.5" y="2" width="3" height="10" rx="1" fill="#000"/>
            <rect x="9" y="0" width="3" height="12" rx="1" fill="#000"/>
            <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="#000" opacity="0.3"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M1 6C1 6 5 2 12 2C19 2 23 6 23 6" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
            <path d="M4 9.5C4 9.5 7 7 12 7C17 7 20 9.5 20 9.5" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
            <path d="M7.5 13C7.5 13 9.5 11 12 11C14.5 11 16.5 13 16.5 13" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="17" r="1.5" fill="#000"/>
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#000" strokeOpacity="0.35"/>
            <rect x="2" y="2" width="16" height="8" rx="2" fill="#000"/>
            <path d="M23 4.5V7.5C23.8 7.2 24.5 6.4 24.5 6C24.5 5.6 23.8 4.8 23 4.5Z" fill="#000" opacity="0.4"/>
          </svg>
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}
