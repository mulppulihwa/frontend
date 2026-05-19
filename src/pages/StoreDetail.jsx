import { Check, Banknote, ClipboardCheck, Calendar, Phone, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Card from '../components/Card'

const storeDetails = {
  farm: {
    title: '귀농인 농기계 구입지원',
    agency: '옥천군청 농업정책과',
    highlight: '구입 비용의 50% 지원',
    sections: [
      {
        title: '지원 내용',
        icon: Banknote,
        type: 'bullet',
        items: [
          '농기계 구입 비용의 50% 지원',
          '관리기 최대 100만원',
          '경운기 · 건조기 · 운반차 최대 150만원',
          '저온저장고 최대 300만원',
        ],
      },
      {
        title: '신청 자격',
        icon: ClipboardCheck,
        type: 'check',
        items: [
          '귀농 5년 이내',
          '옥천군 거주',
          '농업경영체 등록자',
        ],
      },
      {
        title: '신청 기간',
        icon: Calendar,
        type: 'bullet',
        items: ['2026.03.01 ~ 2026.11.30 (예산 소진 시 조기 마감)'],
      },
      {
        title: '담당 기관',
        icon: Phone,
        type: 'contact',
        items: [{ text: '옥천군청 농업정책과', phone: '043-730-3114' }],
      },
    ],
    stores: [
      { name: '옥천농기계센터', address: '옥천읍 금구리 123', phone: '043-730-1111' },
      { name: '농협 농자재마트', address: '옥천읍 하계리 45', phone: '043-730-2222' },
      { name: '금강농기계', address: '옥천읍 문정리 67', phone: '043-730-3333' },
    ],
  },
  local: {
    title: '지역화폐 사용처 안내',
    agency: '옥천군청 경제일자리과',
    highlight: '옥천사랑상품권 가맹점',
    sections: [
      {
        title: '지원 내용',
        icon: Banknote,
        type: 'bullet',
        items: [
          '옥천사랑상품권 사용 가능 가맹점',
          '10% 할인 혜택 적용',
          '월 최대 50만원 구매 가능',
        ],
      },
      {
        title: '이용 자격',
        icon: ClipboardCheck,
        type: 'check',
        items: ['옥천군 주민 누구나', '모바일 또는 카드형 상품권 사용'],
      },
      {
        title: '이용 기간',
        icon: Calendar,
        type: 'bullet',
        items: ['연중 상시 이용 가능'],
      },
      {
        title: '담당 기관',
        icon: Phone,
        type: 'contact',
        items: [{ text: '옥천군청 경제일자리과', phone: '043-730-3214' }],
      },
    ],
    stores: [
      { name: '옥천전통시장', address: '옥천읍 문정리 1', phone: '043-730-4444' },
      { name: '하나로마트 옥천점', address: '옥천읍 금구리 200', phone: '043-730-5555' },
      { name: '옥천군 가맹점 일대', address: '옥천읍 일원', phone: '043-730-6666' },
    ],
  },
}

export default function StoreDetail() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const category = params.get('category') || 'farm'
  const storeIndex = parseInt(params.get('store') || '0', 10)
  const detail = storeDetails[category]
  const store = detail.stores[storeIndex]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto', overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch', background: '#FDFCF8',
    }}>
      <TopBar title="상세 정보" />

      {/* Header */}
      <div style={{ padding: '4px 24px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.4px', lineHeight: 1.4 }}>
          {store.name}
        </p>
        <p style={{ fontSize: 14, fontWeight: 400, color: '#888', marginTop: 4, letterSpacing: '-0.1px' }}>
          {detail.agency}
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#e8f3e8', borderRadius: 12, padding: '8px 18px', marginTop: 12,
        }}>
          <Banknote size={16} color="#076818" strokeWidth={2.2} />
          <span style={{ fontSize: 15, fontWeight: 500, color: '#076818', letterSpacing: '-0.2px' }}>{detail.highlight}</span>
        </div>
      </div>

      {/* Store location card */}
      <div style={{ padding: '0 18px', marginBottom: 10 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1.5px solid #e3e3e3' }}>
            <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={16} color="#076818" strokeWidth={2.2} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.1px' }}>매장 정보</p>
          </div>
          <p style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px', marginBottom: 8 }}>{store.address}</p>
          <a
            href={`tel:${store.phone}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
              fontSize: 15, fontWeight: 500, color: '#076818', textDecoration: 'none',
              background: '#e8f3e8', padding: '8px 16px', borderRadius: 16, letterSpacing: '-0.1px',
            }}
          >
            <Phone size={14} color="#076818" strokeWidth={2.5} />
            {store.phone}
          </a>
        </Card>
      </div>

      {/* Policy sections */}
      <div style={{ padding: '0 18px 140px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {detail.sections.map(section => (
          <Card key={section.title}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1.5px solid #e3e3e3' }}>
              <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <section.icon size={16} color="#076818" strokeWidth={2.2} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.1px' }}>{section.title}</p>
            </div>

            {section.type === 'bullet' && section.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < section.items.length - 1 ? 8 : 0 }}>
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
    </div>
  )
}
