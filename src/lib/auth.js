const KAKAO_REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI

const LOGIN_REDIRECT_KEY = 'loginRedirectTo'
const KAKAO_STATE_KEY = 'kakaoOAuthState'
let pendingCallback = null

function getRedirectUri() {
  if (KAKAO_REDIRECT_URI) return KAKAO_REDIRECT_URI
  return new URL(import.meta.env.BASE_URL, window.location.origin).href
}

function randomState() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function findToken(payload, names) {
  if (!payload || typeof payload !== 'object') return null
  for (const name of names) {
    if (typeof payload[name] === 'string') return payload[name]
  }
  for (const value of Object.values(payload)) {
    const token = findToken(value, names)
    if (token) return token
  }
  return null
}

export function startKakaoLogin(redirectTo = '/home') {
  if (!KAKAO_REST_KEY) {
    throw new Error('카카오 REST API 키가 설정되지 않았습니다.')
  }

  const state = randomState()
  sessionStorage.setItem(LOGIN_REDIRECT_KEY, redirectTo)
  sessionStorage.setItem(KAKAO_STATE_KEY, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: KAKAO_REST_KEY,
    redirect_uri: getRedirectUri(),
    state,
  })

  window.location.assign(`https://kauth.kakao.com/oauth/authorize?${params}`)
}

export async function completeKakaoLogin(search = window.location.search) {
  const params = new URLSearchParams(search)
  const code = params.get('code')
  if (!code) return { completed: false }

  if (pendingCallback?.code === code) return pendingCallback.promise
  pendingCallback = { code, promise: exchangeKakaoCode(params, code) }
  return pendingCallback.promise
}

async function exchangeKakaoCode(params, code) {
  const expectedState = sessionStorage.getItem(KAKAO_STATE_KEY)
  const returnedState = params.get('state')
  if (expectedState && returnedState && expectedState !== returnedState) {
    throw new Error('카카오 로그인 상태 값이 일치하지 않습니다. 다시 시도해 주세요.')
  }

  const response = await fetch('/api/auth/kakao/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}

  if (!response.ok) {
    throw new Error(payload?.error || '카카오 로그인에 실패했습니다. 다시 시도해 주세요.')
  }

  const accessToken = findToken(payload, ['access', 'accessToken', 'access_token', 'token'])
  const refreshToken = findToken(payload, ['refresh', 'refreshToken', 'refresh_token'])

  if (accessToken) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('access', accessToken)
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('refresh', refreshToken)
  }

  sessionStorage.removeItem(KAKAO_STATE_KEY)
  return { completed: true, payload }
}

export function consumeLoginRedirect(fallback = '/home') {
  const redirectTo = sessionStorage.getItem(LOGIN_REDIRECT_KEY) || fallback
  sessionStorage.removeItem(LOGIN_REDIRECT_KEY)
  return redirectTo
}
