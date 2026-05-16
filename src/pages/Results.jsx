import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import TopBar from '../components/TopBar'
import StepIndicator from '../components/StepIndicator'
import StatusCheckboxes from '../components/StatusCheckboxes'
import Card from '../components/Card'
import GrantResultCard from '../components/GrantResultCard'

const grants = [
  {
    id: 1,
    title: '귀농 농업창업 지원금',
    subtitle: '최대 300만원 지원',
    agency: '농림축산식품부 · 옥천군',
    reasons: ['귀농 1년 이내', '옥천 거주', '만 18세 이상'],
    period: '2026.04.01 ~ 2026.06.30',
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
    period: '2026.06.01 ~ 2026.08.15',
    deadline: '2026.08.15',
    status: '신청기간',
    countdown: { days: 64, hours: 2, minutes: 30 },
  },
]

const statusConfig = {
  신청기간: { label: '신청 기간', color: '#1a6b3a', bg: '#e6f4ec' },
  마감임박: { label: '마감 임박', color: '#d93025', bg: '#fff0ef' },
  신청예정: { label: '신청 예정', color: '#1a5a8a', bg: '#e8f2fb' },
  마감:    { label: '마감',     color: '#777',    bg: '#f5f5f5' },
}

export default function Results() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [pageDirection, setPageDirection] = useState('next')
  const [statuses, setStatuses] = useState({})
  const [bookmarks, setBookmarks] = useState({})
  const grant = grants[index]
  const total = grants.length
  const isBookmarked = bookmarks[grant.id] ?? false

  const handleStatusChange = (val) => {
    setStatuses(p => ({ ...p, [grant.id]: val }))
  }

  const changeGrant = (nextIndex, direction) => {
    setPageDirection(direction)
    setIndex(nextIndex)
  }

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => changeGrant(Math.max(0, index - 1), 'prev')}
            disabled={index === 0}
            aria-label="이전 지원금"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              border: '1.5px solid #e8e8e8',
              background: '#fff',
              color: '#2d6a2d',
              opacity: index === 0 ? 0.35 : 1,
              cursor: index === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={23} strokeWidth={2.4} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 500, color: '#777', minWidth: 44, textAlign: 'center' }}>
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => changeGrant(Math.min(total - 1, index + 1), 'next')}
            disabled={index === total - 1}
            aria-label="다음 지원금"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              border: '1.5px solid #e8e8e8',
              background: '#fff',
              color: '#2d6a2d',
              opacity: index === total - 1 ? 0.35 : 1,
              cursor: index === total - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={23} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 18px 116px', flex: 1, overflowX: 'hidden' }}>
        <div
          key={index}
          style={{
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            justifyContent: 'center',
            animation: `${pageDirection === 'next' ? 'cardSlideFromRight' : 'cardSlideFromLeft'} 0.34s cubic-bezier(0.22, 1, 0.36, 1) both`,
            willChange: 'transform, opacity',
          }}
        >

        <GrantResultCard
          grant={grant}
          statusConfig={statusConfig}
          bookmarked={isBookmarked}
          onToggleBookmark={() => setBookmarks(p => ({ ...p, [grant.id]: !p[grant.id] }))}
          onViewDetail={() => navigate('/detail')}
        />

        {/* Status card */}
        <Card>
          <p style={{ fontSize: 17, fontWeight: 500, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.1px' }}>지원현황을 체크해주세요</p>
          <StatusCheckboxes
            value={statuses[grant.id] ?? null}
            onChange={handleStatusChange}
          />
        </Card>

        </div>
      </div>

    </div>
  )
}
