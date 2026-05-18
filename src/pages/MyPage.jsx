import { useNavigate } from 'react-router-dom'
import { User, MapPin, Check, Clock3, X, ChevronRight, ArrowRight, ClipboardList } from 'lucide-react'
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
  { id: 1, title: '귀농 농업창업 지원금', subtitle: '최대 300만원', status: '신청완료', deadline: '2026.06.30' },
  { id: 2, title: '농촌 정착 지원금', subtitle: '최대 500만원', status: '신청예정', deadline: '2026.08.15' },
  { id: 3, title: '귀농인 농기계 구입지원', subtitle: '구입 비용 50% 지원', status: null, deadline: '2026.11.30' },
]

const statusConfig = {
  신청완료: { label: '신청 완료', color: '#2d6a2d', bg: '#e8f3e8', Icon: Check },
  신청예정: { label: '신청 예정', color: '#e07b00', bg: '#fff3e0', Icon: Clock3 },
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
                  <span style={{ fontSize: 14, color: '#888', letterSpacing: '-0.1px' }}>{label}</span>
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
                { key: '신청예정', label: '신청 예정', color: '#e07b00', bg: '#fff3e0' },
                { key: null, label: '미설정', color: '#bbb', bg: '#f5f5f5' },
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
                    <span style={{
                      fontSize: 12, fontWeight: 600, color,
                      letterSpacing: '-0.1px',
                    }}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* 준비물 확인하기 */}
        <div>
          <SectionTitle>준비물</SectionTitle>
          <button
            onClick={() => navigate('/checklist')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 20px',
              background: '#fff',
              border: '1.5px solid #e8e8e8',
              borderRadius: 20,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: '#e8f3e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <ClipboardList size={22} color="#2d6a2d" strokeWidth={2} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.2px' }}>준비물 확인하기</p>
                <p style={{ fontSize: 13, color: '#888', marginTop: 2, letterSpacing: '-0.1px' }}>신청에 필요한 서류를 확인해요</p>
              </div>
            </div>
            <ArrowRight size={20} color="#aaa" strokeWidth={2.2} />
          </button>
        </div>

      </div>
    </div>
  )
}
