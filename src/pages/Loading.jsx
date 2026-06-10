import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { fetchMatchedPolicies, fetchProfile } from '../lib/api'
import { findDisplayName, getKakaoUserName } from '../lib/auth'

const ANALYSIS_MIN_DURATION = 900
const RESULT_MIN_DURATION = 2600

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

export default function Loading() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState(getKakaoUserName)
  const [matchedCount, setMatchedCount] = useState(null)
  const [isFirstDiagnosis] = useState(() => !localStorage.getItem('lastDiagnosisDate'))

  useEffect(() => {
    let active = true
    const startedAt = Date.now()

    fetchProfile()
      .then(profile => {
        if (!active) return
        const name = findDisplayName(profile)
        if (name) setUserName(name)
      })
      .catch(() => {})

    async function loadMatchedPolicies() {
      try {
        const policies = await fetchMatchedPolicies()
        const remainingAnalysisTime = Math.max(0, ANALYSIS_MIN_DURATION - (Date.now() - startedAt))
        if (remainingAnalysisTime > 0) await wait(remainingAnalysisTime)
        if (!active) return

        setMatchedCount(policies.length)
        await wait(RESULT_MIN_DURATION)
        if (active) {
          navigate('/results', {
            replace: true,
            state: { matchedPolicies: policies, firstDiagnosis: isFirstDiagnosis },
          })
        }
      } catch {
        const remainingAnalysisTime = Math.max(0, ANALYSIS_MIN_DURATION - (Date.now() - startedAt))
        if (remainingAnalysisTime > 0) await wait(remainingAnalysisTime)
        if (!active) return

        navigate('/results', {
          replace: true,
          state: { firstDiagnosis: isFirstDiagnosis },
        })
      }
    }

    loadMatchedPolicies()

    return () => {
      active = false
    }
  }, [isFirstDiagnosis, navigate])

  return (
    <div className="loading-wave-page">
      <div style={{ position: 'relative', zIndex: 2 }}>
        <TopBar title="정보 입력" />
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 28px 58px',
        position: 'relative',
        zIndex: 2,
      }}>
        <div className="loading-spinner" aria-label="지원금 분석 중" />

        <div
          key={matchedCount === null ? 'analyzing' : 'matched'}
          style={{ textAlign: 'center', marginTop: 28, animation: 'fadeUp 0.35s ease both' }}
        >
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.45 }}>
            {matchedCount === null
              ? '받을 수 있는 지원금을'
              : `${userName || '회원'}님이 받을 수 있는 지원금`}
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.45 }}>
            {matchedCount === null ? '찾고 있어요' : `총 ${matchedCount}개 찾았어요`}
          </p>
          <p style={{ fontSize: 14, fontWeight: 400, color: '#666', marginTop: 10, letterSpacing: '-0.1px' }}>
            {matchedCount === null ? '입력하신 조건을 기준으로 분석 중' : '관심 있는 정책의 현재 상태를 알려주세요'}
          </p>
        </div>
      </div>
    </div>
  )
}
