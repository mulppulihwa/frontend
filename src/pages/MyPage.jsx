import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  X,
} from 'lucide-react'
import Card from '../components/Card'
import { fetchProfile, fetchSavedPolicies, getAccessToken } from '../lib/api'
import { findDisplayName, getKakaoUserName, startKakaoLogin } from '../lib/auth'

function getDday(deadlineStr) {
  if (!deadlineStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(deadlineStr)
  if (isNaN(deadline.getTime())) return null
  const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'D-DAY'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

function MiniRing({ done, total }) {
  const r = 10
  const circ = 2 * Math.PI * r
  const pct = total === 0 ? 0 : done / total
  const complete = done === total && total > 0
  const color = complete ? '#076818' : '#FFA100'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
      <svg width="26" height="26" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r={r} fill="none" stroke="#e8e8e8" strokeWidth="2.5" />
        <circle
          cx="13"
          cy="13"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 13 13)"
        />
        {complete && (
          <path d="M9 13.5l2.5 2.5 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
      </svg>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#888' }}>준비물 {done}/{total}</span>
    </div>
  )
}

const statusConfig = {
  신청완료: { label: '신청 완료', color: '#076818', bg: '#e8f3e8', Icon: Check },
  신청예정: { label: '신청 예정', color: '#FFA100', bg: '#fff3e0', Icon: Clock3 },
  관심없음: { label: '관심 없음', color: '#d93025', bg: '#fff0ef', Icon: X },
}

const SUBMITTED_PROFILE_KEY = 'submittedDiagnosisProfile'
const REGION_CODE_LABELS = {
  4329: '옥천',
  43: '충청북도',
  41: '경기도',
  44: '충청남도',
  45: '전라북도',
  46: '전라남도',
  47: '경상북도',
  48: '경상남도',
  11: '서울특별시',
  26: '부산광역시',
}

function firstValue(source, keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

function readJsonSafe(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return value.split(',').map(tag => tag.trim()).filter(Boolean)
  return []
}

function getReturnFarming(profile, profileData) {
  const occupationTags = normalizeTags(profile.occupation_tags || profileData.occupation_tags)
  if (occupationTags.includes('귀농')) return true
  if (occupationTags.includes('귀촌')) return false

  const explicitValue = profile.farming
    ?? profile.is_farmer
    ?? profile.isFarmer
    ?? profileData.farming
    ?? profileData.is_farmer
    ?? profileData.isFarmer

  return explicitValue ?? null
}

function normalizeProfile(profile) {
  const kakaoAccount = profile.kakao_account || profile.kakaoAccount || {}
  const kakaoProfile = kakaoAccount.profile || profile.properties || profile.kakao_profile || {}
  const profileData = profile.profile || profile.user_profile || profile.userProfile || {}
  const user = profile.user || profile.account || profile.member || {}
  const kakao = profile.kakao || profile.kakao_user || profile.kakaoUser || {}
  const regionCode = firstValue(profile, ['region_code', 'regionCode'])
    || firstValue(profileData, ['region_code', 'regionCode'])
  const region = firstValue(profile.region, ['name', 'region_name'])
    || firstValue(profileData.region, ['name', 'region_name'])
    || firstValue(profile, ['region_name', 'region'])
    || firstValue(profileData, ['region_name', 'region'])
    || REGION_CODE_LABELS[String(regionCode)]

  let submitted = {}
  try {
    submitted = JSON.parse(localStorage.getItem(SUBMITTED_PROFILE_KEY) || '{}')
  } catch {
    submitted = {}
  }

  const movedAt = firstValue(profile, ['moved_at', 'movedAt', 'move_in_date'])
    || firstValue(profileData, ['moved_at', 'movedAt', 'move_in_date'])
  const backendHasDiagnosis = Boolean(
    movedAt
      || regionCode
      || normalizeTags(profile.occupation_tags || profileData.occupation_tags).length
      || profileData.is_farm_registered !== null && profileData.is_farm_registered !== undefined
      || profile.is_farm_registered !== null && profile.is_farm_registered !== undefined
      || Number(profileData.education_hours || profile.education_hours || 0) > 0
  )

  return {
    name: findDisplayName(profile)
      || findDisplayName(user)
      || findDisplayName(profileData)
      || findDisplayName(kakaoProfile)
      || findDisplayName(kakao)
      || getKakaoUserName(),
    age: firstValue(profile, ['age']) || firstValue(profileData, ['age']),
    gender: firstValue(profile, ['gender']) || firstValue(profileData, ['gender']) || firstValue(kakaoAccount, ['gender']),
    nationality: backendHasDiagnosis ? (submitted.nationality || readJsonSafe('editableProfileInfo').nationality || '') : '',
    region,
    farming: getReturnFarming(profile, profileData),
    movedAt,
    hasDiagnosis: backendHasDiagnosis,
  }
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 2px 12px' }}>
      <p style={{ fontSize: 18, fontWeight: 800, color: '#1f2433', letterSpacing: 0 }}>{children}</p>
      {action}
    </div>
  )
}

function InfoPill({ label, value }) {
  return (
    <div style={{
      minWidth: 0,
      padding: '13px 8px 12px',
      textAlign: 'left',
      borderRadius: 18,
      background: '#FFFFFF',
      border: '1px solid rgba(218,231,211,0.95)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#9a948a', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 800, color: '#1f2433', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </p>
    </div>
  )
}

function MetricTile({ label, count, color, background }) {
  return (
    <div style={{
      minWidth: 0,
      padding: '13px 8px 12px',
      borderRadius: 18,
      background: '#FFFFFF',
      border: '1px solid rgba(218,231,211,0.95)',
      textAlign: 'center',
    }}>
      <div style={{
        width: 24,
        height: 4,
        borderRadius: 999,
        background,
        margin: '0 auto 9px',
      }} />
      <p style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{count}</p>
      <span style={{ display: 'block', marginTop: 7, fontSize: 11, fontWeight: 600, color: '#7e817e', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

export default function MyPage() {
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState(null)
  const [grantStatuses, setGrantStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [error, setError] = useState('')

  function handleDiagnosisStart() {
    navigate('/step1')
  }

  useEffect(() => {
    let active = true
    async function loadMyPage() {
      if (!getAccessToken()) {
        setAuthRequired(true)
        setLoading(false)
        return
      }

      try {
        const profile = await fetchProfile()
        if (!active) return
        const normalized = normalizeProfile(profile)
        // persist resolved name so other pages can read it without re-login
        if (normalized.name && !getKakaoUserName()) {
          localStorage.setItem('kakaoUserName', normalized.name)
        }
        setUserInfo(normalized)
      } catch (err) {
        if (!active) return
        if (err.status === 401) {
          setAuthRequired(true)
        } else {
          setError(err.message || '프로필 정보를 불러오지 못했습니다.')
        }
        return
      } finally {
        if (active) setLoading(false)
      }

      try {
        const policies = await fetchSavedPolicies()
        if (!active) return
        setGrantStatuses(policies.map(policy => ({
          ...policy,
          status: policy.user_status || policy.status || null,
          deadline: policy.deadline,
          checkDone: policy.checkDone ?? 0,
          checkTotal: policy.checkTotal ?? 5,
        })))
      } catch {
        if (active) setGrantStatuses([])
      }
    }

    loadMyPage()

    return () => {
      active = false
    }
  }, [])

  const completedCount = grantStatuses.filter(g => g.status === '신청완료').length
  const plannedCount = grantStatuses.filter(g => g.status === '신청예정').length
  const ignoredCount = grantStatuses.filter(g => g.status === '관심없음').length
  const noStatusCount = grantStatuses.filter(g => !g.status).length
  const activePolicies = grantStatuses.filter(g => g.status === '신청예정' || g.status === '신청완료')
  const noStatusPolicies = grantStatuses.filter(g => !g.status)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#FDFCF8',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      width: '100%',
    }}>
      {loading && (
        <div style={{
          flex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 10px 58px',
          background: 'linear-gradient(135deg, #e8f3e8 0%, #fff7e8 100%)',
        }}>
          <div className="loading-spinner" aria-label="마이페이지 정보 로딩 중" />
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.45 }}>
              마이페이지 정보를
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.45 }}>
              불러오고 있어요
            </p>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#666', marginTop: 10 }}>
              잠시만 기다려 주세요
            </p>
          </div>
        </div>
      )}
      <div style={{ padding: '0 18px 116px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {!loading && authRequired && (
          <div style={{
            minHeight: 'calc(100vh - 104px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 10px 58px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.45 }}>
                로그인이 필요해요
              </p>
              <p style={{ fontSize: 14, fontWeight: 400, color: '#666', marginTop: 10, lineHeight: 1.5 }}>
                카카오 로그인 후 프로필과<br />지원 현황을 확인할 수 있어요
              </p>
            </div>
            <button
              onClick={() => startKakaoLogin('/mypage')}
              style={{
                width: '100%',
                maxWidth: 320,
                minHeight: 54,
                marginTop: 28,
                border: 'none',
                borderRadius: 999,
                background: '#FEE500',
                color: '#111',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              카카오 로그인
            </button>
          </div>
        )}

        {!loading && error && (
          <Card style={{ marginTop: 86 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#d93025' }}>{error}</p>
          </Card>
        )}

        {!loading && userInfo && (
          <>
            <div style={{
              margin: '0 -18px',
              background: '#FDFCF8',
              color: '#1a1a1a',
              position: 'relative',
              padding: '28px 22px 6px',
            }}>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={() => navigate('/home')}
                  aria-label="뒤로 가기"
                  style={{
                    width: 34,
                    height: 34,
                    border: 'none',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.82)',
                    color: '#1f2433',
                    cursor: 'pointer',
                    fontSize: 20,
                    fontWeight: 700,
                    lineHeight: 1,
                    fontFamily: 'inherit',
                  }}
                >
                  ‹
                </button>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#1f2433' }}>마이페이지</p>
                <div style={{ width: 34 }} />
              </div>
            </div>

            <section style={{
              background: '#FFFFFF',
              border: '1px solid rgba(218,231,211,0.9)',
              borderRadius: 32,
              padding: '22px 18px 18px',
              position: 'relative',
              zIndex: 2,
            }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#8a8a8a', marginBottom: 4 }}>안녕하세요,</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#1f2433', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userInfo.name || '카카오 사용자'}님
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <MapPin size={13} color="#8a8a8a" strokeWidth={2} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#8a8a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userInfo.region || '지역 미등록'} 거주
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/basic-info')}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 10,
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 999,
                    border: 'none',
                    background: '#e8f3e8',
                    color: '#076818',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    flexShrink: 0,
                  }}
                >
                  프로필 정보
                </button>
              </div>

              {(() => {
                const raw = localStorage.getItem('lastDiagnosisDate')
                if (!raw) return null
                const date = new Date(raw)
                const days = Math.floor((Date.now() - date.getTime()) / 86400000)
                const dateStr = `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
                const ago = days === 0 ? '오늘' : `${days}일 전`
                return (
                  <p style={{ fontSize: 12, color: '#666', letterSpacing: '-0.1px', marginBottom: 4 }}>
                    최종 진단 : {dateStr} ({ago})
                  </p>
                )
              })()}

              <button
                onClick={handleDiagnosisStart}
                style={{
                  width: '100%',
                  minHeight: 44,
                  border: 'none',
                  borderRadius: 999,
                  background: '#076818',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {userInfo.hasDiagnosis ? '다시 진단하기' : '진단하기 시작'}
              </button>
            </section>
          </>
        )}

        {!loading && userInfo && (
          <section>
            <SectionTitle
              action={(
                <button
                  onClick={() => navigate('/grant-status')}
                  style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: '#888', padding: '7px 9px 7px 12px' }}
                >
                  전체 보기 <ChevronRight size={15} color="#aaa" strokeWidth={2.2} />
                </button>
              )}
            >
              진단 받은 정책
            </SectionTitle>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid rgba(218,231,211,0.9)',
              borderRadius: 32,
              padding: 18,
            }}>
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 26,
                background: 'linear-gradient(135deg, #e8f3e8 0%, #fff7e8 100%)',
                padding: '18px 18px 20px',
                marginBottom: 12,
              }}>
                <div style={{
                  position: 'absolute',
                  right: 18,
                  bottom: 18,
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 5,
                  opacity: 0.28,
                }}>
                  {[26, 38, 30, 48, 62].map((height, index) => (
                    <span
                      key={height}
                      style={{
                        display: 'block',
                        width: 8,
                        height,
                        borderRadius: 999,
                        background: index === 4 ? '#FFA100' : '#076818',
                      }}
                    />
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#5a7a5e', marginBottom: 7 }}>진단 받은 정책</p>
                  <p style={{ fontSize: 38, fontWeight: 800, color: '#1f2433', lineHeight: 1 }}>{completedCount + plannedCount + ignoredCount + noStatusCount}건</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                {[
                  { key: '신청완료', label: '완료', color: '#076818', background: '#e8f3e8', count: completedCount },
                  { key: '신청예정', label: '예정', color: '#FFA100', background: '#fff3e0', count: plannedCount },
                  { key: '관심없음', label: '관심 없음', color: '#d93025', background: '#fff0ef', count: ignoredCount },
                  { key: '미입력',   label: '미입력', color: '#8a8a8a', background: '#f5f3ef', count: noStatusCount },
                ].map(({ key, label, color, background, count }) => (
                    <MetricTile key={key} label={label} count={count} color={color} background={background} />
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {!loading && userInfo && (
          <section>
            <SectionTitle>신청 진행 중</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activePolicies.length === 0 && (
                <Card style={{
                  borderRadius: 26,
                  border: '1px solid rgba(218,231,211,0.9)',
                }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#666' }}>아직 저장된 지원 현황이 없어요.</p>
                </Card>
              )}
              {activePolicies.slice(0, 2).map(g => {
                const cfg = statusConfig[g.status]
                const Icon = cfg.Icon
                return (
                  <Card key={g.id} style={{
                    borderRadius: 28,
                    padding: '16px 16px 15px',
                    border: '1px solid rgba(218,231,211,0.9)',
                    background: '#FFFFFF',
                  }}>
                    <div
                      onClick={() => navigate('/detail', { state: { grant: g } })}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    >
                      <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: 20,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#d93025' }}>{getDday(g.deadline) ?? '—'}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#1f2433', marginBottom: 6, wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                          {g.title}
                        </p>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: cfg.bg, borderRadius: 999, padding: '4px 8px' }}>
                          <Icon size={10} color={cfg.color} strokeWidth={2.5} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </div>
                      <MiniRing done={g.checkDone} total={g.checkTotal} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => navigate(`/checklist?policyId=${encodeURIComponent(g.id)}`, { state: { grant: g } })}
                        style={{
                          flex: 1,
                          padding: '11px 0',
                          borderRadius: 999,
                          border: 'none',
                          background: '#076818',
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          letterSpacing: '-0.2px',
                        }}
                      >
                        준비물 확인 →
                      </button>
                      {g.status === '신청완료' && (
                        <button
                          onClick={() => navigate('/map', { state: { policy: g } })}
                          style={{
                            flex: 1,
                            padding: '11px 0',
                            borderRadius: 999,
                            border: '1.5px solid #076818',
                            background: '#fff',
                            color: '#076818',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            letterSpacing: '-0.2px',
                          }}
                        >
                          사용처 보기
                        </button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {!loading && userInfo && noStatusPolicies.length > 0 && (
          <section>
            <SectionTitle>미입력</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {noStatusPolicies.slice(0, 2).map(g => (
                <Card key={g.id} style={{
                  borderRadius: 28,
                  padding: '16px 16px 15px',
                  border: '1px solid rgba(218,231,211,0.9)',
                  background: '#FFFFFF',
                }}>
                  <div
                    onClick={() => navigate('/detail', { state: { grant: g } })}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#1f2433', marginBottom: 6, wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                        {g.title}
                      </p>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f5f3ef', borderRadius: 999, padding: '4px 8px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#8a8a8a' }}>미입력</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#d93025', flexShrink: 0 }}>{getDday(g.deadline) ?? '—'}</span>
                  </div>
                  <button
                    onClick={() => navigate('/grant-status')}
                    style={{
                      marginTop: 10,
                      width: '100%',
                      padding: '11px 0',
                      borderRadius: 999,
                      border: '1.5px solid #8a8a8a',
                      background: '#fff',
                      color: '#8a8a8a',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    현황 입력하기
                  </button>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
