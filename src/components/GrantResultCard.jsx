import { Clock, Banknote, ArrowUpRight, CalendarDays } from 'lucide-react'

export default function GrantResultCard({
  grant,
  onViewDetail,
}) {
  const reasons = grant.reasons ?? []
  const countdown = grant.countdown ?? { days: 0, hours: 0, minutes: 0 }
  const countdownDays = Number(countdown.days)
  const countdownColor = !grant.deadline || !Number.isFinite(countdownDays)
    ? '#777'
    : countdownDays <= 20
      ? '#d93025'
      : '#076818'

  return (
    <div style={{
      background: 'linear-gradient(135deg, #e8f3e8 0%, #fff7e8 100%)',
      border: 'none',
      borderRadius: 22,
      boxShadow: '0 4px 18px rgba(31,45,35,0.08)',
      padding: 18,
      height: 330,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Title + detail action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12, minHeight: 70 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1f2433', letterSpacing: 0, lineHeight: 1.32, wordBreak: 'keep-all', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{grant.title}</p>
          <p style={{ fontSize: 13, fontWeight: 550, color: '#4d554a', marginTop: 5, lineHeight: 1.35, letterSpacing: 0, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{grant.agency}</p>
        </div>
        <button
          type="button"
          onClick={onViewDetail}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            minHeight: 34,
            border: 'none',
            borderRadius: 999,
            padding: '0 14px',
            background: 'rgba(255,255,255,0.8)',
            color: '#076818',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          자세히 보기
          <ArrowUpRight size={14} strokeWidth={2.2} />
        </button>
      </div>

      {/* Amount */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minHeight: 42, marginBottom: 10 }}>
        <Banknote size={16} color="#076818" strokeWidth={2.2} />
        <p style={{ fontSize: 13, fontWeight: 650, color: '#076818', lineHeight: 1.35, letterSpacing: 0, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{grant.subtitle}</p>
      </div>

      {/* Match reason */}
      {reasons.length > 0 && (
        <div className="no-scrollbar" style={{ background: '#FFFFFF', borderRadius: 14, padding: '10px 14px', marginBottom: 10, minHeight: 72, overflowY: 'auto', boxSizing: 'border-box' }}>
          <p style={{ fontSize: 13, fontWeight: 650, color: '#4d554a', lineHeight: 1.35, marginBottom: 7 }}>해당 이유</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {reasons.map((reason) => (
              <div key={reason} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#076818', flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 550, color: '#4d554a', lineHeight: 1.35 }}>{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dates + countdown */}
      <div style={{ marginTop: 'auto', padding: '8px 0 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={14} color="#076818" strokeWidth={2.2} />
            <p style={{ fontSize: 13, fontWeight: 650, color: '#1f2433', lineHeight: 1.35 }}>신청 기간</p>
          </div>
          <p style={{ fontSize: 13, fontWeight: 550, color: '#4d554a', lineHeight: 1.35 }}>{grant.period}</p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          color: countdownColor,
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <Clock size={13} color={countdownColor} strokeWidth={2} />
            <span>마감까지</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, minWidth: 0 }}>
            {[[countdown.days, '일'], [countdown.hours, '시간'], [countdown.minutes, '분']].map(([val, unit]) => (
              <span key={unit} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                <span>{Number(val)}</span>
                <span style={{ fontWeight: 600 }}>
                  {unit}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
