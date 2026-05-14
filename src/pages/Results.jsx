import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Clock, Banknote, MapPin, ArrowUpRight } from 'lucide-react'
import TopBar from '../components/TopBar'
import StepIndicator from '../components/StepIndicator'
import StatusCheckboxes from '../components/StatusCheckboxes'
import Card from '../components/Card'
import Button from '../components/Button'
import BottomNav from '../components/BottomNav'

const grants = [
  {
    id: 1,
    title: '귀농 농업창업 지원금',
    subtitle: '최대 300만원 지원',
    agency: '농림축산식품부 · 옥천군',
    reasons: ['귀농 1년 이내', '옥천 거주', '만 18세 이상'],
    deadline: '2026.06.30',
    status: '마감임박',
    countdown: { days: 19, hours: 5, minutes: 5 },
  },
  {
    id: 2,
    title: '농촌 정착 지원금',
    subtitle: '최대 500만원 지원',
    agency: '농림축산식품부 · 옥천군',
    reasons: ['귀농 3년 이내', '옥천군 거주'],
    deadline: '2026.08.15',
    status: '신청기간',
    countdown: { days: 64, hours: 2, minutes: 30 },
  },
]

const statusConfig = {
  신청기간: { label: '신청 기간', color: '#1a6b3a', bg: '#e6f4ec' },
  마감임박: { label: '마감 임박', color: '#d93025', bg: '#fff0ef' },
  신청예정: { label: '신청 예정', color: '#1a5a8a', bg: '#e8f2fb' },
  마감:    { label: '마감',     color: '#888',    bg: '#f0f0f0' },
}

export default function Results() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [statuses, setStatuses] = useState({})
  const [bookmarks, setBookmarks] = useState({})
  const grant = grants[index]
  const total = grants.length
  const isBookmarked = bookmarks[grant.id] ?? false
  const statusCfg = statusConfig[grant.status]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>
      <div style={{ background: '#FDFCF8' }}>
        <TopBar title="내 지원금" />
      </div>

      {/* Indicator + Header */}
      <div style={{ padding: '20px 18px 16px' }}>
        <div style={{ marginBottom: 20 }}>
          <StepIndicator current={index + 1} total={total} />
        </div>
        <div style={{ textAlign: 'center', lineHeight: 1.55 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', animation: 'fadeUp 0.5s ease both' }}>
            ○○○님이 받을 수 있는 지원금
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', animation: 'fadeUp 0.5s ease 0.18s both' }}>
            <span style={{ color: '#2d6a2d' }}>총 {total}개</span> 찾았어요
          </p>
        </div>
      </div>

      <div style={{ padding: '0 18px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>

        {/* Grant card */}
        <Card key={index} style={{ padding: '18px 18px 16px', animation: 'fadeUp 0.3s ease both' }}>

          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ flex: 1, paddingRight: 8 }}>
              {statusCfg && (
                <span style={{
                  display: 'inline-block', fontSize: 13, fontWeight: 700,
                  borderRadius: 20, padding: '4px 11px', marginBottom: 8,
                  color: statusCfg.color, background: statusCfg.bg,
                }}>
                  {statusCfg.label}
                </span>
              )}
              <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.35 }}>{grant.title}</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#aaa', marginTop: 4, letterSpacing: '-0.1px' }}>{grant.agency}</p>
            </div>
            <button
              onClick={() => setBookmarks(p => ({ ...p, [grant.id]: !p[grant.id] }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 8, flexShrink: 0 }}
            >
              <Bookmark size={22} color="#2d6a2d" fill={isBookmarked ? '#2d6a2d' : 'none'} strokeWidth={2} style={{ transition: 'fill 0.2s ease' }} />
            </button>
          </div>

          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {/* Amount row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 12, background: '#e8f3e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Banknote size={15} color="#2d6a2d" strokeWidth={2.2} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#2d6a2d', letterSpacing: '-0.2px' }}>{grant.subtitle}</p>
            </div>

            {/* Reason row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 12, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <MapPin size={15} color="#888" strokeWidth={2.2} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#aaa', letterSpacing: '-0.1px', marginBottom: 5 }}>해당 이유</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {grant.reasons.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2d6a2d', flexShrink: 0 }} />
                      <p style={{ fontSize: 17, fontWeight: 600, color: '#444', letterSpacing: '-0.1px' }}>{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Deadline + countdown */}
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 14, paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Clock size={14} color="#888" strokeWidth={2} />
              <p style={{ fontSize: 16, fontWeight: 600, color: '#888', letterSpacing: '-0.1px' }}>
                신청 마감 <span style={{ color: '#1a1a1a', fontWeight: 700 }}>{grant.deadline}</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[[grant.countdown.days, '일'], [grant.countdown.hours, '시간'], [grant.countdown.minutes, '분']].map(([val, unit]) => (
                <div key={unit} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: '#f7f7f7', borderRadius: 16, padding: '10px 0',
                }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-1px', lineHeight: 1 }}>{String(val).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#888', marginTop: 5 }}>{unit}</span>
                </div>
              ))}
            </div>
          </div>

          <Button variant="ghost" onClick={() => navigate('/detail')} style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            자세히 보기 <ArrowUpRight size={18} strokeWidth={2.2} />
          </Button>
        </Card>

        {/* Status card */}
        <Card>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.1px' }}>지원현황을 체크해주세요</p>
          <StatusCheckboxes
            value={statuses[grant.id] ?? null}
            onChange={val => setStatuses(p => ({ ...p, [grant.id]: val }))}
          />
        </Card>
      </div>

      {/* Bottom nav */}
      <div style={{ padding: '10px 18px 100px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0} style={{ flex: 1, width: 'auto' }}>뒤로</Button>
          <Button onClick={() => setIndex(i => Math.min(total - 1, i + 1))} disabled={index === total - 1} style={{ flex: 1, width: 'auto' }}>다음</Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
