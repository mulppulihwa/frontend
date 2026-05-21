import { Fragment } from 'react'
import { Clock, Banknote, ArrowUpRight, CalendarDays } from 'lucide-react'
import Card from './Card'

export default function GrantResultCard({
  grant,
  statusConfig,
  bookmarked = false,
  onToggleBookmark,
  onViewDetail,
}) {
  const statusCfg = statusConfig?.[grant.status]
  const reasons = grant.reasons ?? []
  const countdown = grant.countdown ?? { days: 0, hours: 0, minutes: 0 }

  return (
    <Card style={{ padding: '16px 18px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, paddingRight: 6 }}>
          <p style={{ fontSize: 19, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.4px', lineHeight: 1.28 }}>{grant.title}</p>
          <p style={{ fontSize: 13, fontWeight: 400, color: '#1a1a1a', marginTop: 4, letterSpacing: '-0.1px' }}>{grant.agency}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingTop: 1 }}>
          {statusCfg && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 36,
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 999,
              padding: '0 14px',
              color: statusCfg.color, background: statusCfg.bg,
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap',
            }}>
              {statusCfg.label}
            </span>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #eeeeee', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Banknote size={17} color="#076818" strokeWidth={2.2} />
          <p style={{ fontSize: 14, fontWeight: 500, color: '#076818', letterSpacing: '-0.2px' }}>{grant.subtitle}</p>
        </div>

        <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#888', letterSpacing: '-0.1px', marginBottom: 5 }}>해당 이유</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {reasons.map((reason) => (
              <div key={reason} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#076818', flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.1px' }}>{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #eeeeee', marginTop: 10, paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <CalendarDays size={14} color="#076818" strokeWidth={2.2} />
            <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.1px' }}>신청 기간</p>
          </div>
          <p style={{ fontSize: 13, fontWeight: 400, color: '#555', letterSpacing: '-0.2px', textAlign: 'right' }}>
            {grant.period}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <Clock size={13} color="#076818" strokeWidth={2} />
          <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.1px' }}>마감까지</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto', alignItems: 'center', columnGap: 5 }}>
          {[[countdown.days, '일'], [countdown.hours, '시간'], [countdown.minutes, '분']].map(([val, unit]) => (
            <Fragment key={unit}>
              <div style={{
                minHeight: 44,
                borderRadius: 10,
                background: '#fff',
                border: '1.5px solid #e8e8e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.5px', lineHeight: 1 }}>
                  {Number(val)}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#555', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
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
          fontWeight: 500,
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
    </Card>
  )
}
