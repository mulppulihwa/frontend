import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import StepIndicator from '../components/StepIndicator'
import SelectField from '../components/SelectField'
import Button from '../components/Button'
import SearchAnimation from '../components/SearchAnimation'
import { fetchRegions, updateProfile } from '../lib/api'

const fieldGap = 12

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 80 }, (_, i) => { const y = currentYear - i; return { value: String(y), label: `${y}년` } })
const months = Array.from({ length: 12 }, (_, i) => { const m = i + 1; return { value: String(m).padStart(2, '0'), label: `${m}월` } })
const days = Array.from({ length: 31 }, (_, i) => { const d = i + 1; return { value: String(d).padStart(2, '0'), label: `${d}일` } })

function DateSelectField({ label, value, onChange }) {
  const [y = '', m = '', d = ''] = (value || '').split('-')
  const update = (newY, newM, newD) => {
    if (!newY && !newM && !newD) {
      onChange('')
      return
    }
    onChange(`${newY || ''}-${newM || ''}-${newD || ''}`)
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


const textInputStyle = {
  width: '100%',
  padding: '9px 12px',
  boxSizing: 'border-box',
  border: '1.5px solid #e8e8e8',
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 400,
  color: '#1a1a1a',
  background: '#fff',
  fontFamily: 'inherit',
  outline: 'none',
  letterSpacing: '-0.2px',
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 400,
  color: '#1a1a1a',
  letterSpacing: '-0.1px',
}

const radioRows = [
  { label: '예, 귀농했어요', value: true },
  { label: '아니요', value: false },
]

function Header() {
  return (
    <div style={{ padding: '10px 18px 8px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', textAlign: 'center', marginBottom: 2, letterSpacing: '-0.3px', lineHeight: 1.5, animation: 'fadeUp 0.5s ease both' }}>
        귀농·귀향하셨나요?
      </h2>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', textAlign: 'center', marginBottom: 0, letterSpacing: '-0.3px', lineHeight: 1.5, animation: 'fadeUp 0.5s ease 0.15s both' }}>
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
            minHeight: 46,
            paddingRight: suffix ? 40 : 12,
            borderColor: focused ? '#076818' : '#e8e8e8',
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
            fontSize: 15,
            fontWeight: 400,
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
            border: '#076818',
            color: '#076818',
          } : {
            bg: '#fff4e5',
            border: '#FFA100',
            color: '#FFA100',
          }
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              style={{
                minHeight: 46,
                padding: '0 12px',
                border: `1.5px solid ${active ? tone.border : '#e8e8e8'}`,
                borderRadius: 12,
                background: active ? tone.bg : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 400,
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

const STORAGE_KEY = 'diagnosisProgress'
const REGION_LOADING_OPTIONS = [{ value: '__loading_regions', label: '지역을 불러오는 중...', disabled: true }]
const REGION_ERROR_OPTIONS = [{ value: '__region_error', label: '지역을 불러오지 못했어요', disabled: true }]
const GENDER_API_VALUES = {
  남자: '남',
  여자: '여',
}
const REGION_CODES = {
  옥천: '4329',
  옥천군: '4329',
  충청북도: '43',
  경기도: '41',
  충청남도: '44',
  전라북도: '45',
  전라남도: '46',
  경상북도: '47',
  경상남도: '48',
  서울특별시: '11',
  부산광역시: '26',
  대구광역시: '27',
  인천광역시: '28',
  광주광역시: '29',
  대전광역시: '30',
  울산광역시: '31',
  세종특별자치시: '36',
  강원도: '42',
  제주특별자치도: '50',
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function isCompleteDate(value) {
  const [y, m, d] = (value || '').split('-')
  return hasValue(y) && hasValue(m) && hasValue(d)
}

export default function Step1() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [birthDate, setBirthDate] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [nationality, setNationality] = useState('')
  const [farming, setFarming] = useState(null)
  const [farmingDate, setFarmingDate] = useState('')
  const [location, setLocation] = useState('')
  const [movedAt, setMovedAt] = useState('')
  const [previousResidence, setPreviousResidence] = useState('')
  const [previousSince, setPreviousSince] = useState('')
  const [job, setJob] = useState('')
  const [farmBusiness, setFarmBusiness] = useState(null)
  const [farmingEducation, setFarmingEducation] = useState(null)
  const [outsideIncome, setOutsideIncome] = useState('')
  const [region, setRegion] = useState('')
  const [showResumeModal, setShowResumeModal] = useState(() => !!localStorage.getItem(STORAGE_KEY))
  const [regionOptions, setRegionOptions] = useState(REGION_LOADING_OPTIONS)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let active = true
    fetchRegions()
      .then(regions => {
        if (!active) return
        setRegionOptions(
          regions.length
            ? regions.map(({ code, name }) => {
                REGION_CODES[name] = code
                return { value: name, label: name }
              })
            : REGION_ERROR_OPTIONS
        )
      })
      .catch(() => {
        if (active) setRegionOptions(REGION_ERROR_OPTIONS)
      })
    return () => {
      active = false
    }
  }, [])

  const saveProgress = (currentPage) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      page: currentPage, birthDate, age, gender, nationality, farming,
      farmingDate, location, movedAt, previousResidence, previousSince,
      job, farmBusiness, farmingEducation, outsideIncome, region,
    }))
  }

  const handleResume = () => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved) return
    setBirthDate(saved.birthDate ?? birthDate)
    setAge(saved.age ?? age)
    setGender(saved.gender ?? gender)
    setNationality(saved.nationality ?? nationality)
    setFarming(saved.farming ?? farming)
    setFarmingDate(saved.farmingDate ?? farmingDate)
    setLocation(saved.location ?? location)
    setMovedAt(saved.movedAt ?? movedAt)
    setPreviousResidence(saved.previousResidence ?? previousResidence)
    setPreviousSince(saved.previousSince ?? previousSince)
    setJob(saved.job ?? job)
    setFarmBusiness(saved.farmBusiness ?? farmBusiness)
    setFarmingEducation(saved.farmingEducation ?? farmingEducation)
    setOutsideIncome(saved.outsideIncome ?? outsideIncome)
    setRegion(saved.region ?? region)
    setPage(saved.page ?? 1)
    setShowResumeModal(false)
  }

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY)
    setShowResumeModal(false)
  }

  const goBack = () => {
    if (page === 1) {
      navigate('/')
      return
    }
    setPage(prev => prev - 1)
  }

  const buildProfilePayload = () => {
    const parsedIncome = outsideIncome === '' ? null : Number(outsideIncome)
    const incomeInManwon = Number.isFinite(parsedIncome) ? Math.round(parsedIncome / 10000) : null
    const regionName = location === '옥천' ? '옥천군' : region
    const occupationTags = [
      farming ? '귀농' : '귀촌',
      farmBusiness ? '농업인' : null,
      job && !['기타'].includes(job) ? job : null,
    ].filter(Boolean)
    return {
      birth_date: birthDate,
      gender: GENDER_API_VALUES[gender] || gender,
      region_code: REGION_CODES[regionName] || '',
      occupation_tags: occupationTags,
      move_in_date: movedAt,
      household_type: '독거',
      income_level: '일반',
      non_farm_income: incomeInManwon,
      marital_status: '미혼',
      is_farm_registered: farmBusiness,
      farm_registered_date: farmBusiness ? movedAt : null,
      education_hours: farmingEducation ? 100 : 0,
      is_disabled: false,
    }
  }

  const submitProfile = async () => {
    const payload = buildProfilePayload()
    const fallbackPayload = {
      birth_date: payload.birth_date,
      gender: payload.gender,
      region_code: payload.region_code,
      occupation_tags: payload.occupation_tags,
      income_level: payload.income_level,
      is_farm_registered: payload.is_farm_registered,
      education_hours: payload.education_hours,
      move_in_date: payload.move_in_date,
    }
    const minimalPayload = {
      birth_date: payload.birth_date,
      gender: payload.gender,
      region_code: payload.region_code,
      occupation_tags: payload.occupation_tags,
      income_level: payload.income_level,
    }
    const payloads = [payload, fallbackPayload, minimalPayload]
    let lastError = null

    for (const nextPayload of payloads) {
      try {
        await updateProfile(nextPayload)
        return
      } catch (err) {
        lastError = err
        if (err.status !== 400) throw err
      }
    }

    throw lastError
  }

  const isPageComplete = (pageNumber) => {
    switch (pageNumber) {
      case 1:
        return isCompleteDate(birthDate) && hasValue(gender) && hasValue(nationality)
      case 2:
        return hasValue(location)
          && isCompleteDate(movedAt)
          && hasValue(previousResidence)
          && isCompleteDate(previousSince)
      case 3:
        return hasValue(job)
          && farming !== null
          && farmBusiness !== null
          && hasValue(outsideIncome)
      case 4:
        return farmingEducation !== null
      default:
        return false
    }
  }

  const firstIncompletePage = [1, 2, 3, 4].find(pageNumber => !isPageComplete(pageNumber)) || null
  const isCurrentPageComplete = isPageComplete(page)
  const isFormComplete = firstIncompletePage === null

  const goNext = async () => {
    if (!isCurrentPageComplete) return

    if (page === 4) {
      if (!isFormComplete) {
        setPage(firstIncompletePage)
        setSubmitError('')
        return
      }

      setSubmitting(true)
      setSubmitError('')
      try {
        await submitProfile()
        localStorage.removeItem(STORAGE_KEY)
        navigate('/loading')
      } catch (err) {
        setSubmitError(err.message || '입력 정보를 저장하지 못했습니다.')
      } finally {
        setSubmitting(false)
      }
      return
    }
    saveProgress(page + 1)
    setPage(prev => prev + 1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#FDFCF8' }}>
      <div style={{ background: '#FDFCF8' }}>
        <TopBar title="정보 입력" onBack={goBack} />
        <div style={{ padding: '8px 18px 10px' }}>
          <StepIndicator current={page} total={4} />
        </div>
      </div>

      <Header />

      <div style={{ padding: '20px 18px 120px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        {page === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: fieldGap }}>
            <DateSelectField label="생년월일이 어떻게 되세요?" value={birthDate} onChange={setBirthDate} />
            <SelectField label="성별이 어떻게 되세요?" value={gender} onChange={setGender} options={[
              { value: '남자', label: '남자' },
              { value: '여자', label: '여자' },
            ]} placeholder="성별 선택" />
            <SelectField label="국적이 어떻게 되세요?" value={nationality} onChange={setNationality} options={[
              { value: '내국인', label: '내국인' },
              { value: '외국인', label: '외국인' },
            ]} placeholder="국적 선택" />
          </div>
        )}

        {page === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: fieldGap }}>
            <SelectField label="현재 어디 사세요?" value={location} onChange={setLocation} options={[
              { value: '옥천', label: '옥천' },
              { value: '옥천 외', label: '옥천 외' },
            ]} placeholder="지역 선택" />
            <DateSelectField label="옥천군으로 언제 이사 오셨나요?/오실 예정인가요?" value={movedAt} onChange={setMovedAt} />
            <SelectField
              label="이전 거주지는 어디인가요?"
              value={previousResidence}
              onChange={setPreviousResidence}
              options={regionOptions}
              placeholder={regionOptions[0]?.disabled ? regionOptions[0].label : '지역 선택'}
            />
            <DateSelectField label="이전 거주지에서 언제부터 거주하셨나요?" value={previousSince} onChange={setPreviousSince} />
          </div>
        )}

        {page === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: fieldGap }}>
            <SelectField label="현재 직업이 어떻게 되시나요?" value={job} onChange={setJob} options={[
              { value: '퇴직', label: '퇴직' },
              { value: '직장인', label: '직장인' },
              { value: '농업', label: '농업' },
              { value: '기타', label: '기타' },
            ]} placeholder="직업 선택" />
            <RadioGroup label="농사 지으세요?" value={farming} onChange={setFarming} />
            <RadioGroup label="농업경영체를 운영하시나요?" value={farmBusiness} onChange={setFarmBusiness} options={[
              { label: '예', value: true },
              { label: '아니요', value: false },
            ]} />
            <TextField label="농업 외 소득이 있으신가요? (월 단위)" value={outsideIncome} onChange={setOutsideIncome} type="number" placeholder="약 --- 원" min={0} suffix="원" />
          </div>
        )}

        {page === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: fieldGap }}>
            <RadioGroup label="귀농 교육 100시간을 이수하셨나요?" value={farmingEducation} onChange={setFarmingEducation} options={[
              { label: '예', value: true },
              { label: '아니요', value: false },
            ]} />
            {submitError && (
              <p style={{ fontSize: 13, fontWeight: 600, color: '#d93025', lineHeight: 1.45 }}>
                {submitError}
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, padding: '12px 28px 16px', background: 'linear-gradient(to top, #FDFCF8 80%, transparent)', zIndex: 50 }}>
        <Button onClick={goNext} disabled={submitting || !isCurrentPageComplete || (page === 4 && !isFormComplete)} variant="pill">
          {submitting ? '저장 중...' : page === 4 ? '내 지원금 찾기' : '다음'}
        </Button>
      </div>

      {showResumeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>
          <div style={{ width: '100%', maxWidth: 320, background: '#fff', borderRadius: 24, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'fadeInScale 0.2s ease' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', textAlign: 'center', lineHeight: 1.5 }}>이전에 작성 중이던<br />진단 내역이 있습니다</p>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 12, textAlign: 'center', letterSpacing: '-0.1px' }}>이어서 하시겠습니까?</p>
            <button
              onClick={handleResume}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: '#076818', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.2px' }}
            >
              이어서 하기
            </button>
            <button
              onClick={handleRestart}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: '1.5px solid #e8e8e8', background: '#fff', color: '#555', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.2px' }}
            >
              새로하기
            </button>
          </div>
          <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
      )}
    </div>
  )
}
