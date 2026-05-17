import { Fragment } from 'react'
import { Bookmark, Clock, Banknote, ArrowUpRight, CalendarDays } from 'lucide-react'
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
    <Card style={{ padding: '18px 18px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, paddingRight: 8 }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px', lineHeight: 1.28 }}>{grant.title}</p>
          <p style={{ fontSize: 16, fontWeight: 400, color: '#1a1a1a', marginTop: 5, letterSpacing: '-0.1px' }}>{grant.agency}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingTop: 1 }}>
          {statusCfg && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 34,
              fontSize: 15,
              fontWeight: 500,
              borderRadius: 999,
              padding: '0 12px',
              color: statusCfg.color, background: statusCfg.bg,
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap',
            }}>
              {statusCfg.label}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={bookmarked ? '북마크 해제' : '북마크 추가'}
            style={{
              width: 34,
              height: 34,
              background: '#fff',
              border: '1.5px solid #e8e8e8',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              flexShrink: 0,
            }}
          >
            <Bookmark size={19} color="#2d6a2d" fill={bookmarked ? '#2d6a2d' : 'none'} strokeWidth={2} style={{ transition: 'fill 0.2s ease' }} />
          </button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #eeeeee', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Banknote size={22} color="#2d6a2d" strokeWidth={2.2} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#2d6a2d', letterSpacing: '-0.2px' }}>{grant.subtitle}</p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          background: '#fff',
          border: '1.5px solid #e8e8e8',
          borderRadius: 18,
          padding: '12px 13px',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.1px', marginBottom: 7 }}>해당 이유</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reasons.map((reason) => (
                <div key={reason} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2d6a2d', flexShrink: 0 }} />
                  <p style={{ fontSize: 17, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.1px' }}>{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #eeeeee', marginTop: 14, paddingTop: 14 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 13,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <CalendarDays size={16} color="#2d6a2d" strokeWidth={2.2} />
            <p style={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.1px' }}>
              신청 기간
            </p>
          </div>
          <p style={{ fontSize: 16, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px', textAlign: 'right' }}>
            {grant.period}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Clock size={14} color="#2d6a2d" strokeWidth={2} />
          <p style={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.1px' }}>
            마감까지
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto', alignItems: 'center', columnGap: 7 }}>
          {[[countdown.days, '일'], [countdown.hours, '시간'], [countdown.minutes, '분']].map(([val, unit]) => (
            <Fragment key={unit}>
              <div style={{
                minHeight: 58,
                borderRadius: 15,
                background: '#fff',
                border: '1.5px solid #e8e8e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: 24, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.5px', lineHeight: 1 }}>
                  {Number(val)}
                </span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
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
          marginTop: 12,
          width: '100%',
          minHeight: 36,
          border: 'none',
          background: 'transparent',
          color: '#2d6a2d',
          fontFamily: 'inherit',
          fontSize: 16,
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
