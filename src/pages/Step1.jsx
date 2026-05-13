import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import StepIndicator from '../components/StepIndicator'
import SelectField from '../components/SelectField'
import Button from '../components/Button'
import BottomNav from '../components/BottomNav'

const regionOptions = [
  { value: '옥천군', label: '옥천군' },
  { value: '청주시', label: '청주시' },
  { value: '충주시', label: '충주시' },
]

export default function Step1() {
  const navigate = useNavigate()
  const [region, setRegion] = useState('옥천군')
  const [age, setAge] = useState('67')
  const [farming, setFarming] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFCF8' }}>
      <div style={{ background: '#FDFCF8' }}>
        <TopBar title="정보 입력" onBack={() => navigate('/')} />
        <div style={{ padding: '8px 18px 10px' }}>
          <StepIndicator current={1} total={2} />
        </div>
      </div>

      <div style={{ padding: '20px 18px 16px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', textAlign: 'center', marginBottom: 2, letterSpacing: '-0.3px', lineHeight: 1.55, animation: 'fadeUp 0.5s ease both' }}>
          귀농·귀향하셨나요?
        </h2>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', textAlign: 'center', marginBottom: 0, letterSpacing: '-0.3px', lineHeight: 1.55, animation: 'fadeUp 0.5s ease 0.15s both' }}>
          받을 수 있는 지원금을 찾아드려요
        </p>
      </div>

      <div style={{ padding: '0 18px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SelectField label="어디 사세요?" required value={region} onChange={setRegion} options={regionOptions} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.1px' }}>나이가 어떻게 되세요?</label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                boxSizing: 'border-box',
                border: '1.5px solid #e8e8e8',
                borderRadius: 16,
                fontSize: 20,
                fontWeight: 600,
                color: '#1a1a1a',
                background: '#fff',
                fontFamily: 'inherit',
                outline: 'none',
                letterSpacing: '-0.2px',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.1px' }}>농사 지으세요?</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ label: '예, 귀농했어요', value: true }, { label: '아니요', value: false }].map(opt => {
                const active = farming === opt.value
                return (
                  <label
                    key={String(opt.value)}
                    onClick={() => setFarming(opt.value)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 19, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.2px' }}
                  >
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: `2px solid ${active ? '#2d6a2d' : '#d0d0d0'}`,
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}>
                      {active && (
                        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#2d6a2d' }} />
                      )}
                    </div>
                    {opt.label}
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 18px 100px' }}>
        <Button variant="outline" onClick={() => navigate('/step2')}>다음</Button>
      </div>

      <BottomNav />
    </div>
  )
}
