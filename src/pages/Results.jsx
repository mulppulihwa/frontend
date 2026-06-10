import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, Home as HomeIcon } from 'lucide-react'
import TopBar from '../components/TopBar'
import StepIndicator from '../components/StepIndicator'
import StatusCheckboxes from '../components/StatusCheckboxes'
import GrantResultCard from '../components/GrantResultCard'
import { cachePolicyStatus, fetchMatchedPolicies, fetchProfile, fetchSavedPolicies, readPolicyStatusCache, savePolicy, updateSavedPolicyStatus } from '../lib/api'
import { findDisplayName, getKakaoUserName } from '../lib/auth'

const statusConfig = {
  신청기간: { label: '신청 기간', color: '#076818', bg: '#e6f4ec' },
  마감임박: { label: '마감 임박', color: '#d93025', bg: '#fff0ef' },
  신청예정: { label: '신청 예정', color: '#1a5a8a', bg: '#e8f2fb' },
  마감:    { label: '마감',     color: '#777',    bg: '#f5f5f5' },
}

function Toast({ visible }) {
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed', bottom: 120, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#1a1a1a', borderRadius: 50, padding: '12px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        animation: 'fadeInUp 0.22s ease',
        whiteSpace: 'nowrap',
      }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#076818', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={13} color="#fff" strokeWidth={2.5} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-0.2px' }}>지원현황이 수정되었습니다</p>
      </div>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefetchedPolicies = location.state?.matchedPolicies
  const [index, setIndex] = useState(0)
  const [pageDirection, setPageDirection] = useState('next')
  const [statuses, setStatuses] = useState({})
  const [grants, setGrants] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [userName, setUserName] = useState(getKakaoUserName)
  const [toastVisible, setToastVisible] = useState(false)
  const toastTimer = useRef(null)
  const grant = grants[index]
  const total = grants.length

  const showToast = () => {
    setToastVisible(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000)
  }

  useEffect(() => {
    let active = true
    fetchProfile()
      .then(profile => {
        if (!active) return
        const name = findDisplayName(profile)
        if (name) {
          setUserName(name)
          if (!getKakaoUserName()) localStorage.setItem('kakaoUserName', name)
        }
      })
      .catch(() => {})
    const matchedPoliciesRequest = Array.isArray(prefetchedPolicies)
      ? Promise.resolve(prefetchedPolicies)
      : fetchMatchedPolicies()

    matchedPoliciesRequest
      .then(async policies => {
        if (!active) return
        localStorage.setItem('lastDiagnosisDate', new Date().toISOString())
        policies.forEach(p => savePolicy(p.id).catch(() => null))
        const statusCache = readPolicyStatusCache()
        let savedStatuses = {}
        try {
          const saved = await fetchSavedPolicies()
          saved.forEach(p => { if (p.user_status) savedStatuses[String(p.id)] = p.user_status })
        } catch { /* fall back to cache */ }
        if (!active) return
        const initialStatuses = policies.reduce((acc, policy) => ({
          ...acc,
          [policy.id]: savedStatuses[String(policy.id)] || statusCache[String(policy.id)] || null,
        }), {})
        setStatuses(initialStatuses)
        setGrants(policies)
      })
      .catch(err => {
        if (!active) return
        if (err.data?.code === 'profile_incomplete' || err.data?.code === 'profile_missing') {
          localStorage.removeItem('lastDiagnosisDate')
          localStorage.removeItem('submittedDiagnosisProfile')
          navigate('/step1', {
            replace: true,
            state: {
              profileIncompleteReason: 'match-profile-incomplete',
              profileIncompleteMessage: '프로필 저장이 완료되지 않았어요. 진단을 한 번만 다시 완료해 주세요.',
            },
          })
          return
        }
        setLoadError(err.message || '맞춤 지원금을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [prefetchedPolicies])

  const handleStatusChange = async (val) => {
    if (!grant) return
    const previous = statuses[grant.id] || null
    setStatusError('')
    setStatuses(p => ({ ...p, [grant.id]: val }))
    cachePolicyStatus(grant.id, val, grant)
    if (!val) return
    try {
      await savePolicy(grant.id).catch(() => null)
      await updateSavedPolicyStatus(grant.id, val)
      showToast()
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
        <TopBar
          title="내 지원금"
          rightAction={{
            label: '홈으로',
            onClick: () => navigate('/home', { replace: true }),
            icon: <HomeIcon size={19} strokeWidth={2.2} />,
          }}
        />
      </div>

      {/* Indicator + Header */}
      <div style={{ padding: '12px 18px 10px' }}>
        <div style={{ marginBottom: 12 }}>
          <StepIndicator current={index + 1} total={total} />
        </div>
        <div style={{ textAlign: 'center', lineHeight: 1.45 }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', animation: 'fadeUp 0.5s ease both' }}>
            관심있는 정책이라면, 현재 상태를 알려주세요.
          </p>
        </div>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          {(() => {
            const unchecked = total - Object.values(statuses).filter(v => v !== null).length
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
        {loading && (
          <div style={{
            background: 'none',
            border: 'none',
            padding: '48px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid rgba(218,231,211,0.9)', borderTopColor: '#076818',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2433', letterSpacing: '-0.2px' }}>
              맞춤 지원금을 불러오는 중이에요
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && loadError && (
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#d93025', textAlign: 'center', lineHeight: 1.45 }}>
              {loadError}
            </p>
          </div>
        )}

        {!loading && !loadError && total === 0 && (
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#666', textAlign: 'center' }}>
              조건에 맞는 지원금이 없어요.
            </p>
          </div>
        )}

        {!loading && !loadError && grant && (
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
        <div style={{ background: '#fff', borderRadius: 22, border: '1.5px solid #e8e8e8', padding: '10px 14px' }}>
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
        </div>

        </div>
        )}
      </div>

      {!loading && !loadError && grant && (
      <div style={{ position: 'fixed', bottom: 'max(12px, env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', width: 'min(100%, 430px)', boxSizing: 'border-box', padding: '12px 28px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#FDFCF8', boxShadow: '0 -18px 28px rgba(253,252,248,0.92)', zIndex: 50 }}>
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
      )}

      <Toast visible={toastVisible} />
    </div>
  )
}
