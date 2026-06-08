import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
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
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid #edf3ea',
    }}>
      <span style={{ fontSize: 12, fontWeight: 400, color: '#9a948a', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 400, color: '#1f2433', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
      <TopBar title="프로필 정보" onBack={() => navigate('/home')} />

      <div className="step-form-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 18px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {loading ? (
          <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginTop: 40 }}>정보를 불러오는 중...</p>
        ) : (
          <>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lastDiagnosis && (
                <p style={{ fontSize: 13, fontWeight: 500, color: '#666', margin: 0, textAlign: 'center' }}>
                  최종 진단 : {lastDiagnosis}
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate('/step1')}
                style={{
                  width: 'min(100%, 240px)',
                  alignSelf: 'center',
                  minHeight: 50,
                  border: 'none',
                  borderRadius: 999,
                  background: '#FFA100',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                나의 맞춤 지원금 다시 찾기
              </button>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.3px' }}>기본 정보</p>
              </div>
              <ReadOnlyRow label="이름" value={name} />
              <ReadOnlyRow label="생년월일" value={birthDate} />
              <ReadOnlyRow label="국적" value={nationality} />
              {error && (
                <p style={{ fontSize: 13, fontWeight: 600, color: '#d93025' }}>{error}</p>
              )}
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.3px' }}>진단 정보</p>
              </div>
              <ReadOnlyRow label="현재 거주지" value={diagnosisInfo.location || diagnosisInfo.region} />
              <ReadOnlyRow label="옥천 이사 날짜" value={diagnosisInfo.movedAt} />
              <ReadOnlyRow label="이전 거주지" value={diagnosisInfo.previousResidence} />
              <ReadOnlyRow label="이전 거주 시작일" value={diagnosisInfo.previousSince} />
              <ReadOnlyRow label="현재 직업" value={diagnosisInfo.job} />
              <ReadOnlyRow label="농사 여부" value={formatBoolean(diagnosisInfo.farming)} />
              <ReadOnlyRow label="농업경영체" value={formatBoolean(diagnosisInfo.farmBusiness)} />
            </section>

            <button
              type="button"
              onClick={() => setConfirmAction('logout')}
              style={{
                width: 'min(100%, 240px)',
                alignSelf: 'center',
                minHeight: 50,
                borderRadius: 999,
                border: '1.5px solid #d93025',
                background: '#FFFFFF',
                color: '#d93025',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              로그아웃
            </button>

            <button
              type="button"
              onClick={() => setConfirmAction('delete')}
              disabled={deleting}
              style={{
                width: 'min(100%, 240px)',
                alignSelf: 'center',
                minHeight: 50,
                borderRadius: 999,
                border: '1.5px solid #f1d0cd',
                background: '#FFFFFF',
                color: '#d93025',
                fontSize: 14,
                fontWeight: 700,
                cursor: deleting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: deleting ? 0.5 : 1,
              }}
            >
              {deleting ? '탈퇴 처리 중...' : '회원 탈퇴'}
            </button>
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
