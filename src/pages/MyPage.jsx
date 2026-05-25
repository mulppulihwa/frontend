import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Pencil,
  X,
} from 'lucide-react'
import Card from '../components/Card'
import farmerAvatar from '../assets/farmer.png'
import { fetchProfile, fetchSavedPolicies, getAccessToken } from '../lib/api'
import { findDisplayName, getKakaoUserName, logout, startKakaoLogin } from '../lib/auth'

function getDday(deadlineStr) {
  const today = new Date('2026-05-18')
  const deadline = new Date(deadlineStr)
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

function firstValue(source, keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
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
  const region = firstValue(profile.region, ['name', 'region_name'])
    || firstValue(profileData.region, ['name', 'region_name'])
    || firstValue(profile, ['region_name', 'region'])
    || firstValue(profileData, ['region_name', 'region'])

  return {
    name: findDisplayName(profile)
      || findDisplayName(user)
      || findDisplayName(profileData)
      || findDisplayName(kakaoProfile)
      || findDisplayName(kakao)
      || getKakaoUserName(),
    age: firstValue(profile, ['age']) || firstValue(profileData, ['age']),
    gender: firstValue(profile, ['gender']) || firstValue(profileData, ['gender']) || firstValue(kakaoAccount, ['gender']),
    region,
    farming: getReturnFarming(profile, profileData),
    movedAt: firstValue(profile, ['moved_at', 'movedAt', 'move_in_date'])
      || firstValue(profileData, ['moved_at', 'movedAt', 'move_in_date']),
  }
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{children}</p>
      {action}
    </div>
  )
}

function InfoPill({ label, value }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: '#FDFCF8',
      border: '1px solid #eee8de',
      borderRadius: 16,
      padding: '10px 8px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9a948a', marginBottom: 5 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </p>
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

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
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
        setUserInfo(normalizeProfile(profile))
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
  const activePolicies = grantStatuses.filter(g => g.status === '신청예정' || g.status === '신청완료')

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
      <div style={{ padding: '0 18px 104px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {loading && (
          <div style={{
            minHeight: 'calc(100vh - 104px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 10px 58px',
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
                borderRadius: 18,
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
              padding: '30px 22px 18px',
            }}>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={() => navigate('/home')}
                  aria-label="뒤로 가기"
                  style={{
                    width: 34,
                    height: 34,
                    border: '1px solid #e8e8e8',
                    borderRadius: 14,
                    background: '#fff',
                    color: '#1a1a1a',
                    cursor: 'pointer',
                    fontSize: 20,
                    fontWeight: 700,
                    lineHeight: 1,
                    fontFamily: 'inherit',
                  }}
                >
                  ‹
                </button>
                <p style={{ fontSize: 16, fontWeight: 700 }}>마이페이지</p>
                <button
                  onClick={() => navigate('/step1')}
                  aria-label="프로필 수정"
                  style={{
                    width: 34,
                    height: 34,
                    border: '1px solid #e8e8e8',
                    borderRadius: 14,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Pencil size={15} color="#1a1a1a" strokeWidth={2.3} />
                </button>
              </div>
            </div>

            <section style={{
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: 24,
              padding: '18px 16px 16px',
              boxShadow: '0 12px 30px rgba(7,104,24,0.08)',
              position: 'relative',
              zIndex: 2,
            }}>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                  <div style={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    background: '#e8f3e8',
                    border: '4px solid #fff',
                    overflow: 'hidden',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.08)',
                    flexShrink: 0,
                  }}>
                    <img src={farmerAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ marginTop: 8, minWidth: 0, textAlign: 'center' }}>
                    <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userInfo.name || '카카오 사용자'}님
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 3 }}>
                      <MapPin size={13} color="#8a8a8a" strokeWidth={2} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#8a8a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {userInfo.region || '지역 미등록'} 거주
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/step1')}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 10,
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 14,
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
                  수정
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <InfoPill label="나이" value={userInfo.age ? `${userInfo.age}세` : '미등록'} />
                <InfoPill label="성별" value={userInfo.gender || '미등록'} />
                <InfoPill label="유형" value={userInfo.farming === null ? '미등록' : userInfo.farming ? '귀농' : '비귀농'} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0eee8', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#9a948a' }}>이사 날짜</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{userInfo.movedAt || '미등록'}</span>
              </div>
            </section>
          </>
        )}

        {!loading && userInfo && (
          <section>
            <SectionTitle
              action={(
                <button
                  onClick={() => navigate('/grant-status')}
                  style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#888' }}
                >
                  전체 보기 <ChevronRight size={15} color="#aaa" strokeWidth={2.2} />
                </button>
              )}
            >
              지원 현황
            </SectionTitle>
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 24, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8a8a8a', marginBottom: 3 }}>저장한 정책</p>
                  <p style={{ fontSize: 27, fontWeight: 800, color: '#076818' }}>{grantStatuses.length}건</p>
                </div>
                <div style={{ width: 126, height: 48 }}>
                  <svg width="126" height="48" viewBox="0 0 126 48" fill="none">
                    <path d="M2 36C14 21 25 33 37 22C49 11 60 28 72 17C84 6 96 30 124 11" stroke="#dcefdc" strokeWidth="8" strokeLinecap="round" />
                    <path d="M2 36C14 21 25 33 37 22C49 11 60 28 72 17C84 6 96 30 124 11" stroke="#076818" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div style={{ display: 'flex', borderTop: '1px solid #f0f0f0', paddingTop: 13 }}>
                {[
                  { key: '신청완료', label: '신청 완료', color: '#076818' },
                  { key: '신청예정', label: '신청 예정', color: '#FFA100' },
                  { key: '관심없음', label: '관심 없음', color: '#d93025' },
                ].map(({ key, label, color }, i, arr) => {
                  const count = key === '신청완료' ? completedCount : key === '신청예정' ? plannedCount : ignoredCount
                  return (
                    <div
                      key={label}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        borderRight: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none',
                      }}
                    >
                      <p style={{ fontSize: 20, fontWeight: 800, color }}>{count}</p>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#8a8a8a' }}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {!loading && userInfo && (
          <section>
            <SectionTitle>신청 진행 중</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activePolicies.length === 0 && (
                <Card style={{ borderRadius: 22 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#666' }}>아직 저장된 지원 현황이 없어요.</p>
                </Card>
              )}
              {activePolicies.slice(0, 2).map(g => {
                const cfg = statusConfig[g.status]
                const Icon = cfg.Icon
                return (
                  <Card key={g.id} style={{ borderRadius: 22, padding: '14px 15px' }}>
                    <div
                      onClick={() => navigate('/detail', { state: { grant: g } })}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    >
                      <div style={{ width: 48, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#FF0000' }}>{getDday(g.deadline)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.title}
                        </p>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: cfg.bg, borderRadius: 12, padding: '3px 7px' }}>
                          <Icon size={10} color={cfg.color} strokeWidth={2.5} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </div>
                      <MiniRing done={g.checkDone} total={g.checkTotal} />
                    </div>
                    <button
                      onClick={() => navigate('/checklist')}
                      style={{
                        marginTop: 10,
                        width: '100%',
                        padding: '10px 0',
                        borderRadius: 16,
                        border: '1.5px solid #e8e8e8',
                        background: '#fafafa',
                        color: '#444',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      준비물 확인하기
                    </button>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {!loading && userInfo && (
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 18,
              border: '1.5px solid #d93025',
              background: '#fff',
              color: '#d93025',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            로그아웃
          </button>
        )}
      </div>
    </div>
  )
}
