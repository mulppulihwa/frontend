import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import StepIndicator from '../components/StepIndicator'
import SelectField from '../components/SelectField'
import Button from '../components/Button'
import SearchAnimation from '../components/SearchAnimation'

const fieldGap = 12

const textInputStyle = {
  width: '100%',
  padding: '12px 14px',
  boxSizing: 'border-box',
  border: '1.5px solid #e8e8e8',
  borderRadius: 16,
  fontSize: 20,
  fontWeight: 600,
  color: '#1a1a1a',
  background: '#fff',
  fontFamily: 'inherit',
  outline: 'none',
  letterSpacing: '-0.2px',
}

const labelStyle = {
  fontSize: 18,
  fontWeight: 600,
  color: '#1a1a1a',
  letterSpacing: '-0.1px',
}

const radioRows = [
  { label: '예, 귀농했어요', value: true },
  { label: '아니요', value: false },
]

function Header() {
  return (
    <div style={{ padding: '20px 18px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', textAlign: 'center', marginBottom: 2, letterSpacing: '-0.3px', lineHeight: 1.55, animation: 'fadeUp 0.5s ease both' }}>
        귀농·귀향하셨나요?
      </h2>
      <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', textAlign: 'center', marginBottom: 0, letterSpacing: '-0.3px', lineHeight: 1.55, animation: 'fadeUp 0.5s ease 0.15s both' }}>
        받을 수 있는 지원금을 찾아드려요
      </p>
      <SearchAnimation />
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, type = 'text', min, max, suffix }) {
  const [focused, setFocused] = useState(false)
  const isNumber = type === 'number'
  const isDate = type === 'date'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={isNumber ? 'numeric' : undefined}
          min={isNumber ? min ?? 0 : undefined}
          max={isNumber ? max : undefined}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...textInputStyle,
            minHeight: 56,
            paddingRight: suffix ? 46 : 14,
            borderColor: focused ? '#2d6a2d' : '#e8e8e8',
            boxShadow: focused ? '0 0 0 4px rgba(45,106,45,0.08)' : 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            colorScheme: 'light',
            cursor: isDate ? 'pointer' : 'text',
          }}
        />
        {suffix && (
          <span style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 17,
            fontWeight: 700,
            color: '#777',
            pointerEvents: 'none',
          }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function RadioGroup({ label, value, onChange, options = radioRows }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        {options.map(opt => {
          const active = value === opt.value
          const tone = opt.value ? {
            bg: '#f0f7f0',
            border: '#2d6a2d',
            color: '#2d6a2d',
          } : {
            bg: '#fff4e5',
            border: '#FF9500',
            color: '#FF9500',
          }
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              style={{
                minHeight: 56,
                padding: '0 14px',
                border: `1.5px solid ${active ? tone.border : '#e8e8e8'}`,
                borderRadius: 16,
                background: active ? tone.bg : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 17,
                fontWeight: 700,
                color: active ? tone.color : '#1a1a1a',
                letterSpacing: '-0.2px',
                textAlign: 'center',
                boxShadow: 'none',
                transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease, color 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Step1() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [age, setAge] = useState('67')
  const [gender, setGender] = useState('남자')
  const [nationality, setNationality] = useState('내국인')
  const [farming, setFarming] = useState(true)
  const [location, setLocation] = useState('옥천군 or 옥천 외')
  const [movedAt, setMovedAt] = useState('2026-05-15')
  const [previousResidence, setPreviousResidence] = useState('내국인')
  const [previousSince, setPreviousSince] = useState('2023-03-01')
  const [job, setJob] = useState('퇴직 / 직장인 / 기타')
  const [farmBusiness, setFarmBusiness] = useState(true)
  const [outsideIncome, setOutsideIncome] = useState('')
  const [region, setRegion] = useState('옥천군')

  const goBack = () => {
    if (page === 1) {
      navigate('/')
      return
    }
    setPage(prev => prev - 1)
  }

  const goNext = () => {
    if (page === 4) {
      navigate('/step2')
      return
    }
    setPage(prev => prev + 1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>
      <div style={{ background: '#FDFCF8' }}>
        <TopBar title="정보 입력" onBack={goBack} />
        <div style={{ padding: '8px 18px 10px' }}>
          <StepIndicator current={page} total={4} />
        </div>
      </div>

      <Header />

      <div style={{ padding: '0 18px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {page === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: fieldGap }}>
            <TextField label="나이가 어떻게 되세요?" value={age} onChange={setAge} type="number" min={0} max={120} />
            <SelectField label="성별이 어떻게 되세요?" value={gender} onChange={setGender} options={[
              { value: '남자', label: '남자' },
              { value: '여자', label: '여자' },
            ]} />
            <SelectField label="국적이 어떻게 되세요?" value={nationality} onChange={setNationality} options={[
              { value: '내국인', label: '내국인' },
              { value: '외국인', label: '외국인' },
            ]} />
            <div style={{ paddingTop: 10 }}>
              <RadioGroup label="농사 지으세요?" value={farming} onChange={setFarming} />
            </div>
          </div>
        )}

        {page === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: fieldGap }}>
            <SelectField label="현재 어디 사세요?" value={location} onChange={setLocation} options={[
              { value: '옥천군 or 옥천 외', label: '옥천군 or 옥천 외' },
              { value: '옥천군', label: '옥천군' },
              { value: '옥천 외', label: '옥천 외' },
            ]} />
            <TextField label="옥천군으로 언제 이사 오셨나요?/오실 예정인가요?" value={movedAt} onChange={setMovedAt} type="date" />
            <SelectField label="이전 거주지는 어디인가요?" value={previousResidence} onChange={setPreviousResidence} options={[
              { value: '내국인', label: '내국인' },
              { value: '옥천 외', label: '옥천 외' },
              { value: '충북 외', label: '충북 외' },
            ]} />
            <TextField label="이전 거주지에서 언제부터 거주하셨나요?" value={previousSince} onChange={setPreviousSince} type="date" />
          </div>
        )}

        {page === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: fieldGap }}>
            <SelectField label="현재 직업이 어떻게 되시나요?" value={job} onChange={setJob} options={[
              { value: '퇴직 / 직장인 / 기타', label: '퇴직 / 직장인 / 기타' },
              { value: '자영업', label: '자영업' },
              { value: '농업', label: '농업' },
            ]} />
            <RadioGroup label="농사 지으세요?" value={farming} onChange={setFarming} />
            <RadioGroup label="농업경영체를 운영하시나요?" value={farmBusiness} onChange={setFarmBusiness} options={[
              { label: '예', value: true },
              { label: '아니요', value: false },
            ]} />
            <TextField label="농업 외 소득이 있으신가요? (월 단위)" value={outsideIncome} onChange={setOutsideIncome} type="number" placeholder="예: 1000000" min={0} suffix="원" />
          </div>
        )}

        {page === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: fieldGap }}>
            <SelectField label="어디 사세요?" required value={region} onChange={setRegion} options={[
              { value: '옥천군', label: '옥천군' },
              { value: '옥천 외', label: '옥천 외' },
            ]} />
            <TextField label="나이가 어떻게 되세요?" value={age} onChange={setAge} type="number" min={0} max={120} />
            <RadioGroup label="농사 지으세요?" value={farming} onChange={setFarming} />
          </div>
        )}
      </div>

      <div style={{ padding: '12px 18px 48px' }}>
        <Button onClick={goNext}>다음</Button>
      </div>
    </div>
  )
}
