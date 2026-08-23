import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowDownUp, ArrowUp, BarChart3, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, FilePenLine, Home, ImagePlus, Loader2, MapPin, Pencil, Phone, RotateCcw, Search, SlidersHorizontal, Trash2, UserRound, UsersRound, X } from 'lucide-react'
import TopBar from '../components/TopBar'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import {
  applyToJobPost,
  createHousingPost,
  createJobPost,
  deleteHousingPost,
  deleteJobPost,
  fetchHousingPost,
  fetchHousingPosts,
  fetchJobApplications,
  fetchJobPost,
  fetchJobPosts,
  fetchProfile,
  updateHousingPost,
  updateJobPost,
} from '../lib/api'

const GREEN = '#076818'
const BG = '#FDFCF8'
const peopleFilters = ['전체', '농촌일손', '주택수리', '돌봄', '동아리', '기타']
const houseFilters = ['전체', '원룸', '투룸이상', '오피스텔', '주택', '기타']
const regionOptions = ['옥천읍', '동이면', '안남면', '청성면', '청산면', '이원면', '군서면', '군북면']
const APPLICANT_CACHE_KEY = 'okcheonNeedsApplicant'
const MAX_HOUSING_IMAGES = 10
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const POSTS_PER_PAGE = 10
const boardSortOptions = [
  { key: 'deadline', label: '마감 임박' },
  { key: 'recent', label: '최근 추가' },
  { key: 'name', label: '이름순' },
]
const initialPeopleFilters = {
  region: '전체',
  schedule: '전체',
  headcount: '전체',
}
const initialHousingFilters = {
  region: '전체',
  dealType: '전체',
  deposit: '전체',
  monthlyRent: '전체',
  size: '전체',
}

const depositFilterOptions = [
  { value: '전체', label: '전체' },
  { value: '500이하', label: '500만원 이하' },
  { value: '500-1000', label: '500~1,000만원' },
  { value: '1000이상', label: '1,000만원 이상' },
]
const monthlyRentFilterOptions = [
  { value: '전체', label: '전체' },
  { value: '30이하', label: '30만원 이하' },
  { value: '30-50', label: '30~50만원' },
  { value: '50이상', label: '50만원 이상' },
]
const sizeFilterOptions = [
  { value: '전체', label: '전체' },
  { value: '10이하', label: '10평 이하' },
  { value: '10-20', label: '10~20평' },
  { value: '20이상', label: '20평 이상' },
]
const scheduleFilterOptions = [
  { value: '전체', label: '전체' },
  { value: '모집중', label: '현재 모집 중' },
  { value: '예정', label: '모집 예정' },
  { value: '상시', label: '상시 모집' },
]
const headcountFilterOptions = [
  { value: '전체', label: '전체' },
  { value: '1-2', label: '1~2명' },
  { value: '3-5', label: '3~5명' },
  { value: '6이상', label: '6명 이상' },
]

function readApplicantCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(APPLICANT_CACHE_KEY) || 'null') || {}
    return { name: cached.name || '', phone: cached.phone || '', note: cached.note || '' }
  } catch {
    return { name: '', phone: '', note: '' }
  }
}

function formatDate(date) {
  if (!date) return '일정 협의'
  const [year, month, day] = String(date).split('-')
  return year && month && day ? `${year}.${month}.${day}` : String(date)
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return '상시 모집'
  if (!endDate || startDate === endDate) return formatDate(startDate || endDate)
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

function formatHousingPrice(post) {
  const parts = []
  if (post.deposit != null) parts.push(`보증금 ${Number(post.deposit).toLocaleString()}만원`)
  if (post.deal_type === '월세' && post.monthly_rent != null) parts.push(`월세 ${Number(post.monthly_rent).toLocaleString()}만원`)
  if (post.deal_type === '전세' && post.deposit != null) return `전세 ${Number(post.deposit).toLocaleString()}만원`
  return parts.join(' / ') || post.deal_type || '가격 문의'
}

function matchesNumberRange(value, range) {
  if (range === '전체') return true
  if (value == null || value === '') return false
  const number = Number(value)
  if (!Number.isFinite(number)) return false
  if (range === '500이하') return number <= 500
  if (range === '500-1000') return number > 500 && number < 1000
  if (range === '1000이상') return number >= 1000
  if (range === '30이하') return number <= 30
  if (range === '30-50') return number > 30 && number < 50
  if (range === '50이상') return number >= 50
  if (range === '10이하') return number <= 10
  if (range === '10-20') return number > 10 && number < 20
  if (range === '20이상') return number >= 20
  return true
}

function matchesJobSchedule(post, schedule) {
  if (schedule === '전체') return true
  if (!post.start_date && !post.end_date) return schedule === '상시'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = post.start_date ? new Date(`${post.start_date}T00:00:00`) : null
  const end = post.end_date ? new Date(`${post.end_date}T23:59:59`) : null

  if (schedule === '예정') return Boolean(start && start > today)
  if (schedule === '모집중') return (!start || start <= today) && (!end || end >= today)
  return false
}

function matchesHeadcount(value, range) {
  if (range === '전체') return true
  const count = Number(value)
  if (!Number.isFinite(count)) return false
  if (range === '1-2') return count >= 1 && count <= 2
  if (range === '3-5') return count >= 3 && count <= 5
  if (range === '6이상') return count >= 6
  return true
}

function formatCreatedAt(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 등록`
}

function getRecruitmentDday(endDate) {
  if (!endDate) return { label: '상시', color: '#596257', background: '#f1f3f0' }

  const deadline = new Date(`${endDate}T23:59:59`)
  if (Number.isNaN(deadline.getTime())) return null

  const days = Math.ceil((deadline.getTime() - Date.now()) / 86400000)
  if (days < 0) return { label: '마감', color: '#777', background: '#f1f1ef' }
  if (days === 0) return { label: 'D-DAY', color: '#d93025', background: '#fff0ef' }
  if (days <= 7) return { label: `D-${days}`, color: '#d93025', background: '#fff0ef' }
  return { label: `D-${days}`, color: GREEN, background: '#e8f3e8' }
}

function getApplicantCount(post) {
  const value = post?.application_count ?? post?.applications_count ?? post?.applicant_count
  const count = Number(value)
  return Number.isFinite(count) && count >= 0 ? count : null
}

function getOwnerPostStatus(post) {
  if (post.type === 'house' || !post.end_date) return 'active'
  const deadline = new Date(`${post.end_date}T23:59:59`)
  if (Number.isNaN(deadline.getTime())) return 'active'
  const days = Math.ceil((deadline.getTime() - Date.now()) / 86400000)
  if (days < 0) return 'closed'
  if (days <= 7) return 'urgent'
  return 'active'
}

function getBoardSortDirectionLabel(sort, reversed) {
  if (sort === 'deadline') return reversed ? '마감 여유순' : '마감 빠른순'
  if (sort === 'recent') return reversed ? '오래된순' : '최신순'
  return reversed ? '역순' : '가나다순'
}

function formatMoney(value) {
  if (value == null || value === '') return '미등록'
  const number = Number(value)
  return `${Number.isFinite(number) ? number.toLocaleString() : value}만원`
}

function displayValue(value, fallback = '미등록') {
  if (value == null || value === '') return fallback
  return value
}

function isPostOwner(post) {
  return post?.is_owner === true
}

function normalizeJobPost(post) {
  return {
    ...post,
    type: 'people',
    content: post.description || '',
    period: formatDateRange(post.start_date, post.end_date),
    headcount: post.recruit_count ? `${post.recruit_count}명` : '인원 협의',
    condition: post.conditions || '조건 없음',
    author: post.created_by_nickname || '작성자',
  }
}

function normalizeHousingPost(post) {
  return {
    ...post,
    type: 'house',
    category: post.room_type,
    content: post.description || '',
    price: formatHousingPrice(post),
    size: post.size_pyeong ? `${post.size_pyeong}평` : '면적 문의',
    rooms: post.room_layout || post.room_type,
    maintenance: post.maintenance_fee != null ? `관리비 ${Number(post.maintenance_fee).toLocaleString()}만원` : '관리비 문의',
    address: post.detail_address,
    author: post.contact_name,
    phone: post.contact_phone,
  }
}

function draftFromPost(post) {
  if (post.type === 'people') {
    return {
      type: 'people', category: post.category || '농촌일손', title: post.title || '', region: post.region || '',
      location: post.location || '', startDate: post.start_date || '', endDate: post.end_date || '',
      headcount: post.recruit_count ?? '', condition: post.conditions || '', dealType: '월세', deposit: '',
      monthlyRent: '', maintenanceFee: '', size: '', rooms: '', address: '', optionsText: '', author: '',
      phone: '', content: post.description || '',
    }
  }
  return {
    type: 'house', category: post.room_type || '원룸', title: post.title || '', region: post.region || '',
    location: '', startDate: '', endDate: '', headcount: '', condition: '', dealType: post.deal_type || '월세',
    deposit: post.deposit ?? '', monthlyRent: post.monthly_rent ?? '', maintenanceFee: post.maintenance_fee ?? '',
    size: post.size_pyeong ?? '', rooms: post.room_layout || '', address: post.detail_address || '',
    optionsText: (post.options || []).join(', '), author: post.contact_name || '', phone: post.contact_phone || '',
    content: post.description || '',
  }
}

function Pill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0,
        border: 'none',
        borderRadius: 999,
        padding: '9px 15px',
        background: active ? GREEN : '#f1f3ef',
        color: active ? '#fff' : '#555',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function InfoRow({ icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
      <Icon size={15} color="#6d766a" strokeWidth={2.2} />
      <span style={{ fontSize: 13, fontWeight: 550, color: '#4d554a', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </span>
    </div>
  )
}

function DetailRow({ label, children }) {
  const Icon = label.includes('지역') || label.includes('장소') || label.includes('주소') || label.includes('좌표')
    ? MapPin
    : label.includes('일') || label.includes('기간')
      ? CalendarDays
      : label.includes('인원')
        ? UsersRound
        : label.includes('작성자')
          ? UserRound
          : label.includes('연락처')
            ? Phone
            : label.includes('방') || label.includes('면적') || label.includes('거래') || label.includes('보증금') || label.includes('월세') || label.includes('관리비')
              ? Home
              : Check

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '20px 88px minmax(0, 1fr)', gap: 8, alignItems: 'start' }}>
      <Icon size={17} color="#6d766a" strokeWidth={2.1} style={{ marginTop: 2 }} />
      <span style={{ fontSize: 13, fontWeight: 650, color: '#747b72', lineHeight: 1.5 }}>{label}</span>
      <span style={{ minWidth: 0, fontSize: 14, fontWeight: 550, color: '#292e29', lineHeight: 1.5, overflowWrap: 'anywhere' }}>{children}</span>
    </div>
  )
}

function FilterChoiceGroup({ label, value, options, onChange }) {
  return (
    <fieldset style={{ margin: 0, padding: 0, border: 'none' }}>
      <legend style={{ marginBottom: 6, fontSize: 13.5, fontWeight: 700, color: '#252b25' }}>{label}</legend>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 8, rowGap: 1 }}>
        {options.map(option => {
          const optionValue = typeof option === 'string' ? option : option.value
          const optionLabel = typeof option === 'string' ? option : option.label
          const checked = value === optionValue
          return (
            <label
              key={optionValue}
              style={{
                minHeight: 34,
                padding: '2px 1px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: checked ? GREEN : '#454b45',
                fontSize: 13.5,
                fontWeight: checked ? 700 : 550,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(optionValue)}
                style={{ width: 17, height: 17, margin: 0, accentColor: GREEN, flexShrink: 0 }}
              />
              <span>{optionLabel}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function FilterModal({ title, onClose, onReset, hasFilters, children }) {
  return (
    <div
      role="presentation"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1200, padding: 24, background: 'rgba(20,24,20,0.38)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center' }}
    >
      <section role="dialog" aria-modal="true" aria-label={title} style={{ width: 'min(100%, 330px)', maxHeight: 'min(78dvh, 590px)', overflowY: 'auto', border: '1.5px solid #dbead5', borderRadius: 24, background: '#fff', boxShadow: '0 22px 60px rgba(0,0,0,0.2)', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 750, color: '#1f2433', letterSpacing: 0 }}>상세 필터</h2>
            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: '#727972' }}>{title}</p>
          </div>
          <button type="button" aria-label="상세 필터 닫기" onClick={onClose} style={{ width: 38, height: 38, border: 'none', borderRadius: '50%', background: '#f2f4f1', color: '#616861', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={19} strokeWidth={2.2} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onReset} disabled={!hasFilters} style={{ minHeight: 42, border: 'none', borderRadius: 999, background: '#f1f3f0', color: hasFilters ? '#596257' : '#b5bab4', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 650, cursor: hasFilters ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <RotateCcw size={15} strokeWidth={2.2} /> 초기화
          </button>
          <button type="button" onClick={onClose} style={{ minHeight: 42, border: 'none', borderRadius: 999, background: GREEN, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            필터 적용
          </button>
        </div>
      </section>
    </div>
  )
}

function PostCard({ post, onClick, applicantCount = null }) {
  const isPeople = post.type === 'people'
  const dday = isPeople ? getRecruitmentDday(post.end_date) : null
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        border: 'none',
        borderRadius: 22,
        background: '#fff',
        boxShadow: '0 4px 18px rgba(31,45,35,0.08)',
        padding: 18,
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            <span style={{ display: 'inline-flex', borderRadius: 999, background: '#e8f3e8', color: GREEN, padding: '5px 10px', fontSize: 12, fontWeight: 600 }}>
              {post.category}
            </span>
            {dday && (
              <span style={{ display: 'inline-flex', borderRadius: 999, background: dday.background, color: dday.color, padding: '5px 9px', fontSize: 11.5, fontWeight: 750 }}>
                {dday.label}
              </span>
            )}
            {isPeople && applicantCount != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999, background: '#fff5df', color: '#9a6500', padding: '5px 9px', fontSize: 11.5, fontWeight: 700 }}>
                <UsersRound size={13} strokeWidth={2.2} /> 지원자 {applicantCount}명
              </span>
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.32, color: '#1f2433', fontWeight: 700, letterSpacing: 0 }}>
            {post.title}
          </h3>
        </div>
        <ChevronRight size={22} color="#b8b8b4" style={{ flexShrink: 0, marginTop: 18 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px', marginTop: 14 }}>
        <InfoRow icon={MapPin}>{post.region}</InfoRow>
        {isPeople ? <InfoRow icon={UsersRound}>{post.headcount}</InfoRow> : <InfoRow icon={Home}>{post.size}</InfoRow>}
        <InfoRow icon={CalendarDays}>{isPeople ? post.period : post.price}</InfoRow>
        <InfoRow icon={UserRound}>{isPeople ? post.condition : post.rooms}</InfoRow>
      </div>
      {formatCreatedAt(post.created_at) && (
        <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid #edf0eb' }}>
          <InfoRow icon={Clock3}>{formatCreatedAt(post.created_at)}</InfoRow>
        </div>
      )}
    </button>
  )
}

function OwnerDashboard({ insights, loading, onOpenPost }) {
  return (
    <section aria-labelledby="owner-dashboard-title" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
        <BarChart3 size={19} color={GREEN} strokeWidth={2.2} />
        <h2 id="owner-dashboard-title" style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 700, color: '#1f2433', letterSpacing: 0 }}>
          대시보드
        </h2>
      </div>
      <div style={{ overflow: 'hidden', borderRadius: 18, background: '#fff', boxShadow: '0 4px 18px rgba(31,45,35,0.07)' }}>
        <div style={{ padding: 17, background: '#eef6ec' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <span style={{ display: 'block', color: '#557059', fontSize: 12.5, lineHeight: 1.3, fontWeight: 650 }}>작성한 글</span>
              <strong style={{ display: 'block', marginTop: 3, color: '#1f2433', fontSize: 30, lineHeight: 1.15, fontWeight: 750 }}>
                {loading ? '–' : insights?.total ?? 0}<small style={{ marginLeft: 2, fontSize: 15, fontWeight: 650 }}>건</small>
              </strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', color: '#7b6a43', fontSize: 12.5, lineHeight: 1.3, fontWeight: 650 }}>전체 지원자</span>
              <strong style={{ display: 'block', marginTop: 3, color: '#b27600', fontSize: 24, lineHeight: 1.15, fontWeight: 750 }}>
                {loading ? '–' : insights?.applicants ?? 0}<small style={{ marginLeft: 2, fontSize: 14, fontWeight: 650 }}>명</small>
              </strong>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 15 }}>
            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.75)' }}>
              <span style={{ color: '#687168', fontSize: 11.5, fontWeight: 600 }}>사람 구해요</span>
              <strong style={{ display: 'block', marginTop: 2, color: GREEN, fontSize: 18, fontWeight: 750 }}>{loading ? '–' : insights?.people ?? 0}건</strong>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.75)' }}>
              <span style={{ color: '#687168', fontSize: 11.5, fontWeight: 600 }}>집 구해요</span>
              <strong style={{ display: 'block', marginTop: 2, color: '#9a6500', fontSize: 18, fontWeight: 750 }}>{loading ? '–' : insights?.housing ?? 0}건</strong>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 17px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, paddingBottom: 14, borderBottom: '1px solid #edf0eb' }}>
            {[
              ['모집 중', insights?.recruiting ?? 0, GREEN],
              ['마감 임박', insights?.urgent ?? 0, '#d93025'],
              ['모집 종료', insights?.closed ?? 0, '#737873'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ minWidth: 0, textAlign: 'center' }}>
                <strong style={{ display: 'block', color, fontSize: 17, lineHeight: 1.25, fontWeight: 750 }}>{loading ? '–' : value}</strong>
                <span style={{ display: 'block', marginTop: 3, color: '#707770', fontSize: 11.5, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '14px 0 8px' }}>
            <strong style={{ color: '#292e29', fontSize: 13.5, fontWeight: 700 }}>바로 관리할 글</strong>
            <span style={{ color: '#818781', fontSize: 11.5, fontWeight: 550 }}>마감·지원자 기준</span>
          </div>
          {!loading && (insights?.managePosts?.length ?? 0) === 0 && (
            <p style={{ margin: '12px 0 2px', color: '#7b817a', fontSize: 13, lineHeight: 1.5, textAlign: 'center' }}>관리할 게시글이 없어요.</p>
          )}
          {!loading && insights?.managePosts?.map(post => {
            const dday = post.type === 'people' ? getRecruitmentDday(post.end_date) : null
            const statusLabel = post.type === 'house' ? '매물 게시 중' : post.ownerStatus === 'closed' ? '모집 종료' : dday?.label || '모집 중'
            const statusColor = post.ownerStatus === 'urgent' ? '#d93025' : post.ownerStatus === 'closed' ? '#777' : GREEN
            return (
              <button
                key={`${post.type}-${post.id}`}
                type="button"
                onClick={() => onOpenPost(post)}
                style={{ width: '100%', minHeight: 52, padding: '10px 0', border: 'none', borderTop: '1px solid #f0f2ee', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#252a25', fontSize: 13.5, lineHeight: 1.35, fontWeight: 700 }}>{post.title}</strong>
                  <span style={{ display: 'block', marginTop: 4, color: statusColor, fontSize: 11.5, fontWeight: 650 }}>
                    {statusLabel}{post.type === 'people' ? ` · 지원자 ${post.applicantCount}명` : ''}
                  </span>
                </span>
                <ChevronRight size={18} color="#a4aaa3" strokeWidth={2.2} style={{ flexShrink: 0 }} />
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', textarea = false, required = false, maxLength }) {
  const common = {
    value,
    onChange: event => onChange(event.target.value),
    placeholder,
    required,
    maxLength,
    style: {
      width: '100%',
      minHeight: textarea ? 92 : 48,
      border: '1.5px solid #e4e6e2',
      borderRadius: 14,
      padding: textarea ? '12px 14px' : '0 14px',
      fontFamily: 'inherit',
      fontSize: 14,
      lineHeight: 1.5,
      outline: 'none',
      resize: textarea ? 'vertical' : 'none',
      background: '#fff',
    },
  }
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
        {label}{required && <span aria-hidden="true" style={{ color: '#d93025', marginLeft: 3 }}>*</span>}
      </span>
      {textarea ? <textarea {...common} /> : <input {...common} type={type} />}
    </label>
  )
}

export default function NeedsBoard({ authoredOnly = false }) {
  const navigate = useNavigate()
  const listTopRef = useRef(null)
  const [mode, setMode] = useState('list')
  const [tab, setTab] = useState('people')
  const [filter, setFilter] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')
  const [peopleFilterOpen, setPeopleFilterOpen] = useState(false)
  const [peopleDetailFilters, setPeopleDetailFilters] = useState(initialPeopleFilters)
  const [housingFilterOpen, setHousingFilterOpen] = useState(false)
  const [housingFilters, setHousingFilters] = useState(initialHousingFilters)
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [applications, setApplications] = useState([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [housingImages, setHousingImages] = useState([])
  const [housingImagePreviews, setHousingImagePreviews] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [sort, setSort] = useState('recent')
  const [sortReversed, setSortReversed] = useState(false)
  const [ownerInsights, setOwnerInsights] = useState(null)
  const [ownerInsightsLoading, setOwnerInsightsLoading] = useState(authoredOnly)
  const [ownerInsightsVersion, setOwnerInsightsVersion] = useState(0)
  const [applicant, setApplicant] = useState(readApplicantCache)
  const [draft, setDraft] = useState({
    type: 'people',
    category: '농촌일손',
    title: '',
    region: '',
    location: '',
    startDate: '',
    endDate: '',
    headcount: '',
    condition: '',
    dealType: '월세',
    deposit: '',
    monthlyRent: '',
    maintenanceFee: '',
    size: '',
    rooms: '',
    address: '',
    optionsText: '',
    author: '',
    phone: '',
    content: '',
  })

  useEffect(() => {
    if (!peopleFilterOpen && !housingFilterOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [peopleFilterOpen, housingFilterOpen])

  const filters = tab === 'people' ? peopleFilters : houseFilters
  const visiblePosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR')
    const filteredPosts = posts.filter(post => {
      if (post.type !== tab) return false
      if (authoredOnly && !isPostOwner(post)) return false
      if (tab === 'people') {
        if (peopleDetailFilters.region !== '전체' && post.region !== peopleDetailFilters.region) return false
        if (!matchesJobSchedule(post, peopleDetailFilters.schedule)) return false
        if (!matchesHeadcount(post.recruit_count, peopleDetailFilters.headcount)) return false
      }
      if (tab === 'house') {
        if (housingFilters.region !== '전체' && post.region !== housingFilters.region) return false
        if (housingFilters.dealType !== '전체' && post.deal_type !== housingFilters.dealType) return false
        if (!matchesNumberRange(post.deposit, housingFilters.deposit)) return false
        if (!matchesNumberRange(post.monthly_rent, housingFilters.monthlyRent)) return false
        if (!matchesNumberRange(post.size_pyeong, housingFilters.size)) return false
      }
      if (!normalizedQuery) return true
      const searchableText = [
        post.title,
        post.category,
        post.region,
        post.content,
        post.location,
        post.address,
        post.condition,
        post.rooms,
        post.author,
      ].filter(Boolean).join(' ').toLocaleLowerCase('ko-KR')
      return searchableText.includes(normalizedQuery)
    })

    return [...filteredPosts].sort((a, b) => {
      if (sort === 'name') {
        const order = String(a.title || '').localeCompare(String(b.title || ''), 'ko')
        return sortReversed ? -order : order
      }

      const field = sort === 'deadline' ? 'end_date' : 'created_at'
      const aTime = a[field] ? Date.parse(a[field]) : Number.NaN
      const bTime = b[field] ? Date.parse(b[field]) : Number.NaN
      const aHasTime = Number.isFinite(aTime)
      const bHasTime = Number.isFinite(bTime)
      if (!aHasTime && !bHasTime) return String(a.title || '').localeCompare(String(b.title || ''), 'ko')
      if (!aHasTime) return 1
      if (!bHasTime) return -1
      const order = sort === 'deadline' ? aTime - bTime : bTime - aTime
      return sortReversed ? -order : order
    })
  }, [posts, searchQuery, tab, peopleDetailFilters, housingFilters, authoredOnly, sort, sortReversed])

  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / POSTS_PER_PAGE))
  const paginatedPosts = useMemo(
    () => visiblePosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE),
    [visiblePosts, currentPage],
  )

  const activePeopleFilterCount = useMemo(
    () => Object.values(peopleDetailFilters).filter(value => value !== '전체').length,
    [peopleDetailFilters],
  )

  const activeHousingFilterCount = useMemo(
    () => Object.values(housingFilters).filter(value => value !== '전체').length,
    [housingFilters],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [tab, filter, searchQuery, authoredOnly, peopleDetailFilters, housingFilters, sort, sortReversed])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    const updateScrollTopVisibility = () => setShowScrollTop(window.scrollY > 420)
    updateScrollTopVisibility()
    window.addEventListener('scroll', updateScrollTopVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollTopVisibility)
  }, [])

  const changePage = page => {
    setCurrentPage(page)
    requestAnimationFrame(() => listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  useEffect(() => {
    let cancelled = false
    const loadPosts = async () => {
      setLoading(true)
      setError('')
      try {
        const data = tab === 'people'
          ? await fetchJobPosts({ category: filter === '전체' ? '' : filter })
          : await fetchHousingPosts({
            roomType: filter === '전체' ? '' : filter,
            region: housingFilters.region === '전체' ? '' : housingFilters.region,
          })
        if (!cancelled) {
          setPosts(data.map(tab === 'people' ? normalizeJobPost : normalizeHousingPost))
        }
      } catch (loadError) {
        if (!cancelled) {
          setPosts([])
          setError(loadError.message || '게시글을 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPosts()
    return () => { cancelled = true }
  }, [tab, filter, housingFilters.region])

  useEffect(() => {
    if (!authoredOnly) return undefined
    let cancelled = false

    const loadOwnerInsights = async () => {
      setOwnerInsightsLoading(true)
      try {
        const [jobData, housingData] = await Promise.all([fetchJobPosts(), fetchHousingPosts()])
        const jobs = jobData.map(normalizeJobPost).filter(isPostOwner)
        const housing = housingData.map(normalizeHousingPost).filter(isPostOwner)
        const applicantCounts = await Promise.all(jobs.map(async post => {
          const directCount = getApplicantCount(post)
          if (directCount != null) return directCount
          try {
            return (await fetchJobApplications(post.id)).length
          } catch {
            return 0
          }
        }))
        const statuses = jobs.map(getOwnerPostStatus)
        const applicantByPost = Object.fromEntries(jobs.map((post, index) => [String(post.id), applicantCounts[index]]))
        const managedJobs = jobs.map((post, index) => ({
          ...post,
          ownerStatus: statuses[index],
          applicantCount: applicantCounts[index],
        }))
        const managedHousing = housing.map(post => ({ ...post, ownerStatus: 'active', applicantCount: 0 }))
        const managePosts = [...managedJobs, ...managedHousing]
          .sort((a, b) => {
            const priority = post => {
              if (post.ownerStatus === 'urgent') return 0
              if (post.type === 'people' && post.applicantCount > 0 && post.ownerStatus !== 'closed') return 1
              if (post.ownerStatus === 'active') return 2
              return 3
            }
            const priorityOrder = priority(a) - priority(b)
            if (priorityOrder !== 0) return priorityOrder
            return Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0)
          })
          .slice(0, 3)

        if (!cancelled) {
          setOwnerInsights({
            total: jobs.length + housing.length,
            people: jobs.length,
            housing: housing.length,
            recruiting: statuses.filter(status => status === 'active').length,
            urgent: statuses.filter(status => status === 'urgent').length,
            closed: statuses.filter(status => status === 'closed').length,
            applicants: applicantCounts.reduce((sum, count) => sum + count, 0),
            applicantByPost,
            managePosts,
          })
        }
      } catch {
        if (!cancelled) setOwnerInsights({ total: 0, people: 0, housing: 0, recruiting: 0, urgent: 0, closed: 0, applicants: 0, applicantByPost: {}, managePosts: [] })
      } finally {
        if (!cancelled) setOwnerInsightsLoading(false)
      }
    }

    loadOwnerInsights()
    return () => { cancelled = true }
  }, [authoredOnly, ownerInsightsVersion])

  useEffect(() => {
    let cancelled = false
    fetchProfile()
      .then(profile => {
        if (cancelled) return
        setApplicant(current => ({
          ...current,
          name: current.name || profile?.applicant_name || profile?.nickname || '',
        }))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const resetToList = () => {
    setMode('list')
    setSelectedPost(null)
    setApplications([])
    setDeleteConfirmOpen(false)
  }

  const openWrite = () => {
    housingImagePreviews.forEach(preview => URL.revokeObjectURL(preview.url))
    setHousingImages([])
    setHousingImagePreviews([])
    setDraft(current => ({
      ...current,
      type: tab,
      category: tab === 'people' ? '농촌일손' : '원룸',
    }))
    setMode('write')
  }

  const openEdit = () => {
    if (!isPostOwner(selectedPost)) return
    housingImagePreviews.forEach(preview => URL.revokeObjectURL(preview.url))
    setHousingImages([])
    setHousingImagePreviews([])
    setDraft(draftFromPost(selectedPost))
    setMode('edit')
  }

  const openApplications = async () => {
    if (!isPostOwner(selectedPost) || selectedPost.type !== 'people') return
    setMode('applications')
    setLoading(true)
    setError('')
    try {
      setApplications(await fetchJobApplications(selectedPost.id))
    } catch (applicationsError) {
      setApplications([])
      setError(applicationsError.message || '지원자 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async post => {
    setSelectedPost(post)
    setMode('detail')
    try {
      const detail = post.type === 'people' ? await fetchJobPost(post.id) : await fetchHousingPost(post.id)
      const normalizedDetail = post.type === 'people' ? normalizeJobPost(detail) : normalizeHousingPost(detail)
      setSelectedPost({
        ...normalizedDetail,
        is_owner: detail.is_owner === true || post.is_owner === true,
      })
    } catch (detailError) {
      setToast(detailError.message || '상세 정보를 불러오지 못했습니다.')
    }
  }

  const handleSubmitPost = async event => {
    event.preventDefault()
    setSubmitting(true)
    try {
      let post
      const isEditing = mode === 'edit' && selectedPost?.id
      if (draft.type === 'people') {
        const payload = {
          title: draft.title.trim(),
          category: draft.category,
          region: draft.region,
          description: draft.content.trim(),
          location: draft.location?.trim() || '',
          start_date: draft.startDate || null,
          end_date: draft.endDate || null,
          recruit_count: draft.headcount ? Number(draft.headcount) : null,
          conditions: draft.condition.trim(),
        }
        const result = isEditing
          ? await updateJobPost(selectedPost.id, payload)
          : await createJobPost(payload)
        post = normalizeJobPost(result)
      } else {
        const payload = {
          title: draft.title.trim(),
          region: draft.region,
          detail_address: draft.address.trim(),
          room_type: draft.category,
          room_layout: draft.rooms.trim(),
          size_pyeong: draft.size ? Number(draft.size) : null,
          deal_type: draft.dealType,
          deposit: draft.deposit ? Number(draft.deposit) : null,
          monthly_rent: draft.dealType === '월세' && draft.monthlyRent ? Number(draft.monthlyRent) : null,
          maintenance_fee: draft.maintenanceFee ? Number(draft.maintenanceFee) : null,
          options: draft.optionsText.split(',').map(item => item.trim()).filter(Boolean),
          description: draft.content.trim(),
          contact_name: draft.author.trim(),
          contact_phone: draft.phone.trim(),
        }
        const result = isEditing
          ? await updateHousingPost(selectedPost.id, payload)
          : await createHousingPost(payload, housingImages)
        post = normalizeHousingPost(result)
      }
      setPosts(current => isEditing
        ? current.map(item => item.id === post.id && item.type === post.type ? post : item)
        : [post, ...current])
      setSelectedPost(post)
      setToast(isEditing ? '게시글이 수정되었습니다.' : '게시글이 등록되었습니다.')
      setMode('detail')
      if (authoredOnly) setOwnerInsightsVersion(version => version + 1)
    } catch (submitError) {
      setToast(submitError.message || '게시글을 등록하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApply = async event => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await applyToJobPost(selectedPost.id, {
        name: applicant.name.trim(),
        phone: applicant.phone.trim(),
        message: applicant.note.trim(),
      })
      localStorage.setItem(APPLICANT_CACHE_KEY, JSON.stringify(applicant))
      setToast('지원 완료되었습니다.')
      setMode('detail')
    } catch (applyError) {
      setToast(applyError.message || '지원하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!isPostOwner(selectedPost)) return
    setSubmitting(true)
    try {
      if (selectedPost.type === 'people') {
        await deleteJobPost(selectedPost.id)
      } else {
        await deleteHousingPost(selectedPost.id)
      }
      setPosts(current => current.filter(item => !(item.id === selectedPost.id && item.type === selectedPost.type)))
      setDeleteConfirmOpen(false)
      setToast('게시글이 삭제되었습니다.')
      setMode('list')
      setSelectedPost(null)
      if (authoredOnly) setOwnerInsightsVersion(version => version + 1)
    } catch (deleteError) {
      setToast(deleteError.message || '게시글을 삭제하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateDraft = (key, value) => setDraft(current => ({ ...current, [key]: value }))
  const updateApplicant = (key, value) => setApplicant(current => ({ ...current, [key]: value }))
  const isPostDraftValid = draft.type === 'people'
    ? Boolean(draft.title.trim() && draft.category && draft.content.trim())
    : Boolean(
      draft.title.trim()
      && draft.category
      && draft.address.trim()
      && draft.dealType
      && draft.author.trim()
      && draft.phone.trim(),
    )
  const addHousingImages = event => {
    const incoming = Array.from(event.target.files || [])
    event.target.value = ''
    if (!incoming.length) return

    const invalidType = incoming.find(file => !file.type.startsWith('image/'))
    if (invalidType) {
      setToast('이미지 파일만 선택할 수 있어요.')
      return
    }
    const oversized = incoming.find(file => file.size > MAX_IMAGE_SIZE)
    if (oversized) {
      setToast('사진 한 장당 최대 용량은 10MB예요.')
      return
    }
    if (housingImages.length + incoming.length > MAX_HOUSING_IMAGES) {
      setToast(`사진은 최대 ${MAX_HOUSING_IMAGES}장까지 등록할 수 있어요.`)
      return
    }

    setHousingImages(current => [...current, ...incoming])
    setHousingImagePreviews(current => [
      ...current,
      ...incoming.map(file => ({ file, url: URL.createObjectURL(file) })),
    ])
  }
  const removeHousingImage = index => {
    setHousingImagePreviews(current => {
      URL.revokeObjectURL(current[index].url)
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
    setHousingImages(current => current.filter((_, itemIndex) => itemIndex !== index))
  }
  const handleBack = () => {
    if (['apply', 'edit', 'applications'].includes(mode) && selectedPost) {
      setMode('detail')
      setApplications([])
      setError('')
      return
    }
    resetToList()
  }

  return (
    <div className="detail-scroll-page" style={{ minHeight: '100dvh', background: BG, paddingBottom: 104, overflowY: 'auto' }}>
      <TopBar
        title={mode === 'write' ? '글쓰기' : mode === 'edit' ? '게시글 수정' : mode === 'apply' ? '지원하기' : mode === 'applications' ? '지원자 목록' : authoredOnly ? '내가 쓴 글' : '구해요'}
        onBack={mode === 'list' ? (authoredOnly ? () => navigate('/needs') : undefined) : handleBack}
        hideBack={mode === 'list' && !authoredOnly}
        rightAction={mode === 'list' ? { label: '글쓰기', icon: <FilePenLine size={19} />, onClick: openWrite } : null}
      />

      <main style={{ padding: '12px 20px 24px' }}>
        {mode === 'list' && (
          <>
            {authoredOnly && <OwnerDashboard insights={ownerInsights} loading={ownerInsightsLoading} onOpenPost={openDetail} />}
            <section ref={listTopRef} style={{ marginBottom: 18, scrollMarginTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 4, borderRadius: 999, background: '#f1f3ef' }}>
                {[
                  ['people', '사람 구해요'],
                  ['house', '집 구해요'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setTab(id); setFilter('전체') }}
                    style={{
                      minHeight: 42,
                      border: 'none',
                      borderRadius: 999,
                      background: tab === id ? '#fff' : 'transparent',
                      color: tab === id ? GREEN : '#777',
                      boxShadow: tab === id ? '0 3px 12px rgba(31,45,35,0.09)' : 'none',
                      fontFamily: 'inherit',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label style={{ position: 'relative', display: 'block', marginTop: 12 }}>
                <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                  구해요 게시글 검색
                </span>
                <Search size={19} color="#7a8177" strokeWidth={2.2} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  inputMode="search"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder={tab === 'people' ? '일자리, 지역, 모집 분야 검색' : '지역, 가격, 방 구성 검색'}
                  style={{ width: '100%', minHeight: 50, border: '1.5px solid #e1e5df', borderRadius: 16, background: '#fff', padding: `0 ${searchQuery ? 88 : 50}px 0 46px`, color: '#1f2433', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, outline: 'none', boxSizing: 'border-box' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="검색어 지우기"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 46, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, border: 'none', borderRadius: '50%', background: '#f1f3ef', color: '#667064', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                  >
                    <X size={16} strokeWidth={2.3} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="상세 필터"
                  aria-expanded={tab === 'people' ? peopleFilterOpen : housingFilterOpen}
                  onClick={() => tab === 'people' ? setPeopleFilterOpen(true) : setHousingFilterOpen(true)}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    width: 34, height: 34, padding: 0, border: 'none', borderRadius: 10,
                    background: (tab === 'people' ? activePeopleFilterCount : activeHousingFilterCount) > 0 ? '#e8f3e8' : 'transparent',
                    color: GREEN, display: 'grid', placeItems: 'center', cursor: 'pointer',
                  }}
                >
                  <SlidersHorizontal size={19} strokeWidth={2.3} />
                  {(tab === 'people' ? activePeopleFilterCount : activeHousingFilterCount) > 0 && (
                    <span style={{
                      position: 'absolute', top: 1, right: 1, minWidth: 15, height: 15,
                      padding: '0 3px', borderRadius: 999, background: GREEN, color: '#fff',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 800, lineHeight: 1,
                    }}>
                      {tab === 'people' ? activePeopleFilterCount : activeHousingFilterCount}
                    </span>
                  )}
                </button>
              </label>
              <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 12, paddingBottom: 2 }}>
                {filters.map(item => (
                  <Pill key={item} active={filter === item} onClick={() => setFilter(item)}>
                    {item}
                  </Pill>
                ))}
              </div>
              <div aria-label="정렬 방식" style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <span style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, color: '#626a61', fontSize: 12.5, fontWeight: 650 }}>
                  <ArrowDownUp size={15} strokeWidth={2.2} /> 정렬
                </span>
                <div style={{ width: 112 }}>
                  <SelectField
                  ariaLabel="정렬 기준"
                  value={sort}
                  onChange={value => {
                    setSort(value)
                    setSortReversed(false)
                    setCurrentPage(1)
                  }}
                  options={boardSortOptions.map(option => ({ value: option.key, label: option.label }))}
                  compact
                  />
                </div>
                <button
                  type="button"
                  aria-label={`정렬 방향 변경, 현재 ${getBoardSortDirectionLabel(sort, sortReversed)}`}
                  title={getBoardSortDirectionLabel(sort, sortReversed)}
                  onClick={() => {
                    setSortReversed(value => !value)
                    setCurrentPage(1)
                  }}
                  style={{ width: 36, height: 36, padding: 0, border: '1px solid #dfe4dc', borderRadius: 10, background: '#fff', color: GREEN, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {(sort === 'recent' ? sortReversed : !sortReversed)
                    ? <ArrowUp size={16} strokeWidth={2.4} />
                    : <ArrowDown size={16} strokeWidth={2.4} />}
                </button>
              </div>
              {!authoredOnly && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => navigate('/needs/mine')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '3px 0',
                      color: '#596257',
                      fontFamily: 'inherit',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'underline',
                      textUnderlineOffset: 4,
                      cursor: 'pointer',
                    }}
                  >
                    내가 쓴 글
                  </button>
                </div>
              )}
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading && (
                <div style={{ minHeight: 180, display: 'grid', placeItems: 'center', color: GREEN }}>
                  <Loader2 size={30} aria-label="게시글을 불러오는 중" style={{ animation: 'spin 0.9s linear infinite' }} />
                </div>
              )}
              {!loading && paginatedPosts.map(post => (
                <PostCard
                  key={`${post.type}-${post.id}`}
                  post={post}
                  onClick={() => openDetail(post)}
                  applicantCount={authoredOnly && post.type === 'people' ? ownerInsights?.applicantByPost?.[String(post.id)] : null}
                />
              ))}
              {!loading && error && (
                <div style={{ padding: '34px 18px', borderRadius: 18, background: '#fff', textAlign: 'center', color: '#d93025', fontSize: 14, fontWeight: 500 }}>
                  {error}
                </div>
              )}
              {!loading && !error && visiblePosts.length === 0 && (
                <div style={{ padding: '42px 0', textAlign: 'center', color: '#888', fontSize: 14, fontWeight: 500 }}>
                  {authoredOnly ? '작성한 글이 없어요.' : searchQuery.trim() ? '검색 결과가 없어요.' : '아직 등록된 게시글이 없어요.'}
                </div>
              )}
              {!loading && !error && visiblePosts.length > POSTS_PER_PAGE && (
                <nav aria-label="게시글 페이지" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px 0 2px' }}>
                  <button
                    type="button"
                    aria-label="이전 페이지"
                    disabled={currentPage === 1}
                    onClick={() => changePage(currentPage - 1)}
                    style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #dfe5dc', background: '#fff', color: currentPage === 1 ? '#c7cbc6' : GREEN, display: 'grid', placeItems: 'center', cursor: currentPage === 1 ? 'default' : 'pointer' }}
                  >
                    <ChevronLeft size={18} strokeWidth={2.3} />
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      aria-label={`${page}페이지`}
                      aria-current={page === currentPage ? 'page' : undefined}
                      onClick={() => changePage(page)}
                      style={{ width: 38, height: 38, borderRadius: '50%', border: page === currentPage ? 'none' : '1px solid #dfe5dc', background: page === currentPage ? GREEN : '#fff', color: page === currentPage ? '#fff' : '#4f584f', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="다음 페이지"
                    disabled={currentPage === totalPages}
                    onClick={() => changePage(currentPage + 1)}
                    style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #dfe5dc', background: '#fff', color: currentPage === totalPages ? '#c7cbc6' : GREEN, display: 'grid', placeItems: 'center', cursor: currentPage === totalPages ? 'default' : 'pointer' }}
                  >
                    <ChevronRight size={18} strokeWidth={2.3} />
                  </button>
                </nav>
              )}
            </section>
          </>
        )}

        {mode === 'detail' && selectedPost && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ borderRadius: 24, background: '#fff', boxShadow: '0 4px 20px rgba(31,45,35,0.08)', padding: 20 }}>
              <span style={{ display: 'inline-flex', borderRadius: 999, background: '#e8f3e8', color: GREEN, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                {selectedPost.category}
              </span>
              <h2 style={{ margin: '12px 0 8px', fontSize: 22, lineHeight: 1.3, color: '#1f2433', fontWeight: 700, letterSpacing: 0 }}>
                {selectedPost.title}
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: '#555', lineHeight: 1.6 }}>{selectedPost.content}</p>
            </div>

            {selectedPost.type === 'house' && selectedPost.photos?.length > 0 && (
              <div className="no-scrollbar" aria-label="매물 사진" style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '2px 1px 6px' }}>
                {selectedPost.photos.map((photo, index) => (
                  <img
                    key={photo.id || photo.image}
                    src={photo.image}
                    alt={`${selectedPost.title} 사진 ${index + 1}`}
                    style={{ flex: '0 0 88%', width: '88%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 20, background: '#eef1ec', scrollSnapAlign: 'center' }}
                  />
                ))}
              </div>
            )}

            <div style={{ borderRadius: 24, background: '#fff', boxShadow: '0 4px 20px rgba(31,45,35,0.08)', padding: 20, display: 'grid', gap: 13 }}>
              {selectedPost.type === 'people' ? (
                <>
                  <DetailRow label="모집 분야">{displayValue(selectedPost.category)}</DetailRow>
                  <DetailRow label="지역">{displayValue(selectedPost.region)}</DetailRow>
                  <DetailRow label="상세 장소">{displayValue(selectedPost.location)}</DetailRow>
                  <DetailRow label="모집 시작일">{selectedPost.start_date ? formatDate(selectedPost.start_date) : '상시 모집'}</DetailRow>
                  <DetailRow label="모집 종료일">{selectedPost.end_date ? formatDate(selectedPost.end_date) : '상시 모집'}</DetailRow>
                  <DetailRow label="모집 인원">{selectedPost.recruit_count ? `${selectedPost.recruit_count}명` : '인원 협의'}</DetailRow>
                  <DetailRow label="지원 조건">{displayValue(selectedPost.conditions, '조건 없음')}</DetailRow>
                  <DetailRow label="작성자">{displayValue(selectedPost.created_by_nickname, '작성자')}</DetailRow>
                </>
              ) : (
                <>
                  <DetailRow label="지역">{displayValue(selectedPost.region)}</DetailRow>
                  <DetailRow label="상세 주소">{displayValue(selectedPost.detail_address)}</DetailRow>
                  <DetailRow label="방 유형">{displayValue(selectedPost.room_type)}</DetailRow>
                  <DetailRow label="방 구성">{displayValue(selectedPost.room_layout)}</DetailRow>
                  <DetailRow label="면적">{selectedPost.size_pyeong ? `${selectedPost.size_pyeong}평` : '미등록'}</DetailRow>
                  <DetailRow label="거래 유형">{displayValue(selectedPost.deal_type)}</DetailRow>
                  <DetailRow label="보증금">{formatMoney(selectedPost.deposit)}</DetailRow>
                  <DetailRow label="월세">{selectedPost.deal_type === '전세' ? '해당 없음' : formatMoney(selectedPost.monthly_rent)}</DetailRow>
                  <DetailRow label="관리비">{formatMoney(selectedPost.maintenance_fee)}</DetailRow>
                  <DetailRow label="옵션">{(selectedPost.options || []).join(', ') || '미등록'}</DetailRow>
                  <DetailRow label="작성자">{displayValue(selectedPost.contact_name)}</DetailRow>
                  <DetailRow label="연락처">{displayValue(selectedPost.contact_phone)}</DetailRow>
                  {(selectedPost.lat != null || selectedPost.lng != null) && (
                    <DetailRow label="지도 좌표">{displayValue(selectedPost.lat)} / {displayValue(selectedPost.lng)}</DetailRow>
                  )}
                </>
              )}
              <DetailRow label="등록일">{formatCreatedAt(selectedPost.created_at).replace(' 등록', '') || '미등록'}</DetailRow>
            </div>

            {isPostOwner(selectedPost) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                {selectedPost.type === 'people' && (
                  <button type="button" onClick={openApplications} style={{ minHeight: 46, border: '1.5px solid #dfe4dc', borderRadius: 14, background: '#fff', color: '#333', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    지원자 보기
                  </button>
                )}
                <button type="button" onClick={openEdit} style={{ minHeight: 46, border: '1.5px solid #dfe4dc', borderRadius: 14, background: '#fff', color: GREEN, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Pencil size={15} /> 수정
                </button>
                <button type="button" onClick={() => setDeleteConfirmOpen(true)} style={{ minHeight: 46, border: '1.5px solid #f0d2cf', borderRadius: 14, background: '#fff', color: '#d93025', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Trash2 size={15} /> 삭제
                </button>
              </div>
            )}

            {selectedPost.type === 'people' ? (
              !isPostOwner(selectedPost) && (
                <Button onClick={() => setMode('apply')} style={{ marginTop: 8 }}>지원하기</Button>
              )
            ) : (
              <a href={`tel:${selectedPost.phone}`} style={{ textDecoration: 'none' }}>
                <Button style={{ marginTop: 8 }}>바로 전화걸기</Button>
              </a>
            )}
          </section>
        )}

        {mode === 'apply' && selectedPost && (
          <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ borderRadius: 24, background: '#fff', boxShadow: '0 4px 20px rgba(31,45,35,0.08)', padding: 20 }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 700, color: '#1f2433' }}>지원자 기본 정보</h2>
            </div>
            <Field label="이름" required maxLength={50} value={applicant.name} onChange={v => updateApplicant('name', v)} placeholder="이름을 입력해 주세요" />
            <Field label="전화번호" required maxLength={20} value={applicant.phone} onChange={v => updateApplicant('phone', v)} placeholder="010-0000-0000" type="tel" />
            <Field label="전달 메모" value={applicant.note} onChange={v => updateApplicant('note', v)} placeholder="가능한 시간이나 경험을 적어주세요" textarea />
            <Button disabled={!applicant.name || !applicant.phone || submitting}>{submitting ? '지원 중...' : '지원 완료'}</Button>
          </form>
        )}

        {mode === 'applications' && selectedPost && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '16px 18px', borderRadius: 18, background: '#eef6ec', color: GREEN, fontSize: 14, fontWeight: 600 }}>
              {selectedPost.title} · 지원자 {applications.length}명
            </div>
            {loading && (
              <div style={{ minHeight: 160, display: 'grid', placeItems: 'center', color: GREEN }}>
                <Loader2 size={30} aria-label="지원자를 불러오는 중" style={{ animation: 'spin 0.9s linear infinite' }} />
              </div>
            )}
            {!loading && error && <div style={{ padding: 24, textAlign: 'center', color: '#d93025' }}>{error}</div>}
            {!loading && !error && applications.map(application => (
              <article key={application.id} style={{ padding: 18, borderRadius: 20, background: '#fff', boxShadow: '0 4px 18px rgba(31,45,35,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2433' }}>{application.name}</h3>
                  <a href={`tel:${application.phone}`} style={{ color: GREEN, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>{application.phone}</a>
                </div>
                {application.message && <p style={{ margin: '10px 0 0', color: '#555', fontSize: 13, lineHeight: 1.55 }}>{application.message}</p>}
                <p style={{ margin: '10px 0 0', color: '#888', fontSize: 12 }}>{application.applied_at ? new Date(application.applied_at).toLocaleString('ko-KR') : ''}</p>
              </article>
            ))}
            {!loading && !error && applications.length === 0 && (
              <div style={{ padding: '42px 0', textAlign: 'center', color: '#888', fontSize: 14 }}>아직 지원자가 없어요.</div>
            )}
          </section>
        )}

        {(mode === 'write' || mode === 'edit') && (
          <form onSubmit={handleSubmitPost} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SelectField
              label="게시판"
              required
              value={draft.type}
              onChange={value => {
                updateDraft('type', value)
                updateDraft('category', value === 'people' ? '농촌일손' : '원룸')
              }}
              options={[{ value: 'people', label: '사람 구해요' }, { value: 'house', label: '집 구해요' }]}
            />
            <SelectField
              label="카테고리"
              required
              value={draft.category}
              onChange={value => updateDraft('category', value)}
              options={(draft.type === 'people' ? peopleFilters : houseFilters).filter(v => v !== '전체').map(value => ({ value, label: value }))}
            />
            <Field label="제목" required value={draft.title} onChange={v => updateDraft('title', v)} placeholder="게시글 제목" />
            <SelectField
              label="지역"
              value={draft.region}
              onChange={value => updateDraft('region', value)}
              placeholder="지역을 선택해 주세요"
              options={regionOptions.map(value => ({ value, label: value }))}
            />
            {draft.type === 'people' ? (
              <>
                <Field label="모집 시작일" value={draft.startDate} onChange={v => updateDraft('startDate', v)} type="date" />
                <Field label="모집 종료일" value={draft.endDate} onChange={v => updateDraft('endDate', v)} type="date" />
                <Field label="필요 인원" value={draft.headcount} onChange={v => updateDraft('headcount', v)} placeholder="예: 2" type="number" />
                <Field label="지원 조건" value={draft.condition} onChange={v => updateDraft('condition', v)} placeholder="예: 초보 가능" />
                <Field label="장소" value={draft.location} onChange={v => updateDraft('location', v)} placeholder="작업 또는 모임 장소" />
              </>
            ) : (
              <>
                {mode === 'write' ? (
                  <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>집 내부 사진 (선택)</span>
                      <span style={{ fontSize: 12, color: '#777' }}>{housingImages.length}/{MAX_HOUSING_IMAGES}</span>
                    </div>
                    {housingImagePreviews.length > 0 && (
                      <div className="no-scrollbar" style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 2 }}>
                        {housingImagePreviews.map((preview, index) => (
                          <div key={preview.url} style={{ position: 'relative', flex: '0 0 112px', width: 112, height: 84 }}>
                            <img src={preview.url} alt={`선택한 사진 ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, background: '#eef1ec' }} />
                            <button type="button" aria-label={`사진 ${index + 1} 삭제`} onClick={() => removeHousingImage(index)} style={{ position: 'absolute', top: 5, right: 5, width: 27, height: 27, padding: 0, border: 'none', borderRadius: '50%', background: 'rgba(20,24,20,0.72)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                              <X size={15} strokeWidth={2.4} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label style={{ minHeight: 48, border: '1.5px dashed #b9cdb7', borderRadius: 14, background: '#f7faf5', color: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>
                      <ImagePlus size={18} strokeWidth={2.2} /> 사진 선택
                      <input type="file" accept="image/*" multiple onChange={addHousingImages} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
                    </label>
                    <span style={{ fontSize: 12, color: '#777', lineHeight: 1.45 }}>최대 10장, 사진 한 장당 10MB까지 등록할 수 있어요.</span>
                  </section>
                ) : (
                  <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>집 내부 사진</span>
                    {selectedPost?.photos?.length > 0 ? (
                      <div className="no-scrollbar" style={{ display: 'flex', gap: 9, overflowX: 'auto' }}>
                        {selectedPost.photos.map((photo, index) => (
                          <img key={photo.id || photo.image} src={photo.image} alt={`등록된 사진 ${index + 1}`} style={{ flex: '0 0 112px', width: 112, height: 84, objectFit: 'cover', borderRadius: 12, background: '#eef1ec' }} />
                        ))}
                      </div>
                    ) : (
                      <div style={{ minHeight: 48, borderRadius: 14, background: '#f5f6f4', color: '#777', display: 'grid', placeItems: 'center', fontSize: 13 }}>
                        등록된 사진이 없어요.
                      </div>
                    )}
                    <span style={{ fontSize: 12, color: '#777', lineHeight: 1.45 }}>현재는 등록된 사진을 변경할 수 없어요.</span>
                  </section>
                )}
                <SelectField
                  label="거래 유형"
                  required
                  value={draft.dealType}
                  onChange={value => updateDraft('dealType', value)}
                  options={[{ value: '월세', label: '월세' }, { value: '전세', label: '전세' }]}
                />
                <Field label={draft.dealType === '전세' ? '전세금 (만원)' : '보증금 (만원)'} value={draft.deposit} onChange={v => updateDraft('deposit', v)} placeholder="예: 300" type="number" />
                {draft.dealType === '월세' && <Field label="월세 (만원)" value={draft.monthlyRent} onChange={v => updateDraft('monthlyRent', v)} placeholder="예: 35" type="number" />}
                <Field label="관리비 (만원)" value={draft.maintenanceFee} onChange={v => updateDraft('maintenanceFee', v)} placeholder="예: 5" type="number" />
                <Field label="집 평수" value={draft.size} onChange={v => updateDraft('size', v)} placeholder="예: 18" type="number" />
                <Field label="방 구성" value={draft.rooms} onChange={v => updateDraft('rooms', v)} placeholder="예: 분리형 원룸" />
                <Field label="자세한 주소" required value={draft.address} onChange={v => updateDraft('address', v)} placeholder="예: 옥천읍 금구리" />
                <Field label="옵션 정보" value={draft.optionsText} onChange={v => updateDraft('optionsText', v)} placeholder="쉼표로 구분해 주세요" />
                <Field label="작성자 이름" required value={draft.author} onChange={v => updateDraft('author', v)} placeholder="이름 또는 상호명" />
                <Field label="전화번호" required value={draft.phone} onChange={v => updateDraft('phone', v)} placeholder="010-0000-0000" type="tel" />
              </>
            )}
            <Field label="상세 설명" required={draft.type === 'people'} value={draft.content} onChange={v => updateDraft('content', v)} placeholder="자유롭게 적어주세요" textarea />
            <Button disabled={submitting || !isPostDraftValid}>
              {submitting ? (mode === 'edit' ? '수정 중...' : '등록 중...') : (mode === 'edit' ? '수정 완료' : '등록하기')}
            </Button>
          </form>
        )}
      </main>

      {peopleFilterOpen && (
        <FilterModal
          title="사람 구해요 조건을 선택해 주세요"
          onClose={() => setPeopleFilterOpen(false)}
          onReset={() => setPeopleDetailFilters(initialPeopleFilters)}
          hasFilters={activePeopleFilterCount > 0}
        >
          <FilterChoiceGroup
            label="지역"
            value={peopleDetailFilters.region}
            options={['전체', ...regionOptions]}
            onChange={value => setPeopleDetailFilters(current => ({ ...current, region: value }))}
          />
          <FilterChoiceGroup
            label="모집 일정"
            value={peopleDetailFilters.schedule}
            options={scheduleFilterOptions}
            onChange={value => setPeopleDetailFilters(current => ({ ...current, schedule: value }))}
          />
          <FilterChoiceGroup
            label="필요 인원"
            value={peopleDetailFilters.headcount}
            options={headcountFilterOptions}
            onChange={value => setPeopleDetailFilters(current => ({ ...current, headcount: value }))}
          />
        </FilterModal>
      )}

      {housingFilterOpen && (
        <FilterModal
          title="집 구해요 조건을 선택해 주세요"
          onClose={() => setHousingFilterOpen(false)}
          onReset={() => setHousingFilters(initialHousingFilters)}
          hasFilters={activeHousingFilterCount > 0}
        >
          <FilterChoiceGroup
            label="지역"
            value={housingFilters.region}
            options={['전체', ...regionOptions]}
            onChange={value => setHousingFilters(current => ({ ...current, region: value }))}
          />
          <FilterChoiceGroup
            label="거래 유형"
            value={housingFilters.dealType}
            options={['전체', '월세', '전세']}
            onChange={value => setHousingFilters(current => ({
              ...current,
              dealType: value,
              monthlyRent: value === '전세' ? '전체' : current.monthlyRent,
            }))}
          />
          <FilterChoiceGroup
            label="보증금"
            value={housingFilters.deposit}
            options={depositFilterOptions}
            onChange={value => setHousingFilters(current => ({ ...current, deposit: value }))}
          />
          {housingFilters.dealType !== '전세' && (
            <FilterChoiceGroup
              label="월세"
              value={housingFilters.monthlyRent}
              options={monthlyRentFilterOptions}
              onChange={value => setHousingFilters(current => ({ ...current, monthlyRent: value }))}
            />
          )}
          <FilterChoiceGroup
            label="면적"
            value={housingFilters.size}
            options={sizeFilterOptions}
            onChange={value => setHousingFilters(current => ({ ...current, size: value }))}
          />
        </FilterModal>
      )}

      {mode === 'list' && showScrollTop && (
        <button
          type="button"
          aria-label="맨 위로 이동"
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            right: 'max(18px, calc((100vw - 430px) / 2 + 18px))',
            bottom: 94,
            zIndex: 120,
            width: 48,
            height: 48,
            border: 'none',
            borderRadius: '50%',
            background: GREEN,
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 6px 18px rgba(7,104,24,0.24)',
            cursor: 'pointer',
          }}
        >
          <ArrowUp size={21} strokeWidth={2.5} />
        </button>
      )}

      {deleteConfirmOpen && selectedPost && (
        <div role="presentation" onClick={() => !submitting && setDeleteConfirmOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(20,24,20,0.42)', backdropFilter: 'blur(3px)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="delete-board-title" onClick={event => event.stopPropagation()} style={{ width: 'min(100%, 360px)', borderRadius: 24, background: '#fff', padding: 24, boxShadow: '0 22px 60px rgba(0,0,0,0.2)' }}>
            <h2 id="delete-board-title" style={{ margin: 0, color: '#1f2433', fontSize: 19, fontWeight: 700 }}>게시글을 삭제하시겠어요?</h2>
            <p style={{ margin: '10px 0 20px', color: '#666', fontSize: 14, lineHeight: 1.55 }}>삭제한 게시글은 목록에서 사라지며 되돌릴 수 없어요.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button type="button" disabled={submitting} onClick={() => setDeleteConfirmOpen(false)} style={{ minHeight: 46, border: '1.5px solid #dfe4dc', borderRadius: 14, background: '#fff', color: '#555', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button type="button" disabled={submitting} onClick={handleDelete} style={{ minHeight: 46, border: 'none', borderRadius: 14, background: '#d93025', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1 }}>{submitting ? '삭제 중...' : '삭제'}</button>
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 92, transform: 'translateX(-50%)', zIndex: 500, width: 'min(calc(100% - 40px), 320px)', borderRadius: 999, background: '#1f2433', color: '#fff', padding: '13px 18px', textAlign: 'center', fontSize: 14, fontWeight: 600, boxShadow: '0 10px 28px rgba(31,36,51,0.22)' }}>
          {toast}
          <button type="button" onClick={() => setToast('')} style={{ marginLeft: 12, border: 'none', background: 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>닫기</button>
        </div>
      )}
    </div>
  )
}
