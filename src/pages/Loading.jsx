import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingProgress from '../components/LoadingProgress'
import useLoadingProgress from '../hooks/useLoadingProgress'
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
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [isFirstDiagnosis] = useState(() => !localStorage.getItem('lastDiagnosisDate'))
  const analysisProgress = useLoadingProgress(!analysisComplete, RESULT_MIN_DURATION + 500)

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
        setAnalysisComplete(true)
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

        setAnalysisComplete(true)
        await wait(500)
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
        {analysisProgress.visible && (
          <LoadingProgress
            progress={analysisProgress.progress}
            label="분석 중..."
            detail={matchedCount === null
              ? undefined
              : `${userName || '회원'}님이 받을 수 있는 지원금 총 ${matchedCount}개 찾았어요`}
            emphasizeDetail
            fullPage
          />
        )}
      </div>
    </div>
  )
}
