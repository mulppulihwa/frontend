import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronRight, FilePenLine, Home, ImagePlus, Loader2, MapPin, Pencil, Phone, RotateCcw, Search, SlidersHorizontal, Trash2, UserRound, UsersRound, X } from 'lucide-react'
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

const MOCK_JOB_POSTS = [
  {
    id: 'mock-job-apply',
    title: '주말 복숭아밭 일손을 구해요',
    category: '농촌일손',
    region: '옥천읍',
    location: '옥천읍 삼청리 복숭아밭',
    start_date: '2026-09-05',
    end_date: '2026-09-06',
    recruit_count: 3,
    conditions: '초보 가능 · 편한 작업복 준비',
    description: '복숭아 수확과 선별을 함께 도와주실 분을 찾습니다. 점심 식사를 제공해요.',
    created_by_nickname: '김옥천',
    is_owner: false,
    isMock: true,
  },
  {
    id: 'mock-job-owner',
    title: '귀농인 주택 도배를 도와주실 분',
    category: '주택수리',
    region: '군북면',
    location: '군북면 이백리 마을회관 앞',
    start_date: '2026-09-12',
    end_date: '2026-09-12',
    recruit_count: 2,
    conditions: '도배 경험자 우대 · 작업 도구 제공',
    description: '빈집 한 곳의 벽지 제거와 도배를 함께 진행합니다. 오전 9시에 시작해요.',
    created_by_nickname: '나린',
    is_owner: true,
    isMock: true,
    mockApplications: [
      {
        id: 'mock-application-1',
        name: '박하늘',
        phone: '010-2451-7832',
        message: '도배 경험이 있고 토요일 오전부터 참여할 수 있어요.',
        applied_at: '2026-08-21T10:30:00+09:00',
      },
      {
        id: 'mock-application-2',
        name: '이보람',
        phone: '010-7310-4428',
        message: '초보지만 끝까지 함께하겠습니다.',
        applied_at: '2026-08-22T14:10:00+09:00',
      },
    ],
  },
]

const MOCK_HOUSING_POSTS = [
  {
    id: 'mock-house-owner',
    title: '옥천읍 조용한 투룸 월세',
    region: '옥천읍',
    detail_address: '옥천읍 금구리 123-4',
    room_type: '투룸이상',
    room_layout: '방 2 · 욕실 1',
    size_pyeong: 18,
    deal_type: '월세',
    deposit: 500,
    monthly_rent: 40,
    maintenance_fee: 5,
    options: ['에어컨', '세탁기', '냉장고'],
    description: '시장과 버스정류장이 가까운 조용한 투룸입니다. 즉시 입주할 수 있어요.',
    contact_name: '나린',
    contact_phone: '010-7300-1234',
    photos: [],
    is_owner: true,
    isMock: true,
  },
]

function readApplicantCache() {
  try {
    return JSON.parse(localStorage.getItem(APPLICANT_CACHE_KEY) || 'null') || { name: '', phone: '', region: '', note: '' }
  } catch {
    return { name: '', phone: '', region: '', note: '' }
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

function getMockPosts(tab, filter, hiddenIds) {
  const source = tab === 'people' ? MOCK_JOB_POSTS : MOCK_HOUSING_POSTS
  return source
    .filter(post => !hiddenIds.has(post.id))
    .filter(post => filter === '전체' || (tab === 'people' ? post.category : post.room_type) === filter)
    .map(tab === 'people' ? normalizeJobPost : normalizeHousingPost)
}

function getVisibleDemoPosts(tab, filter, hiddenIds) {
  if (tab === 'people') return getMockPosts(tab, filter, hiddenIds)
  return import.meta.env.DEV ? getMockPosts(tab, filter, hiddenIds) : []
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

function PostCard({ post, onClick }) {
  const isPeople = post.type === 'people'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ display: 'inline-flex', borderRadius: 999, background: '#e8f3e8', color: GREEN, padding: '5px 10px', fontSize: 12, fontWeight: 600 }}>
              {post.category}
            </span>
            {post.isMock && (
              <span style={{ display: 'inline-flex', borderRadius: 999, background: '#fff3d9', color: '#a76500', padding: '5px 9px', fontSize: 11, fontWeight: 650 }}>
                예시
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
    </button>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', textarea = false, required = false }) {
  const common = {
    value,
    onChange: event => onChange(event.target.value),
    placeholder,
    required,
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

export default function NeedsBoard() {
  const [mode, setMode] = useState('list')
  const [tab, setTab] = useState('people')
  const [filter, setFilter] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')
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
  const [hiddenMockIds, setHiddenMockIds] = useState(() => new Set())
  const [housingImages, setHousingImages] = useState([])
  const [housingImagePreviews, setHousingImagePreviews] = useState([])
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

  const filters = tab === 'people' ? peopleFilters : houseFilters
  const visiblePosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR')
    return posts.filter(post => {
      if (post.type !== tab) return false
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
  }, [posts, searchQuery, tab, housingFilters])

  const activeHousingFilterCount = useMemo(
    () => Object.values(housingFilters).filter(value => value !== '전체').length,
    [housingFilters],
  )

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
          const apiPosts = data.map(tab === 'people' ? normalizeJobPost : normalizeHousingPost)
          const mockPosts = getVisibleDemoPosts(tab, filter, hiddenMockIds)
          setPosts([...mockPosts, ...apiPosts])
        }
      } catch (loadError) {
        if (!cancelled) {
          const mockPosts = getVisibleDemoPosts(tab, filter, hiddenMockIds)
          setPosts(mockPosts)
          if (mockPosts.length === 0) setError(loadError.message || '게시글을 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPosts()
    return () => { cancelled = true }
  }, [tab, filter, hiddenMockIds, housingFilters.region])

  useEffect(() => {
    let cancelled = false
    fetchProfile()
      .then(profile => {
        if (cancelled) return
        setApplicant(current => ({
          ...current,
          name: current.name || profile?.applicant_name || profile?.nickname || '',
          region: current.region || profile?.current_residence || '',
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
    if (!selectedPost?.is_owner) return
    housingImagePreviews.forEach(preview => URL.revokeObjectURL(preview.url))
    setHousingImages([])
    setHousingImagePreviews([])
    setDraft(draftFromPost(selectedPost))
    setMode('edit')
  }

  const openApplications = async () => {
    if (!selectedPost?.is_owner || selectedPost.type !== 'people') return
    setMode('applications')
    setLoading(true)
    setError('')
    if (selectedPost.isMock) {
      setApplications(selectedPost.mockApplications || [])
      setLoading(false)
      return
    }
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
    if (post.isMock) return
    try {
      const detail = post.type === 'people' ? await fetchJobPost(post.id) : await fetchHousingPost(post.id)
      setSelectedPost(post.type === 'people' ? normalizeJobPost(detail) : normalizeHousingPost(detail))
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
      if (!selectedPost.isMock) {
        await applyToJobPost(selectedPost.id, {
          name: applicant.name.trim(),
          phone: applicant.phone.trim(),
          message: applicant.note.trim(),
        })
      }
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
    if (!selectedPost?.is_owner) return
    setSubmitting(true)
    try {
      if (selectedPost.isMock) {
        setHiddenMockIds(current => new Set([...current, selectedPost.id]))
      } else if (selectedPost.type === 'people') {
        await deleteJobPost(selectedPost.id)
      } else {
        await deleteHousingPost(selectedPost.id)
      }
      setPosts(current => current.filter(item => !(item.id === selectedPost.id && item.type === selectedPost.type)))
      setDeleteConfirmOpen(false)
      setToast('게시글이 삭제되었습니다.')
      setMode('list')
      setSelectedPost(null)
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
        title={mode === 'write' ? '글쓰기' : mode === 'edit' ? '게시글 수정' : mode === 'apply' ? '지원하기' : mode === 'applications' ? '지원자 목록' : '구해요'}
        onBack={mode === 'list' ? undefined : handleBack}
        rightAction={mode === 'list' ? { label: '글쓰기', icon: <FilePenLine size={19} />, onClick: openWrite } : null}
      />

      <main style={{ padding: '12px 20px 24px' }}>
        {mode === 'list' && (
          <>
            <section style={{ marginBottom: 18 }}>
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
                  style={{ width: '100%', minHeight: 50, border: '1.5px solid #e1e5df', borderRadius: 16, background: '#fff', padding: '0 44px 0 46px', color: '#1f2433', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, outline: 'none', boxSizing: 'border-box' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="검색어 지우기"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, border: 'none', borderRadius: '50%', background: '#f1f3ef', color: '#667064', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                  >
                    <X size={16} strokeWidth={2.3} />
                  </button>
                )}
              </label>
              <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 12, paddingBottom: 2 }}>
                {filters.map(item => (
                  <Pill key={item} active={filter === item} onClick={() => setFilter(item)}>
                    {item}
                  </Pill>
                ))}
              </div>
              {tab === 'house' && (
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setHousingFilterOpen(open => !open)}
                    aria-expanded={housingFilterOpen}
                    style={{
                      width: '100%', minHeight: 44, padding: '0 14px', border: '1.5px solid #dfe5dc',
                      borderRadius: 14, background: '#fff', color: '#334033', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit',
                      fontSize: 13.5, fontWeight: 650, cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <SlidersHorizontal size={17} strokeWidth={2.2} /> 상세 필터
                    </span>
                    {activeHousingFilterCount > 0 && (
                      <span style={{ minWidth: 24, height: 24, padding: '0 7px', borderRadius: 999, background: '#e8f3e8', color: GREEN, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 750 }}>
                        {activeHousingFilterCount}
                      </span>
                    )}
                  </button>
                  {housingFilterOpen && (
                    <div style={{ marginTop: 8, padding: 14, borderRadius: 18, background: '#f4f6f2', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                        <SelectField
                          label="지역"
                          value={housingFilters.region}
                          onChange={value => setHousingFilters(current => ({ ...current, region: value }))}
                          options={['전체', ...regionOptions].map(value => ({ value, label: value }))}
                        />
                        <SelectField
                          label="거래 유형"
                          value={housingFilters.dealType}
                          onChange={value => setHousingFilters(current => ({
                            ...current,
                            dealType: value,
                            monthlyRent: value === '전세' ? '전체' : current.monthlyRent,
                          }))}
                          options={['전체', '월세', '전세'].map(value => ({ value, label: value }))}
                        />
                        <SelectField
                          label="보증금"
                          value={housingFilters.deposit}
                          onChange={value => setHousingFilters(current => ({ ...current, deposit: value }))}
                          options={depositFilterOptions}
                        />
                        {housingFilters.dealType !== '전세' && (
                          <SelectField
                            label="월세"
                            value={housingFilters.monthlyRent}
                            onChange={value => setHousingFilters(current => ({ ...current, monthlyRent: value }))}
                            options={monthlyRentFilterOptions}
                          />
                        )}
                        <SelectField
                          label="면적"
                          value={housingFilters.size}
                          onChange={value => setHousingFilters(current => ({ ...current, size: value }))}
                          options={sizeFilterOptions}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setHousingFilters(initialHousingFilters)}
                        disabled={activeHousingFilterCount === 0}
                        style={{ alignSelf: 'flex-end', border: 'none', background: 'transparent', color: activeHousingFilterCount ? '#596257' : '#aeb3ad', display: 'inline-flex', alignItems: 'center', gap: 5, padding: 3, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: activeHousingFilterCount ? 'pointer' : 'default' }}
                      >
                        <RotateCcw size={14} strokeWidth={2.2} /> 초기화
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading && (
                <div style={{ minHeight: 180, display: 'grid', placeItems: 'center', color: GREEN }}>
                  <Loader2 size={30} aria-label="게시글을 불러오는 중" style={{ animation: 'spin 0.9s linear infinite' }} />
                </div>
              )}
              {!loading && visiblePosts.map(post => (
                <PostCard key={`${post.type}-${post.id}`} post={post} onClick={() => openDetail(post)} />
              ))}
              {!loading && error && (
                <div style={{ padding: '34px 18px', borderRadius: 18, background: '#fff', textAlign: 'center', color: '#d93025', fontSize: 14, fontWeight: 500 }}>
                  {error}
                </div>
              )}
              {!loading && !error && visiblePosts.length === 0 && (
                <div style={{ padding: '42px 0', textAlign: 'center', color: '#888', fontSize: 14, fontWeight: 500 }}>
                  {searchQuery.trim() ? '검색 결과가 없어요.' : '아직 등록된 게시글이 없어요.'}
                </div>
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
                  <InfoRow icon={MapPin}>장소: {selectedPost.location || selectedPost.region}</InfoRow>
                  <InfoRow icon={CalendarDays}>모집 기간: {selectedPost.period}</InfoRow>
                  <InfoRow icon={UsersRound}>모집 인원: {selectedPost.headcount}</InfoRow>
                  <InfoRow icon={Check}>지원 조건: {selectedPost.condition}</InfoRow>
                </>
              ) : (
                <>
                  <InfoRow icon={MapPin}>주소: {selectedPost.address}</InfoRow>
                  <InfoRow icon={Home}>집 정보: {selectedPost.size} · {selectedPost.rooms}</InfoRow>
                  <InfoRow icon={CalendarDays}>가격: {selectedPost.price}</InfoRow>
                  <InfoRow icon={Check}>{selectedPost.maintenance}</InfoRow>
                  <InfoRow icon={Check}>옵션: {(selectedPost.options || []).join(', ') || '문의 필요'}</InfoRow>
                </>
              )}
              <InfoRow icon={UserRound}>작성자: {selectedPost.author}</InfoRow>
              {selectedPost.type === 'house' && <InfoRow icon={Phone}>연락처: {selectedPost.phone}</InfoRow>}
            </div>

            {selectedPost.is_owner && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                {selectedPost.type === 'people' && (
                  <button type="button" onClick={openApplications} style={{ minHeight: 46, border: '1.5px solid #dfe4dc', borderRadius: 14, background: '#fff', color: '#333', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    지원자 보기
                  </button>
                )}
                {!selectedPost.isMock && (
                  <button type="button" onClick={openEdit} style={{ minHeight: 46, border: '1.5px solid #dfe4dc', borderRadius: 14, background: '#fff', color: GREEN, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <Pencil size={15} /> 수정
                  </button>
                )}
                <button type="button" onClick={() => setDeleteConfirmOpen(true)} style={{ minHeight: 46, border: '1.5px solid #f0d2cf', borderRadius: 14, background: '#fff', color: '#d93025', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Trash2 size={15} /> 삭제
                </button>
              </div>
            )}

            {selectedPost.type === 'people' ? (
              <Button onClick={() => setMode('apply')} style={{ marginTop: 8 }}>지원하기</Button>
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
            <Field label="이름" value={applicant.name} onChange={v => updateApplicant('name', v)} placeholder="이름을 입력해 주세요" />
            <Field label="전화번호" value={applicant.phone} onChange={v => updateApplicant('phone', v)} placeholder="010-0000-0000" type="tel" />
            <Field label="거주 지역" value={applicant.region} onChange={v => updateApplicant('region', v)} placeholder="예: 옥천읍" />
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
