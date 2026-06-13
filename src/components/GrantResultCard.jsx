import { Fragment } from 'react'
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
      border: '1px solid rgba(218,231,211,0.9)',
      borderRadius: 28,
      padding: '20px 20px 14px',
    }}>
      {/* Title + detail action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 18, fontWeight: 750, color: '#1f2433', letterSpacing: '-0.2px', lineHeight: 1.4, wordBreak: 'keep-all' }}>{grant.title}</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#4f7054', marginTop: 5, lineHeight: 1.45 }}>{grant.agency}</p>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Banknote size={16} color="#076818" strokeWidth={2.2} />
        <p style={{ fontSize: 15, fontWeight: 700, color: '#076818', lineHeight: 1.45 }}>{grant.subtitle}</p>
      </div>

      {/* Match reason */}
      {reasons.length > 0 && (
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#4f7054', marginBottom: 7 }}>해당 이유</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {reasons.map((reason) => (
              <div key={reason} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#076818', flexShrink: 0 }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: '#1f2433', lineHeight: 1.45 }}>{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dates + countdown */}
      <div style={{ padding: '12px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={14} color="#076818" strokeWidth={2.2} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2433' }}>신청 기간</p>
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#444' }}>{grant.period}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <Clock size={13} color={countdownColor} strokeWidth={2} />
          <p style={{ fontSize: 14, fontWeight: 700, color: countdownColor }}>마감까지</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto', alignItems: 'center', columnGap: 5 }}>
          {[[countdown.days, '일'], [countdown.hours, '시간'], [countdown.minutes, '분']].map(([val, unit]) => (
            <Fragment key={unit}>
              <div style={{
                minHeight: 44,
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: countdownColor, letterSpacing: '-0.5px', lineHeight: 1 }}>
                  {Number(val)}
                </span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: countdownColor, whiteSpace: 'nowrap' }}>
                {unit}
              </span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
