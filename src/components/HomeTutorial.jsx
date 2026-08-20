import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import okcheonCharacter from '../assets/okcheon-character.png'

function createSteps(userName) {
  const displayName = userName || '사용자'
  return [
    {
      selector: null,
      eyebrow: '옥천옥 홈',
      title: '안녕하세요. 여기는 옥천옥의 홈화면이에요.',
      description: '',
    },
    {
      selector: null,
      eyebrow: '홈화면 안내',
      title: '여러분이 홈화면을 쉽게 사용할 수 있도록 차근차근 설명해 드릴게요!',
      description: '',
    },
    {
      selector: '[data-tutorial="schedule"]',
      eyebrow: '오늘의 맞춤 일정',
      title: '가장 마감이 임박한 정책의 필요 서류들을 띄워드려요.',
      description: '',
    },
    {
      selector: '[data-tutorial="summary"]',
      eyebrow: '진단 받은 정책',
      title: `${displayName}님이 진단 받은 정책 내용을 전부 확인하실 수 있어요.`,
      description: '',
    },
    {
      selector: '[data-tutorial="map-navigation"]',
      eyebrow: '우리 마을 정착 지도',
      title: '집과 부동산부터 농기계, 교육, 생활 명소까지 성공적인 옥천 정착을 돕는 지도예요.',
      description: '',
    },
    {
      selector: null,
      keepPosition: true,
      eyebrow: '안내 완료',
      title: '자, 그럼 이제 옥천옥을 사용하러 가볼까요?',
      description: '',
    },
  ]
}

function getTargetRect(selector) {
  if (!selector) return null
  const target = document.querySelector(selector)
  if (!target) return null
  const rect = target.getBoundingClientRect()
  const margin = 8
  const top = Math.max(margin, rect.top - margin)
  const bottom = Math.min(window.innerHeight - margin, rect.bottom + margin)
  return {
    top,
    left: Math.max(margin, rect.left - margin),
    width: Math.min(window.innerWidth - margin * 2, rect.width + margin * 2),
    height: Math.max(0, bottom - top),
    bottom,
  }
}

export default function HomeTutorial({ onFinish, userName }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const steps = useMemo(() => createSteps(userName), [userName])
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  const updateTarget = useCallback(() => {
    setTargetRect(getTargetRect(step.selector))
  }, [step.selector])

  useEffect(() => {
    if (!step.selector) {
      setTargetRect(null)
      if (!step.keepPosition) window.scrollTo({ top: 0, behavior: 'smooth' })
      return undefined
    }

    const target = document.querySelector(step.selector)
    if (!target) return undefined

    if (stepIndex < steps.length - 1) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const firstUpdate = window.setTimeout(updateTarget, 80)
    const settledUpdate = window.setTimeout(updateTarget, 520)
    window.addEventListener('resize', updateTarget)
    window.addEventListener('scroll', updateTarget, { passive: true })

    return () => {
      window.clearTimeout(firstUpdate)
      window.clearTimeout(settledUpdate)
      window.removeEventListener('resize', updateTarget)
      window.removeEventListener('scroll', updateTarget)
    }
  }, [step, stepIndex, updateTarget])

  const finish = () => onFinish?.()
  const isIntro = !step.selector

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, pointerEvents: 'none' }} aria-live="polite">
      {isIntro && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,20,0.56)' }} />
      )}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: 28,
            border: '2px solid rgba(7,104,24,0.68)',
            boxShadow: '0 0 0 9999px rgba(20,24,20,0.56), 0 10px 36px rgba(7,104,24,0.18)',
            transition: 'top 0.35s ease, left 0.35s ease, width 0.35s ease, height 0.35s ease',
          }}
        />
      )}

      <div
        role="dialog"
        aria-label={`${step.eyebrow} 사용 안내`}
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 'calc(84px + env(safe-area-inset-bottom))',
          width: 'calc(100% - 32px)',
          maxWidth: 398,
          boxSizing: 'border-box',
          background: '#FFFFFF',
          border: '1.5px solid #cfe1c8',
          borderRadius: 22,
          boxShadow: '0 16px 44px rgba(22,35,24,0.2)',
          padding: isIntro ? '22px 20px 18px' : '18px 18px 16px',
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          aria-label="안내 닫기"
          onClick={finish}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 30,
            height: 30,
            border: 'none',
            borderRadius: '50%',
            background: '#f4f6f2',
            color: '#6f776d',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} strokeWidth={2.2} />
        </button>

        <div style={{ display: 'flex', alignItems: isIntro ? 'center' : 'flex-start', gap: 12, paddingRight: 28 }}>
          <div style={{ width: isIntro ? 66 : 54, height: isIntro ? 66 : 54, flexShrink: 0, overflow: 'hidden', borderRadius: 16, background: '#eef6eb' }}>
            <img
              src={okcheonCharacter}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%' }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#076818' }}>{step.eyebrow}</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 750, color: '#1f2433', lineHeight: 1.35, wordBreak: 'keep-all' }}>
              {step.title}
            </h2>
          </div>
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 13, fontWeight: 400, color: '#5f625d', lineHeight: 1.55, wordBreak: 'keep-all' }}>
          {step.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {steps.map((item, index) => (
              <span
                key={item.title}
                style={{
                  width: index === stepIndex ? 20 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: index === stepIndex ? '#076818' : '#dfe7dc',
                  transition: 'width 0.2s ease, background 0.2s ease',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {stepIndex > 0 && (
              <button
                type="button"
                aria-label="이전 안내"
                onClick={() => setStepIndex(index => index - 1)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  border: '1.5px solid #cfe1c8',
                  background: '#FFFFFF',
                  color: '#076818',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={17} strokeWidth={2.3} />
              </button>
            )}
            <button
              type="button"
              onClick={isLast ? finish : () => setStepIndex(index => index + 1)}
              style={{
                minWidth: isLast ? 92 : 74,
                height: 38,
                padding: '0 15px',
                borderRadius: 999,
                border: 'none',
                background: '#076818',
                color: '#FFFFFF',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              {isLast ? '옥천옥 시작하기' : '다음'}
              {isLast ? <Check size={15} strokeWidth={2.5} /> : <ArrowRight size={15} strokeWidth={2.4} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
