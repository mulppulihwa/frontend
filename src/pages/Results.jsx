import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import StepIndicator from '../components/StepIndicator'
import StatusCheckboxes from '../components/StatusCheckboxes'
import Card from '../components/Card'
import GrantResultCard from '../components/GrantResultCard'
import { fetchMatchedPolicies, updateSavedPolicyStatus } from '../lib/api'

const fallbackGrants = [
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
  신청기간: { label: '신청 기간', color: '#076818', bg: '#e6f4ec' },
  마감임박: { label: '마감 임박', color: '#d93025', bg: '#fff0ef' },
  신청예정: { label: '신청 예정', color: '#1a5a8a', bg: '#e8f2fb' },
  마감:    { label: '마감',     color: '#777',    bg: '#f5f5f5' },
}

export default function Results() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [pageDirection, setPageDirection] = useState('next')
  const [statuses, setStatuses] = useState({})
  const [grants, setGrants] = useState(fallbackGrants)
  const [statusError, setStatusError] = useState('')
  const grant = grants[index]
  const total = grants.length

  useEffect(() => {
    let active = true
    fetchMatchedPolicies()
      .then(policies => {
        if (active && policies.length > 0) {
          setGrants(policies)
          setStatuses(policies.reduce((acc, policy) => ({
            ...acc,
            [policy.id]: policy.user_status || null,
          }), {}))
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const handleStatusChange = async (val) => {
    const previous = statuses[grant.id] || null
    setStatusError('')
    setStatuses(p => ({ ...p, [grant.id]: val }))
    try {
      await updateSavedPolicyStatus(grant.id, val)
    } catch (err) {
      setStatuses(p => ({ ...p, [grant.id]: previous }))
      setStatusError(err.message || '지원현황을 저장하지 못했습니다.')
    }
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
      <div style={{ padding: '12px 18px 10px' }}>
        <div style={{ marginBottom: 12 }}>
          <StepIndicator current={index + 1} total={total} />
        </div>
        <div style={{ textAlign: 'center', lineHeight: 1.45 }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', animation: 'fadeUp 0.5s ease both' }}>
            ○○○님이 받을 수 있는 지원금
          </p>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', animation: 'fadeUp 0.5s ease 0.18s both' }}>
            <span style={{ color: '#076818' }}>총 {total}개</span> 찾았어요
          </p>
        </div>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          {(() => {
            const unchecked = total - Object.keys(statuses).length
            return unchecked > 0
              ? <span style={{ fontSize: 13, fontWeight: 600, color: '#FFA100', background: '#fff8ee', border: '1.5px solid #ffe0a0', borderRadius: 20, padding: '4px 12px' }}>
                  현황 미입력 {unchecked}개 남았어요
                </span>
              : <span style={{ fontSize: 13, fontWeight: 600, color: '#076818', background: '#e8f3e8', border: '1.5px solid #b8ddb8', borderRadius: 20, padding: '4px 12px' }}>
                  모두 확인했어요 ✓
                </span>
          })()}
        </div>
      </div>

      <div style={{ padding: '0 18px 152px', flex: 1, overflowX: 'hidden' }}>
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
          onViewDetail={() => navigate('/detail', { state: { grant } })}
        />

        {/* Status card */}
        <Card style={{ padding: '10px 14px' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 8, letterSpacing: '-0.1px' }}>지원현황을 체크해주세요</p>
          <StatusCheckboxes
            value={statuses[grant.id] ?? null}
            onChange={handleStatusChange}
          />
          {statusError && (
            <p style={{ fontSize: 12, fontWeight: 600, color: '#d93025', marginTop: 8 }}>
              {statusError}
            </p>
          )}
        </Card>

        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 76, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, padding: '12px 28px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          type="button"
          onClick={() => changeGrant(Math.max(0, index - 1), 'prev')}
          disabled={index === 0}
          style={{
            minHeight: 'unset',
            padding: '14px 0',
            borderRadius: 999,
            border: '2px solid #076818',
            background: '#fff',
            color: '#076818',
            fontSize: 15,
            fontWeight: 700,
            cursor: index === 0 ? 'not-allowed' : 'pointer',
            opacity: 1,
            fontFamily: 'inherit',
          }}
        >
          뒤로 가기
        </button>
        <button
          type="button"
          onClick={() => index === total - 1 ? navigate('/grant-status') : changeGrant(index + 1, 'next')}
          style={{
            minHeight: 'unset',
            padding: '14px 0',
            borderRadius: 999,
            border: 'none',
            background: index === total - 1 ? '#FFA100' : '#076818',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: 1,
            fontFamily: 'inherit',
            transition: 'background 0.2s ease',
          }}
        >
          {index === total - 1 ? '완료' : '다음'}
        </button>
      </div>

    </div>
  )
}
