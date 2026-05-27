import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import SelectField from '../components/SelectField'
import Button from '../components/Button'
import { fetchProfile, updateProfile } from '../lib/api'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 80 }, (_, i) => {
  const y = currentYear - i
  return { value: String(y), label: `${y}년` }
})
const months = Array.from({ length: 12 }, (_, i) => {
  const m = i + 1
  return { value: String(m).padStart(2, '0'), label: `${m}월` }
})
const days = Array.from({ length: 31 }, (_, i) => {
  const d = i + 1
  return { value: String(d).padStart(2, '0'), label: `${d}일` }
})

const GENDER_API_VALUES = { 남자: '남', 여자: '여' }

function hasValue(v) {
  return v !== null && v !== undefined && String(v).trim() !== ''
}

function isCompleteDate(value) {
  const [y, m, d] = (value || '').split('-')
  return hasValue(y) && hasValue(m) && hasValue(d)
}

function DateSelectField({ label, value, onChange }) {
  const [y = '', m = '', d = ''] = (value || '').split('-')
  const update = (ny, nm, nd) => {
    if (!ny && !nm && !nd) { onChange(''); return }
    onChange(`${ny || ''}-${nm || ''}-${nd || ''}`)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.1px' }}>{label}</label>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
        <SelectField value={y} onChange={v => update(v, m, d)} options={years} placeholder="년" />
        <SelectField value={m} onChange={v => update(y, v, d)} options={months} placeholder="월" />
        <SelectField value={d} onChange={v => update(y, m, v)} options={days} placeholder="일" />
      </div>
    </div>
  )
}

export default function BasicInfo() {
  const navigate = useNavigate()
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [nationality, setNationality] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
      .then(data => {
        const p = data?.profile || data?.user_profile || data || {}
        const bd = p.birth_date || p.birthDate || ''
        const g = p.gender === '남' ? '남자' : p.gender === '여' ? '여자' : p.gender || ''
        const nat = p.nationality || ''
        if (bd) setBirthDate(bd)
        if (g) setGender(g)
        if (nat) setNationality(nat)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const isComplete = isCompleteDate(birthDate) && hasValue(gender) && hasValue(nationality)

  const handleSave = async () => {
    if (!isComplete || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await updateProfile({
        birth_date: birthDate,
        gender: GENDER_API_VALUES[gender] || gender,
        nationality,
      })
      navigate('/mypage')
    } catch (err) {
      setError(err.message || '저장하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#FDFCF8' }}>
      <TopBar title="기본 정보" onBack={() => navigate('/mypage')} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 18px 120px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginTop: 40 }}>정보를 불러오는 중...</p>
        ) : (
          <>
            <DateSelectField
              label="생년월일이 어떻게 되세요?"
              value={birthDate}
              onChange={setBirthDate}
            />
            <SelectField
              label="성별이 어떻게 되세요?"
              value={gender}
              onChange={setGender}
              options={[
                { value: '남자', label: '남자' },
                { value: '여자', label: '여자' },
              ]}
              placeholder="성별 선택"
            />
            <SelectField
              label="국적이 어떻게 되세요?"
              value={nationality}
              onChange={setNationality}
              options={[
                { value: '내국인', label: '내국인' },
                { value: '외국인', label: '외국인' },
              ]}
              placeholder="국적 선택"
            />
            {error && (
              <p style={{ fontSize: 13, fontWeight: 600, color: '#d93025' }}>{error}</p>
            )}
          </>
        )}
      </div>

      <div style={{
        position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390, padding: '12px 28px 16px',
        background: 'linear-gradient(to top, #FDFCF8 80%, transparent)', zIndex: 50,
      }}>
        <Button onClick={handleSave} disabled={submitting || !isComplete || loading} variant="pill">
          {submitting ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
