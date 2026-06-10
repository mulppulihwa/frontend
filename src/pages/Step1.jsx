import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import TopBar from '../components/TopBar'
import StepIndicator from '../components/StepIndicator'
import SelectField from '../components/SelectField'
import Button from '../components/Button'
import SearchAnimation from '../components/SearchAnimation'
import { fetchProfile, fetchRegions, updateProfile } from '../lib/api'

const fieldGap = 'clamp(8px, 1.5dvh, 12px)'

const POSTCODE_SCRIPT_SRC = '//t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

// 법정읍면동명(bname1)이 "읍" 또는 "면"으로 끝나면 읍면 지역, 그 외(동/빈 문자열)는 동 지역으로 분류
function classifyResidenceType(bname1) {
  return /(읍|면)$/.test(bname1 || '') ? '읍면' : '동'
}

function loadPostcodeScript() {
  if (window.kakao?.Postcode) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = POSTCODE_SCRIPT_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('주소 검색 스크립트를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
}

function positionPostcodeLayer(layer) {
  const width = 300
  const height = 400
  const borderWidth = 5
  layer.style.width = `${width}px`
  layer.style.height = `${height}px`
  layer.style.border = `${borderWidth}px solid #076818`
  layer.style.left = `${((window.innerWidth || document.documentElement.clientWidth) - width) / 2 - borderWidth}px`
  layer.style.top = `${((window.innerHeight || document.documentElement.clientHeight) - height) / 2 - borderWidth}px`
}


function getDateDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function formatDateDigits(value, precision = 'day') {
  const limit = precision === 'month' ? 6 : 8
  const digits = getDateDigits(value).slice(0, limit)
  const groups = precision === 'month'
    ? [digits.slice(0, 4), digits.slice(4, 6)]
    : [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)]
  return groups.filter(Boolean).join('.')
}

function DateSelectField({ label, value, onChange, precision = 'day' }) {
  const [focused, setFocused] = useState(false)
  const limit = precision === 'month' ? 6 : 8
  const inputValue = formatDateDigits(value, precision)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.1px' }}>{label}</label>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={inputValue}
        onChange={e => onChange(getDateDigits(e.target.value).slice(0, limit))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={precision === 'month' ? '2001.01' : '2001.01.01'}
        aria-label={`${label} ${precision === 'month' ? '여섯 자리' : '여덟 자리'} 숫자 입력`}
        style={{
          width: '100%',
          minHeight: 46,
          padding: '13px 16px',
          boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#076818' : '#e8e8e8'}`,
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 400,
          color: inputValue ? '#1a1a1a' : '#aaa',
          background: '#fff',
          fontFamily: 'inherit',
          outline: 'none',
          letterSpacing: '0',
          textAlign: 'left',
          boxShadow: focused ? '0 0 0 4px rgba(45,106,45,0.08)' : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      />
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
  { label: '아니오', value: false },
]

const outsideIncomeOptions = [
  { value: '3700', label: '3700만원 이상' },
  { value: '3699', label: '3700만원 미만' },
]

const stepCopy = {
  1: {
    title: '기본정보를 알려주세요',
    description: '지원금을 받기 위해 필요한 가장 기초적인 정보예요!',
  },
  2: {
    title: '옥천군으로 언제 이사 오시나요?',
    description: '거주지와 전입일에 따른 주거·정착 지원금을 찾아드려요.',
  },
  3: {
    title: '현재 농업에 종사하고 계시나요?',
    description: '직업과 소득 수준에 맞는 지원금을 찾아드려요',
  },
}

function Header({ page }) {
  const copy = stepCopy[page] || stepCopy[1]
  return (
    <div className="diagnosis-header">
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', textAlign: 'center', marginBottom: 2, letterSpacing: '-0.3px', lineHeight: 1.5, animation: 'fadeUp 0.5s ease both' }}>
        {copy.title}
      </h2>
      <p style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', textAlign: 'center', marginBottom: 0, letterSpacing: '-0.2px', lineHeight: 1.5, wordBreak: 'keep-all', animation: 'fadeUp 0.5s ease 0.15s both' }}>
        {copy.description}
      </p>
      <SearchAnimation compact />
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

function AddressSearchField({ label, value, onSelect, placeholder = '주소 검색하기' }) {
  const layerRef = useRef(null)
  const [focused, setFocused] = useState(false)
  const [scriptError, setScriptError] = useState('')

  useEffect(() => {
    loadPostcodeScript().catch(err => setScriptError(err.message))
  }, [])

  const closeLayer = () => {
    if (layerRef.current) layerRef.current.style.display = 'none'
  }

  const openPostcode = () => {
    const layer = layerRef.current
    if (!layer || !window.kakao?.Postcode) return

    new window.kakao.Postcode({
      oncomplete(data) {
        const address = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress
        onSelect({ address, residenceType: classifyResidenceType(data.bname1) })
        closeLayer()
      },
      width: '100%',
      height: '100%',
      maxSuggestItems: 5,
    }).embed(layer)

    layer.style.display = 'block'
    positionPostcodeLayer(layer)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <button
        type="button"
        onClick={openPostcode}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          minHeight: 46,
          padding: '9px 12px',
          border: `1.5px solid ${focused ? '#076818' : '#e8e8e8'}`,
          borderRadius: 12,
          fontSize: 15,
          color: '#1a1a1a',
          background: '#fff',
          fontFamily: 'inherit',
          fontWeight: 400,
          outline: 'none',
          letterSpacing: '-0.2px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          textAlign: 'left',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxSizing: 'border-box',
          boxShadow: focused ? '0 0 0 4px rgba(45,106,45,0.08)' : 'none',
        }}
      >
        <span style={{ color: value ? '#1a1a1a' : '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <MapPin size={18} color="#076818" strokeWidth={2.5} style={{ flexShrink: 0 }} />
      </button>
      {scriptError && (
        <p style={{ fontSize: 12, fontWeight: 600, color: '#d93025', margin: 0 }}>{scriptError}</p>
      )}

      {/* iOS에서는 position:fixed 버그가 있음, 적용하는 사이트에 맞게 position:absolute 등을 이용하여 top,left값 조정 필요 */}
      <div
        ref={layerRef}
        style={{
          display: 'none',
          position: 'fixed',
          overflow: 'hidden',
          zIndex: 500,
          WebkitOverflowScrolling: 'touch',
          background: '#fff',
          borderRadius: 8,
        }}
      >
        <img
          src="//t1.kakaocdn.net/postcode/resource/images/close.png"
          onClick={closeLayer}
          alt="닫기 버튼"
          style={{ cursor: 'pointer', position: 'absolute', right: -3, top: -3, zIndex: 1 }}
        />
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
const SUBMITTED_PROFILE_KEY = 'submittedDiagnosisProfile'
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

function isCompleteDate(value, precision = 'day') {
  const digits = getDateDigits(value)
  const expectedLength = precision === 'month' ? 6 : 8
  if (digits.length !== expectedLength) return false
  const year = Number(digits.slice(0, 4))
  const month = Number(digits.slice(4, 6))
  if (year < 1900 || month < 1 || month > 12) return false
  if (precision === 'month') return true
  const day = Number(digits.slice(6, 8))
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function parseDateStr(str) {
  const digits = getDateDigits(str)
  if (digits.length < 6) return null
  const year = digits.slice(0, 4)
  const month = digits.slice(4, 6)
  const day = digits.length >= 8 ? digits.slice(6, 8) : '01'
  return new Date(`${year}-${month}-${day}`)
}

function toApiDate(value, precision = 'day') {
  const digits = getDateDigits(value)
  if (!isCompleteDate(digits, precision)) return ''
  const year = digits.slice(0, 4)
  const month = digits.slice(4, 6)
  const day = precision === 'month' ? '01' : digits.slice(6, 8)
  return `${year}-${month}-${day}`
}

function firstValue(source, keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

function normalizeApiGender(value) {
  if (value === '남') return '남자'
  if (value === '여') return '여자'
  return value || ''
}

function normalizeOutsideIncome(value) {
  if (value === '' || value === null || value === undefined) return ''
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return ''
  if (numeric > 10000) return numeric >= 37000000 ? '3700' : '3699'
  return numeric >= 3700 ? '3700' : '3699'
}

function normalizeProfileResponse(profile) {
  const profileData = profile?.profile || profile?.user_profile || profile?.userProfile || profile || {}
  return {
    birthDate: firstValue(profileData, ['birth_date', 'birthDate']),
    gender: normalizeApiGender(firstValue(profileData, ['gender'])),
    farming: (profileData.occupation_tags || []).includes('귀농')
      ? true
      : (profileData.occupation_tags || []).includes('귀촌')
        ? false
        : null,
    movedAt: firstValue(profileData, ['move_in_date', 'moved_at', 'movedAt']),
    farmBusiness: firstValue(profileData, ['is_farm_registered', 'farmBusiness']),
    outsideIncome: firstValue(profileData, ['non_farm_income', 'outsideIncome']),
    regionCode: firstValue(profileData, ['region_code', 'regionCode']),
    previousResidenceType: firstValue(profileData, ['prev_residence_type', 'previousResidenceType']),
  }
}

export default function Step1() {
  const navigate = useNavigate()
  const locationState = useLocation().state
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
  const [previousResidenceType, setPreviousResidenceType] = useState('')
  const [previousSince, setPreviousSince] = useState('')
  const [job, setJob] = useState('')
  const [farmBusiness, setFarmBusiness] = useState(null)
  const [outsideIncome, setOutsideIncome] = useState('')
  const [region, setRegion] = useState('')
  const [showResumeModal, setShowResumeModal] = useState(() => !!localStorage.getItem(STORAGE_KEY))
  const [regionOptions, setRegionOptions] = useState(REGION_LOADING_OPTIONS)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [profileNotice, setProfileNotice] = useState(
    locationState?.profileIncompleteReason === 'match-profile-incomplete'
      ? locationState?.profileIncompleteMessage || ''
      : ''
  )

  useEffect(() => {
    const root = document.getElementById('root')
    const previous = {
      htmlOverflow: document.documentElement.style.overflow,
      htmlHeight: document.documentElement.style.height,
      bodyOverflow: document.body.style.overflow,
      bodyHeight: document.body.style.height,
      rootMinHeight: root?.style.minHeight || '',
      rootHeight: root?.style.height || '',
    }

    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.height = '100dvh'
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100dvh'
    if (root) {
      root.style.minHeight = '0'
      root.style.height = '100dvh'
    }

    return () => {
      document.documentElement.style.overflow = previous.htmlOverflow
      document.documentElement.style.height = previous.htmlHeight
      document.body.style.overflow = previous.bodyOverflow
      document.body.style.height = previous.bodyHeight
      if (root) {
        root.style.minHeight = previous.rootMinHeight
        root.style.height = previous.rootHeight
      }
    }
  }, [])

  const applySavedForm = (saved) => {
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
    setPreviousResidenceType(saved.previousResidenceType ?? previousResidenceType)
    setPreviousSince(saved.previousSince ?? previousSince)
    setJob(saved.job ?? job)
    setFarmBusiness(saved.farmBusiness ?? farmBusiness)
    setOutsideIncome(saved.outsideIncome !== undefined ? normalizeOutsideIncome(saved.outsideIncome) : outsideIncome)
    setRegion(saved.region ?? region)
  }

  const applyProfile = (profile, regions = []) => {
    const normalized = normalizeProfileResponse(profile)
    if (normalized.birthDate) setBirthDate(normalized.birthDate)
    if (normalized.gender) setGender(normalized.gender)
    if (normalized.farming !== null) setFarming(normalized.farming)
    if (normalized.movedAt) setMovedAt(normalized.movedAt)
    if (normalized.farmBusiness !== '') setFarmBusiness(Boolean(normalized.farmBusiness))
    if (normalized.outsideIncome !== '') setOutsideIncome(normalizeOutsideIncome(normalized.outsideIncome))
    if (normalized.previousResidenceType) setPreviousResidenceType(normalized.previousResidenceType)

    const regionName = regions.find(({ code }) => String(code) === String(normalized.regionCode))?.name
    if (regionName) {
      setLocation(regionName === '옥천군' ? '옥천' : '옥천 외')
      setRegion(regionName)
    }
  }

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

  useEffect(() => {
    let active = true
    const draft = localStorage.getItem(STORAGE_KEY)
    const submitted = localStorage.getItem(SUBMITTED_PROFILE_KEY)

    if (draft) return () => { active = false }

    if (submitted) {
      try {
        applySavedForm(JSON.parse(submitted))
      } catch {
        localStorage.removeItem(SUBMITTED_PROFILE_KEY)
      }
    }

    fetchProfile()
      .then(profile => {
        if (!active) return
        const usableRegions = regionOptions.filter(option => !option.disabled)
        applyProfile(profile, usableRegions)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [regionOptions])

  const saveProgress = (currentPage) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      page: currentPage, birthDate, age, gender, nationality, farming,
      farmingDate, location, movedAt, previousResidence, previousResidenceType, previousSince,
      job, farmBusiness, outsideIncome, region,
    }))
  }

  const handleResume = () => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved) return
    applySavedForm(saved)
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
    const incomeInManwon = Number.isFinite(parsedIncome) ? parsedIncome : null
    const regionName = location === '옥천' ? '옥천군' : ''
    const occupationTags = [
      farming ? '귀농' : '귀촌',
      farmBusiness ? '농업인' : null,
      job && !['기타'].includes(job) ? job : null,
    ].filter(Boolean)
    return {
      birth_date: toApiDate(birthDate),
      gender: GENDER_API_VALUES[gender] || gender,
      region_code: REGION_CODES[regionName] || '',
      occupation_tags: occupationTags,
      move_in_date: toApiDate(movedAt, 'month'),
      household_type: '독거',
      income_level: '일반',
      non_farm_income: incomeInManwon,
      marital_status: '미혼',
      is_farm_registered: farmBusiness,
      farm_registered_date: farmBusiness ? toApiDate(movedAt, 'month') : null,
      is_disabled: false,
      prev_residence_type: previousResidenceType || '',
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
      move_in_date: payload.move_in_date,
      prev_residence_type: payload.prev_residence_type,
    }
    const minimalPayload = {
      birth_date: payload.birth_date,
      gender: payload.gender,
      region_code: payload.region_code,
      occupation_tags: payload.occupation_tags,
      income_level: payload.income_level,
      prev_residence_type: payload.prev_residence_type,
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
        return isCompleteDate(birthDate)
          && hasValue(gender)
          && hasValue(nationality)
      case 2: {
        const movedAtDate = parseDateStr(movedAt)
        const prevSinceDate = parseDateStr(previousSince)
        const dateOrderOk = !(movedAtDate && prevSinceDate && movedAtDate < prevSinceDate)
        return hasValue(location)
          && isCompleteDate(movedAt, 'month')
          && hasValue(previousResidence)
          && hasValue(previousResidenceType)
          && isCompleteDate(previousSince, 'month')
          && dateOrderOk
      }
      case 3:
        return hasValue(job)
          && farming !== null
          && farmBusiness !== null
          && hasValue(outsideIncome)
      default:
        return false
    }
  }

  const firstIncompletePage = [1, 2, 3].find(pageNumber => !isPageComplete(pageNumber)) || null
  const isCurrentPageComplete = isPageComplete(page)
  const isFormComplete = firstIncompletePage === null

  const goNext = async () => {
    if (!isCurrentPageComplete) return

    if (page === 3) {
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
        localStorage.setItem(SUBMITTED_PROFILE_KEY, JSON.stringify({
          birthDate, age, gender, nationality, farming,
          farmingDate, location, movedAt, previousResidence, previousResidenceType, previousSince,
          job, farmBusiness, outsideIncome, region,
        }))
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
    <div className="diagnosis-page">
      <div style={{ background: '#FDFCF8' }}>
        <TopBar title="정보 입력" onBack={goBack} onClose={page === 3 ? () => navigate('/home') : undefined} />
        <div className="diagnosis-progress">
          <StepIndicator current={page} total={3} />
        </div>
      </div>

      <div className={`diagnosis-content diagnosis-content--step-${page}`}>
        <Header page={page} />

        <div className="diagnosis-fields">
          {profileNotice && (
            <div style={{ marginBottom: 14, background: '#fff8ee', border: '1.5px solid #ffe0a0', borderRadius: 14, padding: '11px 13px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#b86b00', lineHeight: 1.45, letterSpacing: '-0.1px' }}>
                {profileNotice}
              </p>
              <button type="button" onClick={() => setProfileNotice('')} style={{ border: 'none', background: 'transparent', color: '#b86b00', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>
                닫기
              </button>
            </div>
          )}

          {page === 1 && (() => {
            return (
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
            )
          })()}

          {page === 2 && (() => {
            const movedAtDate = parseDateStr(movedAt)
            const prevSinceDate = parseDateStr(previousSince)
            const dateOrderError = movedAtDate && prevSinceDate && movedAtDate < prevSinceDate
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: fieldGap }}>
                <SelectField label="현재 어디 사세요?" value={location} onChange={setLocation} options={[
                  { value: '옥천', label: '옥천' },
                  { value: '옥천 외', label: '옥천 외' },
                ]} placeholder="지역 선택" />
                <DateSelectField label="옥천군으로 언제 이사 오셨나요?/오실 예정인가요?" value={movedAt} onChange={setMovedAt} precision="month" />
                <AddressSearchField
                  label="이전 거주지는 어디인가요?"
                  value={previousResidence}
                  onSelect={({ address, residenceType }) => {
                    setPreviousResidence(address)
                    setPreviousResidenceType(residenceType)
                  }}
                />
                <DateSelectField label="이전 거주지에서 언제부터 거주하셨나요?" value={previousSince} onChange={setPreviousSince} precision="month" />
                {dateOrderError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    background: '#fff5f5',
                    border: '1.5px solid #f5c6c6',
                    borderRadius: 12,
                    padding: '10px 14px',
                  }}>
                    <span style={{ fontSize: 15, lineHeight: 1, marginTop: 1 }}>⚠️</span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#d93025', lineHeight: 1.5, letterSpacing: '-0.1px' }}>
                      옥천군 이사 날짜가 이전 거주지 거주 시작일보다 빠를 수 없어요. 날짜를 다시 확인해 주세요.
                    </p>
                  </div>
                )}
              </div>
            )
          })()}

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
              <SelectField
                label="농업 외 소득이 있으신가요? (연 단위)"
                value={outsideIncome}
                onChange={setOutsideIncome}
                options={outsideIncomeOptions}
                placeholder="농업 외 소득 선택"
              />
              {submitError && (
                <p style={{ fontSize: 13, fontWeight: 600, color: '#d93025', lineHeight: 1.45 }}>
                  {submitError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="diagnosis-footer">
        <Button onClick={goNext} disabled={submitting || !isCurrentPageComplete || (page === 3 && !isFormComplete)} variant="pill">
          {submitting ? '저장 중...' : page === 3 ? '내 지원금 찾기' : '다음'}
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
