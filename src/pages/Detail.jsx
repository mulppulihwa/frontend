import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Banknote, ClipboardCheck, Calendar, Phone, MousePointerClick, ArrowUpRight, GraduationCap, FileText } from 'lucide-react'
import TopBar from '../components/TopBar'
import StatusCheckboxes from '../components/StatusCheckboxes'
import Card from '../components/Card'
import Button from '../components/Button'

const sections = [
  { title: '지원 내용', icon: Banknote, items: ['농업 창업 비용 최대 300만원 지원'], type: 'bullet' },
  { title: '신청 자격', icon: ClipboardCheck, items: ['귀농 3년 이내', '만 18세 이상', '옥천군 거주'], type: 'check' },
  { title: '신청 기간', icon: Calendar, items: ['2026.04.01 ~ 06.30'], type: 'bullet' },
  { title: '담당 기관', icon: Phone, items: [{ text: '옥천군 농업기술센터', phone: '043-730-XXXX' }], type: 'contact' },
  { title: '신청 요건', icon: GraduationCap, items: ['귀농교육 100시간 이상 이수'], type: 'requirement', link: { label: '교육이수 페이지 바로가기', href: 'https://agriedu.net/' } },
  { title: '신청 서류', icon: FileText, items: ['주민등록등본', '귀농교육 이수서', '소득분의 증명서'], type: 'bullet' },
  { title: '신청 방법', icon: MousePointerClick, items: ['인터넷, 방문, FAX, 우편, 무인발급기'], type: 'bullet' },
]

function Toast({ visible }) {
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed', bottom: 120, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#1a1a1a', borderRadius: 50, padding: '12px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        animation: 'fadeInUp 0.22s ease',
        whiteSpace: 'nowrap',
      }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#076818', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={13} color="#fff" strokeWidth={2.5} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-0.2px' }}>지원현황이 수정되었습니다</p>
      </div>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

export default function Detail() {
  const navigate = useNavigate()
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
          <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.4px', lineHeight: 1.4 }}>
            귀농 농업창업 지원금
          </p>
          <p style={{ fontSize: 14, fontWeight: 400, color: '#888', marginTop: 4, letterSpacing: '-0.1px' }}>
            농림축산식품부 · 옥천군
          </p>
          {/* Amount highlight */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#e8f3e8', borderRadius: 12, padding: '8px 18px', marginTop: 12,
          }}>
            <Banknote size={16} color="#076818" strokeWidth={2.2} />
            <span style={{ fontSize: 15, fontWeight: 500, color: '#076818', letterSpacing: '-0.2px' }}>최대 300만원 지원</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '4px 18px 176px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sections.map(section => (
          <Card key={section.title}>
            {/* Section title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1.5px solid #e3e3e3' }}>
              <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <section.icon size={16} color="#076818" strokeWidth={2.2} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.1px' }}>{section.title}</p>
            </div>

            {section.type === 'bullet' && section.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#076818', marginTop: 8, flexShrink: 0 }} />
                <p style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px', lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}

            {section.type === 'check' && section.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < section.items.length - 1 ? 10 : 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: 999, background: '#e8f3e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={12} color="#076818" strokeWidth={3} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px' }}>{item}</p>
              </div>
            ))}

            {section.type === 'methods' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {section.items.map((item, i) => (
                  <span key={i} style={{
                    fontSize: 13, fontWeight: 600, color: '#076818',
                    background: '#e8f3e8', borderRadius: 20,
                    padding: '6px 14px', letterSpacing: '-0.1px',
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            )}

            {section.type === 'requirement' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#076818', marginTop: 8, flexShrink: 0 }} />
                    <p style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px', lineHeight: 1.6 }}>{item}</p>
                  </div>
                ))}
                {section.link && (
                  <a
                    href={section.link.href}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
                      fontSize: 14, fontWeight: 500, color: '#076818', textDecoration: 'none',
                      marginTop: 2,
                    }}
                  >
                    {section.link.label}
                    <ArrowUpRight size={15} color="#076818" strokeWidth={2.2} />
                  </a>
                )}
              </div>
            )}

            {section.type === 'contact' && section.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px' }}>{item.text}</p>
                <a
                  href={`tel:${item.phone}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                    fontSize: 15, fontWeight: 500, color: '#076818', textDecoration: 'none',
                    background: '#e8f3e8', padding: '8px 16px', borderRadius: 16, letterSpacing: '-0.1px',
                  }}
                >
                  <Phone size={14} color="#076818" strokeWidth={2.5} />
                  {item.phone}
                </a>
              </div>
            ))}
          </Card>
        ))}

      </div>

      <div style={{ position: 'fixed', bottom: 104, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, padding: '12px 28px 16px' }}>
        <Button onClick={() => navigate('/checklist')} variant="pill">준비물 확인 →</Button>
      </div>

      <Toast visible={toastVisible} />
    </div>
  )
}
