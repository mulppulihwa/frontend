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
    <div className="grant-result-card" style={{
      background: 'linear-gradient(135deg, #e8f3e8 0%, #fff7e8 100%)',
      border: '1px solid rgba(218,231,211,0.9)',
      borderRadius: 28,
      padding: '20px 20px 14px',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Title + detail action */}
      <div className="grant-result-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12, minHeight: 70 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 750, color: '#1f2433', letterSpacing: '-0.2px', lineHeight: 1.35, wordBreak: 'keep-all', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{grant.title}</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#4f7054', marginTop: 5, lineHeight: 1.4, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{grant.agency}</p>
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
      <div className="grant-result-card__amount" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minHeight: 42, marginBottom: 10 }}>
        <Banknote size={16} color="#076818" strokeWidth={2.2} />
        <p style={{ fontSize: 15, fontWeight: 700, color: '#076818', lineHeight: 1.4, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{grant.subtitle}</p>
      </div>

      {/* Match reason */}
      <div className="grant-result-card__reason" style={{ background: '#FFFFFF', borderRadius: 14, padding: '10px 14px', marginBottom: 10, height: 72, overflow: 'hidden', boxSizing: 'border-box', flexShrink: 0 }}>
        {reasons.length > 0 ? (
          <>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#4f7054', marginBottom: 7 }}>해당 이유</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {reasons.slice(0, 2).map((reason) => (
              <div key={reason} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#076818', flexShrink: 0 }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: '#1f2433', lineHeight: 1.45, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{reason}</p>
              </div>
            ))}
          </div>
          </>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', color: '#777', fontSize: 13, fontWeight: 500 }}>
            진단 조건에 맞는 정책이에요
          </div>
        )}
      </div>

      {/* Dates + countdown */}
      <div className="grant-result-card__dates" style={{ marginTop: 'auto', padding: '8px 0 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={14} color="#076818" strokeWidth={2.2} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2433' }}>신청 기간</p>
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#444' }}>{grant.period}</p>
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
