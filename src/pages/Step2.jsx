import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import StepIndicator from '../components/StepIndicator'
import SelectField from '../components/SelectField'
import Button from '../components/Button'
import SearchAnimation from '../components/SearchAnimation'
import { updateProfile } from '../lib/api'

function Header() {
  return (
    <div style={{ padding: '20px 18px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', textAlign: 'center', marginBottom: 2, letterSpacing: '-0.3px', lineHeight: 1.55, animation: 'fadeUp 0.5s ease both' }}>
        귀농·귀향하셨나요?
      </h2>
      <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', textAlign: 'center', marginBottom: 0, letterSpacing: '-0.3px', lineHeight: 1.55, animation: 'fadeUp 0.5s ease 0.15s both' }}>
        받을 수 있는 지원금을 찾아드려요
      </p>
      <SearchAnimation />
    </div>
  )
}

export default function Step2() {
  const navigate = useNavigate()
  const [since, setSince] = useState('1년 이내')
  const [household, setHousehold] = useState('혼자')
  const [income, setIncome] = useState('기초수급')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await updateProfile({
        farming_since: since,
        household_type: household,
        income_level: income,
      })
      navigate('/loading')
    } catch (err) {
      setError(err.message || '입력 정보를 저장하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>
      <div style={{ background: '#FDFCF8' }}>
        <TopBar title="정보 입력" onBack={() => navigate('/step1')} />
        <div style={{ padding: '8px 18px 10px' }}>
          <StepIndicator current={2} total={2} />
        </div>
      </div>

      <Header />

      <div style={{ padding: '0 18px 160px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SelectField label="시작한 지" value={since} onChange={setSince} options={[
            { value: '1년 이내', label: '1년 이내' },
            { value: '2년 이내', label: '2년 이내' },
            { value: '3년 이내', label: '3년 이내' },
            { value: '3년 이상', label: '3년 이상' },
          ]} />
          <SelectField label="가구 유형" value={household} onChange={setHousehold} options={[
            { value: '혼자', label: '혼자' },
            { value: '부부', label: '부부' },
            { value: '가족', label: '가족' },
          ]} />
          <SelectField label="소득 구간" value={income} onChange={setIncome} options={[
            { value: '기초수급', label: '기초수급' },
            { value: '차상위', label: '차상위' },
            { value: '일반', label: '일반' },
          ]} />
          {error && (
            <p style={{ fontSize: 13, fontWeight: 600, color: '#d93025', lineHeight: 1.45 }}>
              {error}
            </p>
          )}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 'max(12px, env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, boxSizing: 'border-box', padding: '16px 28px 16px', background: '#FDFCF8', boxShadow: '0 -18px 28px rgba(253,252,248,0.92)', zIndex: 50 }}>
        <Button onClick={handleSubmit} disabled={submitting} variant="pill">
          {submitting ? '저장 중...' : '내 지원금 찾기'}
        </Button>
      </div>
    </div>
  )
}
