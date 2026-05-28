import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import SelectField from '../components/SelectField'
import Button from '../components/Button'
import { fetchProfile, updateProfile } from '../lib/api'
import { findDisplayName, getKakaoUserName } from '../lib/auth'

const SUBMITTED_KEY = 'submittedDiagnosisProfile'
const LOCAL_PROFILE_KEY = 'editableProfileInfo'

function hasValue(v) {
  return v !== null && v !== undefined && String(v).trim() !== ''
}

function isCompleteDate(value) {
  const [y, m, d] = (value || '').split('-')
  return hasValue(y) && hasValue(m) && hasValue(d)
}

function normalizeDate(value) {
  const parts = (value || '').split('-')
  return parts[0] && parts[1] && parts[2]
    ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    : ''
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}

function ProfileTextField({ label, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.1px' }}>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          minHeight: 49,
          padding: '13px 16px',
          boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#076818' : '#e8e8e8'}`,
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 400,
          color: '#1a1a1a',
          background: '#fff',
          fontFamily: 'inherit',
          outline: 'none',
          letterSpacing: '-0.2px',
          boxShadow: focused ? '0 0 0 4px rgba(45,106,45,0.08)' : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      />
    </div>
  )
}

function DateSelectField({ label, value, onChange }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.1px' }}>{label}</label>
      <input
        type="date"
        value={normalizeDate(value)}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          minHeight: 49,
          padding: '13px 16px',
          boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#076818' : '#e8e8e8'}`,
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 400,
          color: value ? '#1a1a1a' : '#aaa',
          background: '#fff',
          fontFamily: 'inherit',
          outline: 'none',
          letterSpacing: '-0.2px',
          colorScheme: 'light',
          cursor: 'pointer',
          boxShadow: focused ? '0 0 0 4px rgba(45,106,45,0.08)' : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      />
    </div>
  )
}

function ReadOnlyRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid #f0eee8',
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#9a948a', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

export default function BasicInfo() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [nationality, setNationality] = useState('')
  const [diagnosisInfo, setDiagnosisInfo] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  const isComplete = hasValue(name) && isCompleteDate(birthDate) && hasValue(nationality)

  const handleSave = async () => {
    if (!isComplete || submitting) return
    setSubmitting(true)
    setError('')
    try {
      try {
        await updateProfile({
          name,
          display_name: name,
          birth_date: birthDate,
        })
      } catch {
        await updateProfile({ birth_date: birthDate })
      }
      const submitted = readJson(SUBMITTED_KEY)
      localStorage.setItem(SUBMITTED_KEY, JSON.stringify({ ...submitted, nationality }))
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify({ name, birthDate, nationality }))
      if (name) localStorage.setItem('kakaoUserName', name)
      navigate('/mypage')
    } catch (err) {
      setError(err.message || '저장하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#FDFCF8', overflow: 'hidden' }}>
      <TopBar title="프로필 정보" onBack={() => navigate('/mypage')} />

      <div className="step-form-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 18px 156px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {loading ? (
          <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginTop: 40 }}>정보를 불러오는 중...</p>
        ) : (
          <>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.3px' }}>기본 정보</p>
              </div>
              <ProfileTextField label="이름" value={name} onChange={setName} placeholder="이름 입력" />
              <DateSelectField label="생년월일" value={birthDate} onChange={setBirthDate} />
              <SelectField
                label="내외국인"
                value={nationality}
                onChange={setNationality}
                options={[
                  { value: '내국인', label: '내국인' },
                  { value: '외국인', label: '외국인' },
                ]}
                placeholder="내외국인 선택"
              />
              {error && (
                <p style={{ fontSize: 13, fontWeight: 600, color: '#d93025' }}>{error}</p>
              )}
            </section>

            <section style={{
              background: '#fff',
              border: '1.5px solid #e8e8e8',
              borderRadius: 22,
              padding: '18px 16px 4px',
              boxShadow: '0 10px 24px rgba(7,104,24,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.3px' }}>진단 정보</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/step1')}
                  style={{
                    flexShrink: 0,
                    minHeight: 32,
                    padding: '0 11px',
                    border: 'none',
                    borderRadius: 13,
                    background: '#e8f3e8',
                    color: '#076818',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  다시 진단하기
                </button>
              </div>
              <ReadOnlyRow label="현재 거주지" value={diagnosisInfo.location || diagnosisInfo.region} />
              <ReadOnlyRow label="옥천 이사 날짜" value={diagnosisInfo.movedAt} />
              <ReadOnlyRow label="이전 거주지" value={diagnosisInfo.previousResidence} />
              <ReadOnlyRow label="이전 거주 시작일" value={diagnosisInfo.previousSince} />
              <ReadOnlyRow label="현재 직업" value={diagnosisInfo.job} />
              <ReadOnlyRow label="농사 여부" value={formatBoolean(diagnosisInfo.farming)} />
              <ReadOnlyRow label="농업경영체" value={formatBoolean(diagnosisInfo.farmBusiness)} />
              <ReadOnlyRow label="귀농 교육 100시간" value={formatBoolean(diagnosisInfo.farmingEducation)} />
            </section>
          </>
        )}
      </div>

      <div style={{
        position: 'fixed',
        bottom: 96,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 390,
        padding: '16px 28px 16px',
        background: '#FDFCF8',
        boxShadow: '0 -18px 28px rgba(253,252,248,0.92)',
        zIndex: 50,
      }}>
        <Button onClick={handleSave} disabled={submitting || !isComplete || loading} variant="pill">
          {submitting ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
