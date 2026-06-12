import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  CalendarDays,
  CircleHelp,
  Globe2,
  Home,
  LogOut,
  MapPin,
  Search,
  Sprout,
  UserRound,
  UserX,
} from 'lucide-react'
import TopBar from '../components/TopBar'
import LoadingProgress from '../components/LoadingProgress'
import useLoadingProgress from '../hooks/useLoadingProgress'
import { deleteMyProfile, fetchProfile } from '../lib/api'
import { findDisplayName, getKakaoUserName, logout } from '../lib/auth'

const SUBMITTED_KEY = 'submittedDiagnosisProfile'
const LOCAL_PROFILE_KEY = 'editableProfileInfo'

function hasValue(v) {
  return v !== null && v !== undefined && String(v).trim() !== ''
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}

function ReadOnlyRow({ label, value, Icon }) {
  const displayValue = hasValue(value) ? value : '미등록'
  const isEmpty = !hasValue(value)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        padding: '13px 0',
        borderBottom: '1px solid #EEF3EA',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 11,
          background: '#F3F8F1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {Icon ? <Icon size={16} color="#076818" strokeWidth={2.2} /> : null}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: '#8A9485',
            letterSpacing: '-0.1px',
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 14,
            fontWeight: 700,
            color: isEmpty ? '#B8B8B3' : '#1F2433',
            lineHeight: 1.45,
            letterSpacing: '-0.2px',
            wordBreak: 'keep-all',
          }}
        >
          {displayValue}
        </p>
      </div>
    </div>
  )
}

function InfoCard({ title, description, children }) {
  return (
    <section
      style={{
        borderRadius: 24,
        background: '#FFFFFF',
        border: '1.5px solid #E4EDDF',
        boxShadow: '0 8px 24px rgba(36,52,32,0.06)',
        padding: '20px 18px 6px',
      }}
    >
      <div style={{ marginBottom: 6 }}>
        <p
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 850,
            color: '#1A1A1A',
            letterSpacing: '-0.35px',
          }}
        >
          {title}
        </p>
        {description && (
          <p
            style={{
              margin: '5px 0 0',
              fontSize: 12.5,
              fontWeight: 500,
              color: '#8B8B84',
              lineHeight: 1.45,
              wordBreak: 'keep-all',
            }}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

function formatBoolean(value) {
  if (value === true) return '예'
  if (value === false) return '아니요'
  return ''
}

function formatDateValue(value, precision = 'day') {
  const digits = String(value || '').replace(/\D/g, '')
  if (precision === 'month') {
    if (digits.length < 6) return value || ''
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`
  }
  if (digits.length < 8) return value || ''
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

function formatLastDiagnosis() {
  const raw = localStorage.getItem('lastDiagnosisDate')
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  const ago = days === 0 ? '오늘' : `${days}일 전`
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} (${ago})`
}

function ConfirmModal({ action, deleting, onCancel, onConfirm }) {
  if (!action) return null
  const isDelete = action === 'delete'
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        background: 'rgba(20,24,20,0.42)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 330,
          borderRadius: 26,
          border: '1.5px solid #DBEAD5',
          background: '#FFFFFF',
          padding: '26px 22px 20px',
          boxSizing: 'border-box',
          textAlign: 'center',
          boxShadow: '0 18px 48px rgba(22,35,24,0.22)',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            margin: '0 auto 14px',
            borderRadius: '50%',
            background: isDelete ? '#FFF0EF' : '#EAF5E8',
            color: isDelete ? '#D93025' : '#076818',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isDelete ? <UserX size={23} strokeWidth={2.2} /> : <LogOut size={23} strokeWidth={2.2} />}
        </div>

        <p style={{ margin: 0, fontSize: 19, fontWeight: 850, color: '#1F2433', lineHeight: 1.35, letterSpacing: '-0.3px' }}>
          {isDelete ? '회원 탈퇴하시겠어요?' : '로그아웃하시겠어요?'}
        </p>
        <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 500, color: '#777', lineHeight: 1.5, wordBreak: 'keep-all' }}>
          {isDelete ? '계정 정보가 삭제되며 되돌릴 수 없어요.' : '다시 이용하려면 카카오 로그인이 필요해요.'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <button
            className="app-action-button"
            type="button"
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 999,
              border: '1.5px solid #E4E8E1',
              background: '#FFFFFF',
              color: '#555',
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: deleting ? 'default' : 'pointer',
              opacity: deleting ? 0.5 : 1,
            }}
          >
            취소
          </button>
          <button
            className="app-action-button"
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 999,
              border: 'none',
              background: isDelete ? '#D93025' : '#076818',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: deleting ? 'default' : 'pointer',
              opacity: deleting ? 0.62 : 1,
            }}
          >
            {deleting ? '처리 중...' : '확인'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BasicInfo() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [nationality, setNationality] = useState('')
  const [diagnosisInfo, setDiagnosisInfo] = useState({})
  const [loading, setLoading] = useState(true)
  const profileProgress = useLoadingProgress(loading)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const lastDiagnosis = formatLastDiagnosis()

  useEffect(() => {
    const submitted = readJson(SUBMITTED_KEY)
    const localProfile = readJson(LOCAL_PROFILE_KEY)
    setDiagnosisInfo(submitted)
    setNationality(localProfile.nationality || submitted.nationality || '')
    setName(localProfile.name || getKakaoUserName() || '')

    fetchProfile()
      .then(data => {
        const p = data?.profile || data?.user_profile || data || {}
        const resolvedName = localProfile.name || findDisplayName(data) || findDisplayName(p) || getKakaoUserName()
        if (resolvedName) setName(resolvedName)
        if (p.birth_date || p.birthDate) setBirthDate(p.birth_date || p.birthDate)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const handleDeleteAccount = async () => {
    if (deleting) return
    setDeleting(true)
    setError('')
    try {
      await deleteMyProfile()
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || '회원 탈퇴에 실패했습니다.')
    } finally {
      setDeleting(false)
      setConfirmAction(null)
    }
  }

  const handleConfirmAction = () => {
    if (confirmAction === 'logout') {
      handleLogout()
      return
    }
    if (confirmAction === 'delete') {
      handleDeleteAccount()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#FDFCF8', overflow: 'hidden' }}>
      <TopBar
        title="프로필 정보"
        onBack={() => navigate('/home')}
        rightAction={{
          label: '도움말',
          onClick: () => navigate('/tutorial'),
          icon: <CircleHelp size={19} strokeWidth={2.2} />,
        }}
      />

      <div
        className="step-form-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '20px 18px calc(118px + env(safe-area-inset-bottom))',
          scrollPaddingBottom: 'calc(118px + env(safe-area-inset-bottom))',
        }}
      >
        {profileProgress.visible ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <LoadingProgress progress={profileProgress.progress} label="정보를 불러오는 중이에요" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section
              style={{
                borderRadius: 26,
                background: 'linear-gradient(135deg, #F1F8EF 0%, #FFFFFF 72%)',
                border: '1.5px solid #DDEBD7',
                boxShadow: '0 8px 24px rgba(36,52,32,0.06)',
                padding: '20px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: '#076818',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <UserRound size={23} strokeWidth={2.3} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#6F8069' }}>내 프로필</p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 21,
                      fontWeight: 850,
                      color: '#172116',
                      letterSpacing: '-0.4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {hasValue(name) ? name : '이름 미등록'}
                  </p>
                  {lastDiagnosis && (
                    <p style={{ margin: '7px 0 0', fontSize: 12.5, fontWeight: 600, color: '#6F8069', lineHeight: 1.45 }}>
                      최종 진단: {lastDiagnosis}
                    </p>
                  )}
                </div>
              </div>

              <button
                className="app-action-button"
                type="button"
                onClick={() => navigate('/step1')}
                style={{
                  width: '100%',
                  minHeight: 50,
                  marginTop: 18,
                  border: 'none',
                  borderRadius: 999,
                  background: '#FFA100',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 8px 18px rgba(255,161,0,0.22)',
                }}
              >
                <Search size={17} strokeWidth={2.4} />
                나의 맞춤 지원금 다시 찾기
              </button>
            </section>

            <InfoCard title="기본 정보" description="회원가입 및 프로필에 저장된 기본 정보예요.">
              <ReadOnlyRow label="이름" value={name} Icon={UserRound} />
              <ReadOnlyRow label="생년월일" value={formatDateValue(birthDate)} Icon={CalendarDays} />
              <ReadOnlyRow label="국적" value={nationality} Icon={Globe2} />
              {error && (
                <p style={{ margin: '12px 0 10px', fontSize: 13, fontWeight: 700, color: '#D93025', lineHeight: 1.45 }}>
                  {error}
                </p>
              )}
            </InfoCard>

            <InfoCard title="진단 정보" description="맞춤 지원금 추천에 사용되는 정보예요.">
              <ReadOnlyRow label="현재 거주지" value={diagnosisInfo.location || diagnosisInfo.region} Icon={MapPin} />
              <ReadOnlyRow label="옥천 이사 날짜" value={formatDateValue(diagnosisInfo.movedAt, 'month')} Icon={Home} />
              <ReadOnlyRow label="이전 거주지" value={diagnosisInfo.previousResidence} Icon={MapPin} />
              <ReadOnlyRow label="이전 거주 시작일" value={formatDateValue(diagnosisInfo.previousSince, 'month')} Icon={CalendarDays} />
              <ReadOnlyRow label="현재 직업" value={diagnosisInfo.job} Icon={Briefcase} />
              <ReadOnlyRow label="농사 여부" value={formatBoolean(diagnosisInfo.farming)} Icon={Sprout} />
              <ReadOnlyRow label="농업경영체" value={formatBoolean(diagnosisInfo.farmBusiness)} Icon={Building2} />
            </InfoCard>

            <section
              style={{
                borderRadius: 24,
                background: '#FFFFFF',
                border: '1.5px solid #E4EDDF',
                boxShadow: '0 8px 24px rgba(36,52,32,0.05)',
                padding: '18px',
              }}
            >
              <p style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 850, color: '#1A1A1A', letterSpacing: '-0.3px' }}>
                계정 관리
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <button
                  className="app-action-button"
                  type="button"
                  onClick={() => setConfirmAction('logout')}
                  style={{
                    width: '100%',
                    minHeight: 48,
                    borderRadius: 999,
                    border: '1.5px solid #D93025',
                    background: '#FFFFFF',
                    color: '#D93025',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <LogOut size={17} strokeWidth={2.4} />
                  로그아웃
                </button>

                <button
                  className="app-action-button"
                  type="button"
                  onClick={() => setConfirmAction('delete')}
                  disabled={deleting}
                  style={{
                    width: '100%',
                    minHeight: 48,
                    borderRadius: 999,
                    border: '1.5px solid #E0E0DC',
                    background: '#FAFAF8',
                    color: '#777771',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: deleting ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <UserX size={17} strokeWidth={2.4} />
                  {deleting ? '탈퇴 처리 중...' : '회원 탈퇴'}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      <ConfirmModal
        action={confirmAction}
        deleting={deleting}
        onCancel={() => {
          if (!deleting) setConfirmAction(null)
        }}
        onConfirm={handleConfirmAction}
      />
    </div>
  )
}
