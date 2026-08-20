import { useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Check, ChevronRight, FilePenLine, Home, MapPin, Phone, Plus, UserRound, UsersRound } from 'lucide-react'
import TopBar from '../components/TopBar'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import { getApplicantInfo, getNeedPosts, saveApplicantInfo, saveNeedApplication, saveNeedPost } from '../lib/needsBoard'

const GREEN = '#076818'
const BG = '#FDFCF8'
const peopleFilters = ['전체', '농촌일손', '주택수리', '돌봄', '동아리']
const houseFilters = ['전체', '원룸', '투룸이상', '오피스텔', '주택']

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
        fontWeight: 750,
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
          <span style={{ display: 'inline-flex', borderRadius: 999, background: '#e8f3e8', color: GREEN, padding: '5px 10px', fontSize: 12, fontWeight: 800, marginBottom: 10 }}>
            {post.category}
          </span>
          <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.32, color: '#1f2433', fontWeight: 850, letterSpacing: '-0.35px' }}>
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

function Field({ label, value, onChange, placeholder, type = 'text', textarea = false }) {
  const common = {
    value,
    onChange: event => onChange(event.target.value),
    placeholder,
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
      <span style={{ fontSize: 13, fontWeight: 750, color: '#333' }}>{label}</span>
      {textarea ? <textarea {...common} /> : <input {...common} type={type} />}
    </label>
  )
}

export default function NeedsBoard() {
  const [mode, setMode] = useState('list')
  const [tab, setTab] = useState('people')
  const [filter, setFilter] = useState('전체')
  const [posts, setPosts] = useState(() => getNeedPosts())
  const [selectedPost, setSelectedPost] = useState(null)
  const [toast, setToast] = useState('')
  const [applicant, setApplicant] = useState(() => getApplicantInfo())
  const [draft, setDraft] = useState({
    type: 'people',
    category: '농촌일손',
    title: '',
    region: '',
    period: '',
    schedule: '',
    headcount: '',
    condition: '',
    price: '',
    size: '',
    rooms: '',
    maintenance: '',
    address: '',
    optionsText: '',
    author: '',
    phone: '',
    content: '',
  })

  const filters = tab === 'people' ? peopleFilters : houseFilters
  const visiblePosts = useMemo(() => (
    posts
      .filter(post => post.type === tab)
      .filter(post => filter === '전체' || post.category === filter)
  ), [posts, tab, filter])

  const resetToList = () => {
    setMode('list')
    setSelectedPost(null)
  }

  const openWrite = () => {
    setDraft(current => ({
      ...current,
      type: tab,
      category: tab === 'people' ? '농촌일손' : '원룸',
    }))
    setMode('write')
  }

  const handleSubmitPost = event => {
    event.preventDefault()
    const post = saveNeedPost({
      ...draft,
      options: draft.optionsText.split(',').map(item => item.trim()).filter(Boolean),
    })
    setPosts(getNeedPosts())
    setSelectedPost(post)
    setToast('게시글이 등록되었습니다.')
    setMode('detail')
  }

  const handleApply = event => {
    event.preventDefault()
    saveApplicantInfo(applicant)
    saveNeedApplication(selectedPost.id, applicant)
    setToast('지원 완료되었습니다.')
    setMode('detail')
  }

  const updateDraft = (key, value) => setDraft(current => ({ ...current, [key]: value }))
  const updateApplicant = (key, value) => setApplicant(current => ({ ...current, [key]: value }))

  return (
    <div className="detail-scroll-page" style={{ minHeight: '100dvh', background: BG, paddingBottom: 104, overflowY: 'auto' }}>
      <TopBar
        title={mode === 'write' ? '글쓰기' : mode === 'apply' ? '지원하기' : '구해요'}
        onBack={mode === 'list' ? undefined : resetToList}
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
                      fontWeight: 850,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 12, paddingBottom: 2 }}>
                {filters.map(item => (
                  <Pill key={item} active={filter === item} onClick={() => setFilter(item)}>
                    {item}
                  </Pill>
                ))}
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visiblePosts.map(post => (
                <PostCard key={post.id} post={post} onClick={() => { setSelectedPost(post); setMode('detail') }} />
              ))}
              {visiblePosts.length === 0 && (
                <div style={{ padding: '42px 0', textAlign: 'center', color: '#888', fontSize: 14, fontWeight: 650 }}>
                  조건에 맞는 게시글이 없어요.
                </div>
              )}
            </section>
          </>
        )}

        {mode === 'detail' && selectedPost && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ borderRadius: 24, background: '#fff', boxShadow: '0 4px 20px rgba(31,45,35,0.08)', padding: 20 }}>
              <span style={{ display: 'inline-flex', borderRadius: 999, background: '#e8f3e8', color: GREEN, padding: '6px 12px', fontSize: 12, fontWeight: 850 }}>
                {selectedPost.category}
              </span>
              <h2 style={{ margin: '12px 0 8px', fontSize: 22, lineHeight: 1.3, color: '#1f2433', fontWeight: 900, letterSpacing: '-0.4px' }}>
                {selectedPost.title}
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: '#555', lineHeight: 1.6 }}>{selectedPost.content}</p>
            </div>

            <div style={{ borderRadius: 24, background: '#fff', boxShadow: '0 4px 20px rgba(31,45,35,0.08)', padding: 20, display: 'grid', gap: 13 }}>
              {selectedPost.type === 'people' ? (
                <>
                  <InfoRow icon={MapPin}>장소: {selectedPost.location || selectedPost.region}</InfoRow>
                  <InfoRow icon={CalendarDays}>일정: {selectedPost.period} · {selectedPost.schedule}</InfoRow>
                  <InfoRow icon={UsersRound}>모집 인원: {selectedPost.headcount}</InfoRow>
                  <InfoRow icon={Check}>지원 조건: {selectedPost.condition}</InfoRow>
                </>
              ) : (
                <>
                  <InfoRow icon={MapPin}>주소: {selectedPost.address}</InfoRow>
                  <InfoRow icon={Home}>집 정보: {selectedPost.size} · {selectedPost.rooms}</InfoRow>
                  <InfoRow icon={CalendarDays}>가격: {selectedPost.price}</InfoRow>
                  <InfoRow icon={Check}>옵션: {(selectedPost.options || []).join(', ') || '문의 필요'}</InfoRow>
                </>
              )}
              <InfoRow icon={UserRound}>작성자: {selectedPost.author}</InfoRow>
              <InfoRow icon={Phone}>연락처: {selectedPost.phone}</InfoRow>
            </div>

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
              <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 850, color: '#1f2433' }}>지원자 기본 정보</h2>
              <p style={{ margin: 0, color: '#777', fontSize: 13, lineHeight: 1.5 }}>처음 저장한 정보는 다음 지원 때 자동으로 채워져요.</p>
            </div>
            <Field label="이름" value={applicant.name} onChange={v => updateApplicant('name', v)} placeholder="이름을 입력해 주세요" />
            <Field label="전화번호" value={applicant.phone} onChange={v => updateApplicant('phone', v)} placeholder="010-0000-0000" type="tel" />
            <Field label="거주 지역" value={applicant.region} onChange={v => updateApplicant('region', v)} placeholder="예: 옥천읍" />
            <Field label="전달 메모" value={applicant.note} onChange={v => updateApplicant('note', v)} placeholder="가능한 시간이나 경험을 적어주세요" textarea />
            <Button disabled={!applicant.name || !applicant.phone}>지원 완료</Button>
          </form>
        )}

        {mode === 'write' && (
          <form onSubmit={handleSubmitPost} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SelectField
              label="게시판"
              value={draft.type}
              onChange={value => {
                updateDraft('type', value)
                updateDraft('category', value === 'people' ? '농촌일손' : '원룸')
              }}
              options={[{ value: 'people', label: '사람 구해요' }, { value: 'house', label: '집 구해요' }]}
            />
            <SelectField
              label="카테고리"
              value={draft.category}
              onChange={value => updateDraft('category', value)}
              options={(draft.type === 'people' ? peopleFilters : houseFilters).filter(v => v !== '전체').map(value => ({ value, label: value }))}
            />
            <Field label="제목" value={draft.title} onChange={v => updateDraft('title', v)} placeholder="게시글 제목" />
            <Field label="지역" value={draft.region} onChange={v => updateDraft('region', v)} placeholder="예: 옥천읍, 청산면" />
            {draft.type === 'people' ? (
              <>
                <Field label="모집 기간" value={draft.period} onChange={v => updateDraft('period', v)} placeholder="예: 9월 1일 - 9월 3일" />
                <Field label="일정" value={draft.schedule} onChange={v => updateDraft('schedule', v)} placeholder="예: 오전 9시 - 오후 3시" />
                <Field label="필요 인원" value={draft.headcount} onChange={v => updateDraft('headcount', v)} placeholder="예: 2명" />
                <Field label="지원 조건" value={draft.condition} onChange={v => updateDraft('condition', v)} placeholder="예: 초보 가능" />
                <Field label="장소" value={draft.location} onChange={v => updateDraft('location', v)} placeholder="작업 또는 모임 장소" />
              </>
            ) : (
              <>
                <Field label="가격" value={draft.price} onChange={v => updateDraft('price', v)} placeholder="예: 보증금 300만원 / 월세 35만원" />
                <Field label="집 평수" value={draft.size} onChange={v => updateDraft('size', v)} placeholder="예: 18평" />
                <Field label="방 구성" value={draft.rooms} onChange={v => updateDraft('rooms', v)} placeholder="예: 분리형 원룸" />
                <Field label="관리비" value={draft.maintenance} onChange={v => updateDraft('maintenance', v)} placeholder="예: 관리비 5만원" />
                <Field label="자세한 주소" value={draft.address} onChange={v => updateDraft('address', v)} placeholder="예: 옥천읍 금구리" />
                <Field label="옵션 정보" value={draft.optionsText} onChange={v => updateDraft('optionsText', v)} placeholder="쉼표로 구분해 주세요" />
              </>
            )}
            <Field label="작성자 이름" value={draft.author} onChange={v => updateDraft('author', v)} placeholder="이름 또는 상호명" />
            <Field label="전화번호" value={draft.phone} onChange={v => updateDraft('phone', v)} placeholder="010-0000-0000" type="tel" />
            <Field label="상세 설명" value={draft.content} onChange={v => updateDraft('content', v)} placeholder="자유롭게 적어주세요" textarea />
            <Button disabled={!draft.title || !draft.region || !draft.author || !draft.phone}>등록하기</Button>
          </form>
        )}
      </main>

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 92, transform: 'translateX(-50%)', zIndex: 500, width: 'min(calc(100% - 40px), 320px)', borderRadius: 999, background: '#1f2433', color: '#fff', padding: '13px 18px', textAlign: 'center', fontSize: 14, fontWeight: 750, boxShadow: '0 10px 28px rgba(31,36,51,0.22)' }}>
          {toast}
          <button type="button" onClick={() => setToast('')} style={{ marginLeft: 12, border: 'none', background: 'transparent', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>닫기</button>
        </div>
      )}
    </div>
  )
}
