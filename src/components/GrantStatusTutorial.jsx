import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import okcheonCharacter from '../assets/okcheon-character.png'

const steps = [
  {
    selector: null,
    eyebrow: '지원 현황',
    title: '여기는 내 지원 현황 페이지예요.',
    description: '진단을 통해 추천받은 정책들을 한눈에 관리할 수 있어요.',
  },
  {
    selector: '[data-tutorial="gs-filters"]',
    eyebrow: '필터',
    title: '필터로 정책을 상태별로 모아볼 수 있어요.',
    description: '신청 예정·완료·관심 없음으로 나눠서 확인해 보세요.',
  },
  {
    selector: '[data-tutorial="gs-status"]',
    eyebrow: '상태 변경',
    title: '각 정책의 신청 상태를 직접 업데이트할 수 있어요.',
    description: '신청을 완료했다면 바로 표시해 두세요!',
  },
  {
    selector: '[data-tutorial="gs-bell"]',
    eyebrow: '마감 알림',
    title: '🔔 버튼을 누르면 마감일 알림을 받을 수 있어요.',
    description: '중요한 정책을 놓치지 않도록 알림을 설정해 두세요.',
  },
  {
    selector: null,
    keepPosition: true,
    eyebrow: '안내 완료',
    title: '이제 지원 현황을 잘 활용해 보세요!',
    description: '',
  },
]

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

export default function GrantStatusTutorial({ onFinish }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
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
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const t1 = window.setTimeout(updateTarget, 80)
    const t2 = window.setTimeout(updateTarget, 520)
    window.addEventListener('resize', updateTarget)
    window.addEventListener('scroll', updateTarget, { passive: true })

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', updateTarget)
      window.removeEventListener('scroll', updateTarget)
    }
  }, [step, stepIndex, updateTarget])

  const finish = () => onFinish?.()
  const isIntro = !step.selector

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, pointerEvents: 'none' }} aria-live="polite">
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,20,0.56)' }} />

      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: 20,
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
            position: 'absolute', top: 12, right: 12,
            width: 30, height: 30, border: 'none', borderRadius: '50%',
            background: '#f4f6f2', color: '#6f776d',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} strokeWidth={2.2} />
        </button>

        <div style={{ display: 'flex', alignItems: isIntro ? 'center' : 'flex-start', gap: 12, paddingRight: 28 }}>
          <div style={{ width: isIntro ? 66 : 54, height: isIntro ? 66 : 54, flexShrink: 0, overflow: 'hidden', borderRadius: 16, background: '#eef6eb' }}>
            <img src={okcheonCharacter} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#076818' }}>{step.eyebrow}</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 750, color: '#1f2433', lineHeight: 1.35, wordBreak: 'keep-all' }}>
              {step.title}
            </h2>
          </div>
        </div>

        {step.description ? (
          <p style={{ margin: '12px 0 0', fontSize: 13, color: '#5f625d', lineHeight: 1.55, wordBreak: 'keep-all' }}>
            {step.description}
          </p>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {steps.map((s, i) => (
              <span
                key={s.eyebrow}
                style={{
                  width: i === stepIndex ? 20 : 6, height: 6, borderRadius: 999,
                  background: i === stepIndex ? '#076818' : '#dfe7dc',
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
                onClick={() => setStepIndex(i => i - 1)}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  border: '1.5px solid #cfe1c8', background: '#FFFFFF', color: '#076818',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <ArrowLeft size={17} strokeWidth={2.3} />
              </button>
            )}
            <button
              type="button"
              onClick={isLast ? finish : () => setStepIndex(i => i + 1)}
              style={{
                minWidth: isLast ? 92 : 74, height: 38, padding: '0 15px',
                borderRadius: 999, border: 'none', background: '#076818', color: '#FFFFFF',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                cursor: 'pointer',
              }}
            >
              {isLast ? '확인했어요' : '다음'}
              {isLast ? <Check size={15} strokeWidth={2.5} /> : <ArrowRight size={15} strokeWidth={2.4} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
