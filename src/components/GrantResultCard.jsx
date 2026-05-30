import { Fragment } from 'react'
import { Clock, Banknote, ArrowUpRight, CalendarDays } from 'lucide-react'

export default function GrantResultCard({
  grant,
  statusConfig,
  onViewDetail,
}) {
  const statusCfg = statusConfig?.[grant.status]
  const reasons = grant.reasons ?? []
  const countdown = grant.countdown ?? { days: 0, hours: 0, minutes: 0 }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #e8f3e8 0%, #fff7e8 100%)',
      border: '1px solid rgba(218,231,211,0.9)',
      borderRadius: 28,
      padding: '20px 20px 14px',
    }}>
      {/* Title + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#1f2433', letterSpacing: '-0.4px', lineHeight: 1.3, wordBreak: 'keep-all' }}>{grant.title}</p>
          <p style={{ fontSize: 13, fontWeight: 400, color: '#5a7a5e', marginTop: 5, letterSpacing: '-0.1px' }}>{grant.agency}</p>
        </div>
        {statusCfg && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 34,
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 999,
            padding: '0 14px',
            color: statusCfg.color,
            background: 'rgba(255,255,255,0.7)',
            letterSpacing: '-0.2px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {statusCfg.label}
          </span>
        )}
      </div>

      {/* Amount */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Banknote size={16} color="#076818" strokeWidth={2.2} />
        <p style={{ fontSize: 14, fontWeight: 600, color: '#076818', letterSpacing: '-0.2px' }}>{grant.subtitle}</p>
      </div>

      {/* Match reason */}
      {reasons.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 14, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#5a7a5e', letterSpacing: '-0.1px', marginBottom: 6 }}>해당 이유</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {reasons.map((reason) => (
              <div key={reason} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#076818', flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 500, color: '#1f2433', letterSpacing: '-0.1px' }}>{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dates + countdown */}
      <div style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 14, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={14} color="#076818" strokeWidth={2.2} />
            <p style={{ fontSize: 13, fontWeight: 500, color: '#1f2433', letterSpacing: '-0.1px' }}>신청 기간</p>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#555', letterSpacing: '-0.2px' }}>{grant.period}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <Clock size={13} color="#076818" strokeWidth={2} />
          <p style={{ fontSize: 13, fontWeight: 500, color: '#1f2433', letterSpacing: '-0.1px' }}>마감까지</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto', alignItems: 'center', columnGap: 5 }}>
          {[[countdown.days, '일'], [countdown.hours, '시간'], [countdown.minutes, '분']].map(([val, unit]) => (
            <Fragment key={unit}>
              <div style={{
                minHeight: 44,
                borderRadius: 12,
                background: '#fff',
                border: '1px solid rgba(218,231,211,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#1f2433', letterSpacing: '-0.5px', lineHeight: 1 }}>
                  {Number(val)}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#5a7a5e', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
                {unit}
              </span>
            </Fragment>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onViewDetail}
        style={{
          marginTop: 10,
          width: '100%',
          minHeight: 36,
          border: 'none',
          background: 'transparent',
          color: '#076818',
          fontFamily: 'inherit',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '-0.1px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
          padding: 0,
        }}
      >
        자세히 보기 <ArrowUpRight size={16} strokeWidth={2.2} />
      </button>
    </div>
  )
}
