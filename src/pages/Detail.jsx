import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, Banknote, ClipboardCheck, Calendar, Phone, ArrowUpRight, ExternalLink } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import { fetchPolicyDetail } from '../lib/api'

const sections = [
  { title: '지원 내용', icon: Banknote, items: ['농업 창업 비용 최대 300만원 지원'], type: 'bullet' },
  { title: '신청 자격', icon: ClipboardCheck, items: ['귀농 3년 이내', '만 18세 이상', '옥천군 거주'], type: 'check' },
  { title: '신청 기간', icon: Calendar, items: ['2026.04.01 ~ 06.30'], type: 'bullet' },
  { title: '담당 기관', icon: Phone, items: [{ text: '옥천군 농업기술센터', phone: '043-730-XXXX' }], type: 'contact' },
]

function getPolicySourceLink(grant) {
  const source = String(grant?.source || '').trim()
  const href = grant?.source_url || grant?.sourceUrl || ''
  const searchable = `${source} ${href}`.toLowerCase()

  let label = source
  if (searchable.includes('greendaero') || searchable.includes('그린대로') || source === '귀농센터') {
    label = '그린대로 > 종합정보'
  } else if (searchable.includes('data.go.kr') || searchable.includes('공공데이터') || source === '복지로') {
    label = '공공데이터포털'
  } else if (searchable.includes('옥천') || searchable.includes('oc.go.kr') || source === '수동입력') {
    label = '옥천군청'
  }

  if (!label) return null
  return { label, href }
}

function buildSections(grant) {
  if (!grant) return sections
  const sourceLink = getPolicySourceLink(grant)
  return [
    { title: '지원 내용', icon: Banknote, items: [grant.summary || grant.subtitle || '지원 내용을 확인해 주세요'], type: 'bullet' },
    { title: '신청 자격', icon: ClipboardCheck, items: grant.reasons?.length ? grant.reasons : ['신청 자격을 확인해 주세요'], type: 'check' },
    { title: '신청 기간', icon: Calendar, items: [grant.period || '신청 기간 확인'], type: 'bullet' },
    { title: '담당 기관', icon: Phone, items: [{ text: grant.agency || '담당 기관 확인', phone: grant.phone || (grant.agency?.match(/\(([0-9-]+)\)/)?.[1]) || null }], type: 'contact' },
    ...(sourceLink ? [{ title: '출처', icon: ExternalLink, type: 'source', link: sourceLink, source: grant.source, sourceUrl: grant.source_url || grant.sourceUrl }] : []),
  ]
}

export default function Detail() {
  const { state } = useLocation()
  const initialGrant = state?.grant
  const [grant, setGrant] = useState(initialGrant)

  useEffect(() => {
    if (!initialGrant?.id) return

    let cancelled = false
    fetchPolicyDetail(initialGrant.id)
      .then(detail => {
        if (cancelled) return
        setGrant({
          ...initialGrant,
          ...detail,
          reasons: initialGrant.reasons?.length ? initialGrant.reasons : detail.reasons,
        })
      })
      .catch(error => {
        console.warn('[Detail] 정책 상세 정보를 불러오지 못했습니다.', error)
      })

    return () => {
      cancelled = true
    }
  }, [initialGrant])

  const detailSections = useMemo(() => buildSections(grant), [grant])

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
            {grant?.title || '귀농 농업창업 지원금'}
          </p>
          <p style={{ fontSize: 14, fontWeight: 400, color: '#888', marginTop: 4, letterSpacing: '-0.1px' }}>
            {grant?.agency || '농림축산식품부 · 옥천군'}
          </p>
          {/* Amount highlight */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#e8f3e8', borderRadius: 12, padding: '8px 18px', marginTop: 12,
          }}>
            <Banknote size={16} color="#076818" strokeWidth={2.2} />
            <span style={{ fontSize: 15, fontWeight: 500, color: '#076818', letterSpacing: '-0.2px' }}>{grant?.subtitle || '최대 300만원 지원'}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '4px 18px 176px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {detailSections.map(section => (
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
                  section.link.href ? (
                    <a
                      href={section.link.href}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
                        fontSize: 14, fontWeight: 500, color: '#076818', textDecoration: 'none',
                        marginTop: 2,
                      }}
                    >
                      {section.link.label}
                      <ArrowUpRight size={15} color="#076818" strokeWidth={2.2} />
                    </a>
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#076818', marginTop: 2 }}>
                      {section.link.label}
                    </span>
                  )
                )}
              </div>
            )}

            {section.type === 'source' && (section.source || section.link?.label) && (
              section.sourceUrl ? (
                <a
                  href={section.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 14, fontWeight: 600, color: '#076818', textDecoration: 'none',
                    background: '#e8f3e8', padding: '10px 16px', borderRadius: 14,
                  }}
                >
                  {section.source || section.link.label}
                  <ArrowUpRight size={15} color="#076818" strokeWidth={2.3} />
                </a>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#076818' }}>
                  {section.source || section.link?.label}
                  <ArrowUpRight size={15} color="#076818" strokeWidth={2.3} />
                </span>
              )
            )}

            {section.type === 'contact' && section.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 400, color: '#1a1a1a', letterSpacing: '-0.2px' }}>{item.text}</p>
                {item.phone && (
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
                )}
              </div>
            ))}
          </Card>
        ))}

      </div>

    </div>
  )
}
