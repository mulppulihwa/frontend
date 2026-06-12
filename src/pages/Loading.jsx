import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import LoadingProgress from '../components/LoadingProgress'
import useLoadingProgress from '../hooks/useLoadingProgress'
import { fetchMatchedPolicies } from '../lib/api'

const ANALYSIS_MIN_DURATION = 900
const RESULT_MIN_DURATION = 2600

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

export default function Loading() {
  const navigate = useNavigate()
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [isFirstDiagnosis] = useState(() => !localStorage.getItem('lastDiagnosisDate'))
  const analysisProgress = useLoadingProgress(!analysisComplete, RESULT_MIN_DURATION + 500)

  useEffect(() => {
    let active = true
    const startedAt = Date.now()

    async function loadMatchedPolicies() {
      try {
        const policies = await fetchMatchedPolicies()
        const remainingAnalysisTime = Math.max(0, ANALYSIS_MIN_DURATION - (Date.now() - startedAt))
        if (remainingAnalysisTime > 0) await wait(remainingAnalysisTime)
        if (!active) return

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
        {analysisProgress.visible && (
          <LoadingProgress
            progress={analysisProgress.progress}
            label="분석 중..."
          />
        )}
      </div>
    </div>
  )
}
