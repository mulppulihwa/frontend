import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleHelp,
  Flag,
  MapPin,
  Search,
  Sprout,
  UserRound,
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

function ReadOnlyRow({ label, value }) {
  const Icon = label.includes('이름')
    ? UserRound
    : label.includes('생년') || label.includes('날짜') || label.includes('시작일')
      ? CalendarDays
      : label.includes('국적')
        ? Flag
        : label.includes('거주')
          ? MapPin
          : label.includes('직업')
            ? BriefcaseBusiness
            : label.includes('경영체')
              ? Building2
              : Sprout

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '20px minmax(82px, auto) minmax(0, 1fr)',
      alignItems: 'start',
      gap: 9,
      padding: '3px 0',
    }}>
      <Icon size={17} color="#6d766a" strokeWidth={2.1} style={{ marginTop: 1 }} />
      <span style={{ fontSize: 13, fontWeight: 650, color: '#747b72', lineHeight: 1.5 }}>{label}</span>
      <span style={{ minWidth: 0, fontSize: 14, fontWeight: 550, color: '#292e29', textAlign: 'right', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
        {hasValue(value) ? value : '미등록'}
      </span>
    </div>
  )
}

function formatBoolean(value) {
  if (value === true) return '예'
  if (value === false) return '아니요'
  return ''
}

function formatResidenceType(value) {
  if (value === true || value === '농촌' || value === '읍면') return '농촌'
  if (value === false || value === '도시' || value === '동') return '도시'
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
        background: 'rgba(0,0,0,0.32)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 318,
          borderRadius: 24,
          border: '1.5px solid #dbead5',
          background: '#FFFFFF',
          padding: '28px 22px 20px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 19, fontWeight: 800, color: '#1f2433', lineHeight: 1.35, letterSpacing: '-0.3px' }}>
          {isDelete ? '회원 탈퇴하시겠어요?' : '로그아웃하시겠어요?'}
        </p>
        <p style={{ marginTop: 10, fontSize: 13, fontWeight: 500, color: '#777', lineHeight: 1.45, wordBreak: 'keep-all' }}>
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
              border: '1.5px solid #e8e8e8',
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
              background: isDelete ? '#d93025' : '#076818',
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
        if (p.prev_residence_is_rural !== undefined && p.prev_residence_is_rural !== null) {
          setDiagnosisInfo(current => ({
            ...current,
            previousResidenceIsRural: p.prev_residence_is_rural,
          }))
        }
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
          padding: '18px 18px calc(118px + env(safe-area-inset-bottom))',
          scrollPaddingBottom: 'calc(118px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {profileProgress.visible ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <LoadingProgress progress={profileProgress.progress} label="정보를 불러오는 중이에요" />
          </div>
        ) : (
          <>
            <section style={{ borderRadius: 24, background: '#fff', boxShadow: '0 4px 20px rgba(31,45,35,0.08)', padding: 20 }}>
              <span style={{ display: 'inline-flex', borderRadius: 999, background: '#e8f3e8', color: '#076818', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                내 정보
              </span>
              <h2 style={{ margin: '12px 0 5px', fontSize: 22, lineHeight: 1.3, color: '#1f2433', fontWeight: 700, letterSpacing: 0 }}>
                {name || '사용자'}님
              </h2>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#555', lineHeight: 1.55 }}>
                내 조건에 맞는 지원 정보를 확인해보세요.
              </p>
              {lastDiagnosis && (
                <p style={{ margin: '9px 0 0', fontSize: 12, fontWeight: 550, color: '#747b72', lineHeight: 1.45 }}>
                  최종 진단 · {lastDiagnosis}
                </p>
              )}
              <button
                className="app-action-button"
                type="button"
                onClick={() => navigate('/step1')}
                style={{
                  width: '100%',
                  minHeight: 46,
                  marginTop: 17,
                  border: 'none',
                  borderRadius: 999,
                  background: '#FFA100',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Search size={17} strokeWidth={2.4} />
                나의 맞춤 지원금 다시 찾기
              </button>
            </section>

            <section style={{ borderRadius: 24, background: '#fff', boxShadow: '0 4px 20px rgba(31,45,35,0.08)', padding: 20, display: 'grid', gap: 13 }}>
              <h2 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 700, color: '#1f2433', lineHeight: 1.4, letterSpacing: 0 }}>기본 정보</h2>
              <ReadOnlyRow label="이름" value={name} />
              <ReadOnlyRow label="생년월일" value={formatDateValue(birthDate)} />
              <ReadOnlyRow label="국적" value={nationality} />
              {error && (
                <p style={{ fontSize: 13, fontWeight: 600, color: '#d93025' }}>{error}</p>
              )}
            </section>

            <section style={{ borderRadius: 24, background: '#fff', boxShadow: '0 4px 20px rgba(31,45,35,0.08)', padding: 20, display: 'grid', gap: 13 }}>
              <h2 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 700, color: '#1f2433', lineHeight: 1.4, letterSpacing: 0 }}>진단 정보</h2>
              <ReadOnlyRow label="현재 거주지" value={diagnosisInfo.location || diagnosisInfo.region} />
              <ReadOnlyRow label="옥천 이사 날짜" value={formatDateValue(diagnosisInfo.movedAt, 'month')} />
              <ReadOnlyRow
                label="이전 거주지 유형"
                value={formatResidenceType(
                  diagnosisInfo.previousResidenceIsRural
                    ?? diagnosisInfo.previousResidenceType
                )}
              />
              <ReadOnlyRow label="이전 거주 시작일" value={formatDateValue(diagnosisInfo.previousSince, 'month')} />
              <ReadOnlyRow label="현재 직업" value={diagnosisInfo.job} />
              <ReadOnlyRow label="농사 여부" value={formatBoolean(diagnosisInfo.farming)} />
              <ReadOnlyRow label="농업경영체" value={formatBoolean(diagnosisInfo.farmBusiness)} />
            </section>

            <section style={{ borderRadius: 24, background: '#fff', boxShadow: '0 4px 20px rgba(31,45,35,0.08)', padding: 20 }}>
              <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 700, color: '#1f2433', lineHeight: 1.4, letterSpacing: 0 }}>계정 관리</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                <button
                  className="app-action-button"
                  type="button"
                  onClick={() => setConfirmAction('logout')}
                  style={{
                    minHeight: 46,
                    borderRadius: 999,
                    border: '1.5px solid #dfe4dc',
                    background: '#FFFFFF',
                    color: '#4d554a',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  로그아웃
                </button>

                <button
                  className="app-action-button"
                  type="button"
                  onClick={() => setConfirmAction('delete')}
                  disabled={deleting}
                  style={{
                    minHeight: 46,
                    borderRadius: 999,
                    border: '1.5px solid #f0d2cf',
                    background: '#FFFFFF',
                    color: '#d93025',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: deleting ? 0.5 : 1,
                  }}
                >
                  {deleting ? '탈퇴 처리 중...' : '회원 탈퇴'}
                </button>
              </div>
            </section>
          </>
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
