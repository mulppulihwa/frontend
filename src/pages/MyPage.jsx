import { useNavigate } from 'react-router-dom'
import { User, MapPin, Check, Clock3, X, ChevronRight, Banknote } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'

const userInfo = {
  name: '김옥천',
  age: 67,
  gender: '남자',
  region: '옥천군',
  farming: true,
  movedAt: '2026.05.15',
}

const grantStatuses = [
  { id: 1, title: '귀농 농업창업 지원금', subtitle: '최대 300만원', status: '신청완료', deadline: '2026-06-30', checkDone: 4, checkTotal: 5 },
  { id: 2, title: '농촌 정착 지원금', subtitle: '최대 500만원', status: '신청예정', deadline: '2026-08-15', checkDone: 1, checkTotal: 5 },
  { id: 3, title: '귀농인 농기계 구입지원', subtitle: '구입 비용 50% 지원', status: null, deadline: '2026-11-30', checkDone: 0, checkTotal: 5 },
]

function getDday(deadlineStr) {
  const today = new Date('2026-05-18')
  const deadline = new Date(deadlineStr)
  const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'D-DAY'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

function MiniRing({ done, total }) {
  const r = 10
  const circ = 2 * Math.PI * r
  const pct = total === 0 ? 0 : done / total
  const complete = done === total && total > 0
  const color = complete ? '#2d6a2d' : '#C96A1B'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
      <svg width="26" height="26" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r={r} fill="none" stroke="#e8e8e8" strokeWidth="2.5" />
        <circle cx="13" cy="13" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 13 13)" />
        {complete && (
          <path d="M9 13.5l2.5 2.5 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
      </svg>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#888' }}>준비물 {done}/{total}</span>
    </div>
  )
}

const statusConfig = {
  신청완료: { label: '신청 완료', color: '#2d6a2d', bg: '#e8f3e8', Icon: Check },
  신청예정: { label: '신청 예정', color: '#C96A1B', bg: '#fff3e0', Icon: Clock3 },
  관심없음: { label: '관심 없음', color: '#d93025', bg: '#fff0ef', Icon: X },
}

function SectionTitle({ children }) {
  return (
    <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px', marginBottom: 10, paddingLeft: 2 }}>
      {children}
    </p>
  )
}

export default function MyPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', background: '#FDFCF8',
      overflowX: 'hidden', boxSizing: 'border-box',
      width: '100%',
    }}>
      <TopBar title="마이페이지" />

      <div style={{ padding: '8px 18px 100px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Profile */}
        <div>
          <SectionTitle>개인 정보</SectionTitle>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, paddingBottom: 16, borderBottom: '1.5px solid #e8e8e8' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: '#e8f3e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <User size={26} color="#2d6a2d" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>{userInfo.name}님</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <MapPin size={13} color="#888" strokeWidth={2} />
                  <span style={{ fontSize: 13, color: '#888', letterSpacing: '-0.1px' }}>{userInfo.region} 거주</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/step1')}
                style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2,
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 500, color: '#888',
                }}
              >
                수정 <ChevronRight size={15} color="#aaa" strokeWidth={2.2} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '나이', value: `${userInfo.age}세` },
                { label: '성별', value: userInfo.gender },
                { label: '귀농 여부', value: userInfo.farming ? '귀농' : '비귀농' },
                { label: '이사 날짜', value: userInfo.movedAt },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#555', letterSpacing: '-0.1px' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.2px' }}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 지원 현황 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 2 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>지원 현황</p>
            <button
              onClick={() => navigate('/grant-status')}
              style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#888' }}
            >
              전체 보기 <ChevronRight size={15} color="#aaa" strokeWidth={2.2} />
            </button>
          </div>
          <Card>
            <div style={{ display: 'flex' }}>
              {[
                { key: '신청완료', label: '신청 완료', color: '#2d6a2d', bg: '#e8f3e8' },
                { key: '신청예정', label: '신청 예정', color: '#C96A1B', bg: '#fff3e0' },
                { key: null, label: '미설정', color: '#888', bg: '#f5f5f5' },
              ].map(({ key, label, color, bg }, i, arr) => {
                const count = grantStatuses.filter(g => g.status === key).length
                return (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      padding: '8px 0',
                      borderRight: i < arr.length - 1 ? '1.5px solid #f0f0f0' : 'none',
                    }}
                  >
                    <p style={{ fontSize: 25, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{count}</p>
                    <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: '-0.1px' }}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* 신청 진행 중 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 2 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>신청 진행 중</p>
            <button
              onClick={() => navigate('/grant-status')}
              style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#888' }}
            >
              전체 보기 <ChevronRight size={15} color="#aaa" strokeWidth={2.2} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {grantStatuses.filter(g => g.status === '신청예정' || g.status === '신청완료').map(g => {
              const cfg = statusConfig[g.status]
              const Icon = cfg.Icon
              return (
                <Card key={g.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Banknote size={18} color={cfg.color} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.2px', marginBottom: 2 }}>{g.title}</p>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: cfg.bg, borderRadius: 8, padding: '3px 7px' }}>
                        <Icon size={10} color={cfg.color} strokeWidth={2.5} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#d93025' }}>{getDday(g.deadline)}</span>
                      <MiniRing done={g.checkDone} total={g.checkTotal} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
