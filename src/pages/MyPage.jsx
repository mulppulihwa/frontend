import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, MapPin, Check, Clock3, X, ChevronRight } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
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
        <circle cx="13" cy="13" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 13 13)" />
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

function normalizeProfile(profile) {
  const kakaoAccount = profile.kakao_account || profile.kakaoAccount || {}
  const kakaoProfile = kakaoAccount.profile || profile.properties || profile.kakao_profile || {}
  const profileData = profile.profile || profile.user_profile || profile.userProfile || {}
  const user = profile.user || profile.account || profile.member || {}
  const kakao = profile.kakao || profile.kakao_user || profile.kakaoUser || {}
  const region = firstValue(profile.region, ['name', 'region_name']) || firstValue(profile, ['region_name', 'region'])
  const occupationTags = profile.occupation_tags || profileData.occupation_tags || []
  const isReturnFarmer = Array.isArray(occupationTags)
    ? occupationTags.includes('귀농')
    : null

  return {
    name: findDisplayName(profile)
      || findDisplayName(user)
      || findDisplayName(profileData)
      || findDisplayName(kakaoProfile)
      || findDisplayName(kakao)
      || getKakaoUserName(),
    age: firstValue(profile, ['age']),
    gender: firstValue(profile, ['gender']) || firstValue(kakaoAccount, ['gender']),
    region,
    farming: isReturnFarmer ?? profile.farming ?? profile.is_farmer ?? profile.isFarmer ?? null,
    movedAt: firstValue(profile, ['moved_at', 'movedAt', 'move_in_date']),
  }
}

function SectionTitle({ children }) {
  return (
    <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', marginBottom: 10, paddingLeft: 2 }}>
      {children}
    </p>
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

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', background: '#FDFCF8',
      overflowX: 'hidden', boxSizing: 'border-box',
      width: '100%',
    }}>
      <TopBar title="마이페이지" />

      <div style={{ padding: '8px 18px 100px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {loading && (
          <Card>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#555' }}>마이페이지 정보를 불러오는 중입니다.</p>
          </Card>
        )}

        {!loading && authRequired && (
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', marginBottom: 5 }}>로그인이 필요해요</p>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.45 }}>
                  카카오 로그인 후 프로필과 지원 현황을 확인할 수 있어요.
                </p>
              </div>
              <button
                onClick={() => startKakaoLogin('/mypage')}
                style={{
                  height: 48, border: 'none', borderRadius: 14,
                  background: '#FEE500', color: '#111',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                카카오 로그인
              </button>
            </div>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#d93025' }}>{error}</p>
          </Card>
        )}

        {/* Profile */}
        {!loading && userInfo && (
        <div>
          <SectionTitle>개인 정보</SectionTitle>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, paddingBottom: 16, borderBottom: '1.5px solid #e8e8e8' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: '#e8f3e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <User size={26} color="#076818" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
                  {userInfo.name || '카카오 사용자'}님
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <MapPin size={13} color="#888" strokeWidth={2} />
                  <span style={{ fontSize: 13, color: '#888', letterSpacing: '-0.1px' }}>{userInfo.region || '지역 미등록'} 거주</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/step1')}
                style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2,
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 500, color: '#888',
                }}
              >
                수정 <ChevronRight size={15} color="#aaa" strokeWidth={2.2} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '나이', value: userInfo.age ? `${userInfo.age}세` : '미등록' },
                { label: '성별', value: userInfo.gender || '미등록' },
                { label: '귀농 여부', value: userInfo.farming === null ? '미등록' : userInfo.farming ? '귀농' : '비귀농' },
                { label: '이사 날짜', value: userInfo.movedAt || '미등록' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#555', letterSpacing: '-0.1px' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.2px' }}>{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: '100%', height: 46, marginTop: 18,
                borderRadius: 14, border: '1.5px solid #e4e4e4',
                background: '#fff', color: '#666',
                fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              로그아웃
            </button>
          </Card>
        </div>
        )}

        {/* 지원 현황 */}
        {!loading && userInfo && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 2 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>지원 현황</p>
            <button
              onClick={() => navigate('/grant-status')}
              style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#888' }}
            >
              전체 보기 <ChevronRight size={15} color="#aaa" strokeWidth={2.2} />
            </button>
          </div>
          <Card>
            <div style={{ display: 'flex' }}>
              {[
                { key: '신청완료', label: '신청 완료', color: '#076818', bg: '#e8f3e8' },
                { key: '신청예정', label: '신청 예정', color: '#FFA100', bg: '#fff3e0' },
              ].map(({ key, label, color }, i, arr) => {
                const count = grantStatuses.filter(g => g.status === key).length
                return (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      padding: '8px 0',
                      borderRight: i < arr.length - 1 ? '1.5px solid #f0f0f0' : 'none',
                    }}
                  >
                    <p style={{ fontSize: 25, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{count}</p>
                    <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: '-0.1px' }}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
        )}

        {/* 신청 진행 중 */}
        {!loading && userInfo && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 2 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>신청 진행 중</p>
            <button
              onClick={() => navigate('/grant-status')}
              style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#888' }}
            >
              전체 보기 <ChevronRight size={15} color="#aaa" strokeWidth={2.2} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {grantStatuses.filter(g => g.status === '신청예정' || g.status === '신청완료').length === 0 && (
              <Card>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#666' }}>아직 저장된 지원 현황이 없어요.</p>
              </Card>
            )}
            {grantStatuses.filter(g => g.status === '신청예정' || g.status === '신청완료').map(g => {
              const cfg = statusConfig[g.status]
              const Icon = cfg.Icon
              return (
                <Card key={g.id}>
                  <div
                    onClick={() => navigate('/detail', { state: { grant: g } })}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  >
                    <div style={{ width: 48, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#FF0000', letterSpacing: '-0.3px' }}>{getDday(g.deadline)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.2px', marginBottom: 2 }}>{g.title}</p>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: cfg.bg, borderRadius: 8, padding: '3px 7px' }}>
                        <Icon size={10} color={cfg.color} strokeWidth={2.5} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <MiniRing done={g.checkDone} total={g.checkTotal} />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/checklist')}
                    style={{
                      marginTop: 10, width: '100%', padding: '10px 0', borderRadius: 12,
                      border: '1.5px solid #e8e8e8', background: '#fafafa',
                      color: '#444', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.2px',
                    }}
                  >
                    준비물 확인하기
                  </button>
                </Card>
              )
            })}
          </div>
        </div>
        )}

      </div>
    </div>
  )
}
