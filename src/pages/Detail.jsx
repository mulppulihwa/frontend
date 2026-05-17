import { useState, useRef } from 'react'
import { Check, Banknote, ClipboardCheck, Calendar, Phone } from 'lucide-react'
import TopBar from '../components/TopBar'
import StatusCheckboxes from '../components/StatusCheckboxes'
import Card from '../components/Card'
import Button from '../components/Button'

const sections = [
  { title: '지원 내용', icon: Banknote, items: ['농업 창업 비용 최대 300만원 지원'], type: 'bullet' },
  { title: '신청 자격', icon: ClipboardCheck, items: ['귀농 3년 이내', '만 18세 이상', '옥천군 거주'], type: 'check' },
  { title: '신청 기간', icon: Calendar, items: ['2026.04.01 ~ 06.30'], type: 'bullet' },
  { title: '담당 기관', icon: Phone, items: [{ text: '옥천군 농업기술센터', phone: '043-730-XXXX' }], type: 'contact' },
]

function Toast({ visible }) {
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        background: '#fff', borderRadius: 24, padding: '28px 36px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        animation: 'fadeInScale 0.2s ease',
      }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8f3e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={26} color="#2d6a2d" strokeWidth={2.5} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.2px' }}>지원현황이 수정되었습니다</p>
      </div>
      <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  )
}

export default function Detail() {
  const [status, setStatus] = useState(null)
  const [toastVisible, setToastVisible] = useState(false)
  const toastTimer = useRef(null)

  const handleStatusChange = (val) => {
    setStatus(val)
    setToastVisible(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000)
  }

  return (
    <div
      className="detail-scroll-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        background: '#FDFCF8',
      }}
    >

      {/* Header */}
      <div style={{ background: '#FDFCF8' }}>
        <TopBar title="상세 정보" />
        <div style={{ padding: '4px 24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.4px', lineHeight: 1.4 }}>
            귀농 농업창업 지원금
          </p>
          <p style={{ fontSize: 16, fontWeight: 400, color: '#888', marginTop: 4, letterSpacing: '-0.1px' }}>
            농림축산식품부 · 옥천군
          </p>
          {/* Amount highlight */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#e8f3e8', borderRadius: 12, padding: '8px 18px', marginTop: 12,
          }}>
            <Banknote size={16} color="#2d6a2d" strokeWidth={2.2} />
            <span style={{ fontSize: 17, fontWeight: 500, color: '#2d6a2d', letterSpacing: '-0.2px' }}>최대 300만원 지원</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '4px 18px 176px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sections.map(section => (
          <Card key={section.title}>
            {/* Section title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1.5px solid #e3e3e3' }}>
              <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <section.icon size={16} color="#2d6a2d" strokeWidth={2.2} />
              </div>
              <p style={{ fontSize: 17, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.1px' }}>{section.title}</p>
            </div>

            {section.type === 'bullet' && section.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2d6a2d', marginTop: 8, flexShrink: 0 }} />
                <p style={{ fontSize: 16, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px', lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}

            {section.type === 'check' && section.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < section.items.length - 1 ? 10 : 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: 999, background: '#e8f3e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={12} color="#2d6a2d" strokeWidth={3} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px' }}>{item}</p>
              </div>
            ))}

            {section.type === 'contact' && section.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 16, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px' }}>{item.text}</p>
                <a
                  href={`tel:${item.phone}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                    fontSize: 17, fontWeight: 500, color: '#2d6a2d', textDecoration: 'none',
                    background: '#e8f3e8', padding: '8px 16px', borderRadius: 16, letterSpacing: '-0.1px',
                  }}
                >
                  <Phone size={14} color="#2d6a2d" strokeWidth={2.5} />
                  {item.phone}
                </a>
              </div>
            ))}
          </Card>
        ))}

        <Card>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.1px' }}>지원현황을 체크해주세요</p>
          <StatusCheckboxes value={status} onChange={handleStatusChange} />
        </Card>
      </div>

      <div style={{ position: 'fixed', bottom: 76, width: 480, padding: '14px 18px 16px', background: 'linear-gradient(to top, #FDFCF8 75%, transparent)' }}>
        <Button style={{ fontWeight: 500 }}>신청 페이지 바로가기 →</Button>
      </div>

      <Toast visible={toastVisible} />
    </div>
  )
}
