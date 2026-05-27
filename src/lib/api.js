const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const POLICY_STATUS_CACHE_KEY = 'policyStatusCache'
const SAVED_POLICY_CACHE_KEY = 'savedPolicyCache'

export function getAccessToken() {
  return localStorage.getItem('accessToken') || localStorage.getItem('access') || localStorage.getItem('token')
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken') || localStorage.getItem('refresh')
}

function storeAccessToken(token) {
  if (!token) return
  localStorage.setItem('accessToken', token)
  localStorage.setItem('access', token)
}

function formatApiErrorValue(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(formatApiErrorValue).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nested]) => `${key}: ${formatApiErrorValue(nested)}`)
      .filter(Boolean)
      .join(' / ')
  }
  return String(value)
}

async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) return null

  const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) return null

  const access = data?.access || data?.accessToken || data?.access_token || data?.token
  storeAccessToken(access)
  return access || null
}

async function request(path, options = {}) {
  const token = getAccessToken()
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (response.status === 401 && !options._retried) {
    const refreshedToken = await refreshAccessToken()
    if (refreshedToken) {
      return request(path, { ...options, _retried: true })
    }
  }

  if (!response.ok) {
    const message = formatApiErrorValue(data?.error || data?.detail || data) || 'API 요청에 실패했습니다.'
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.policies)) return data.policies
  return []
}

function toDate(dateLike) {
  if (!dateLike) return null
  const date = new Date(dateLike)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(dateLike) {
  const date = toDate(dateLike)
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

function getCountdown(deadlineLike) {
  const deadline = toDate(deadlineLike)
  if (!deadline) return { days: 0, hours: 0, minutes: 0 }
  const diff = Math.max(0, deadline.getTime() - Date.now())
  const minutesTotal = Math.floor(diff / 60000)
  const days = Math.floor(minutesTotal / 1440)
  const hours = Math.floor((minutesTotal % 1440) / 60)
  const minutes = minutesTotal % 60
  return { days, hours, minutes }
}

function getPolicyStatus(policy) {
  const deadline = toDate(policy.apply_end_date || policy.deadline || policy.end_date)
  if (!deadline) return '신청기간'
  const diffDays = Math.ceil((deadline.getTime() - Date.now()) / 86400000)
  if (diffDays < 0) return '마감'
  if (diffDays <= 30) return '마감임박'
  return '신청기간'
}

export function normalizeUserPolicyStatus(status) {
  const value = typeof status === 'string' ? status.trim() : status
  const map = {
    신청예정: '신청예정',
    신청완료: '신청완료',
    관심없음: '관심없음',
    planned: '신청예정',
    pending: '신청예정',
    scheduled: '신청예정',
    todo: '신청예정',
    completed: '신청완료',
    complete: '신청완료',
    done: '신청완료',
    applied: '신청완료',
    not_interested: '관심없음',
    uninterested: '관심없음',
    ignored: '관심없음',
    none: '관심없음',
  }
  return map[value] || null
}

function readPolicyStatusCache() {
  try {
    return JSON.parse(localStorage.getItem(POLICY_STATUS_CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function readSavedPolicyCache() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_POLICY_CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function cachePolicyStatus(policyId, status, policy) {
  const normalizedStatus = normalizeUserPolicyStatus(status)
  if (!policyId || !normalizedStatus) return
  const id = String(policyId)
  const statusCache = readPolicyStatusCache()
  statusCache[id] = normalizedStatus
  localStorage.setItem(POLICY_STATUS_CACHE_KEY, JSON.stringify(statusCache))

  if (policy) {
    const savedPolicyCache = readSavedPolicyCache()
    savedPolicyCache[id] = { ...policy, user_status: normalizedStatus }
    localStorage.setItem(SAVED_POLICY_CACHE_KEY, JSON.stringify(savedPolicyCache))
  }
}

export function normalizePolicy(policy, index = 0) {
  const deadline = policy.apply_end_date || policy.deadline || policy.end_date
  const amount = policy.amount_text || policy.amount || policy.benefit || '지원 내용 확인'
  const summary = policy.summary || policy.description || policy.content || ''

  return {
    ...policy,
    id: policy.id ?? policy.policy_id ?? index + 1,
    title: policy.title || policy.name || policy.policy_name || policy.grant_name || policy.policy_title || `지원 정책 ${index + 1}`,
    subtitle: amount,
    agency: policy.managing_org || policy.agency || policy.organization || '담당 기관 확인',
    reasons: [summary, policy.benefit_type].filter(Boolean),
    period: deadline ? `~ ${formatDate(deadline)}` : '신청 기간 확인',
    deadline: deadline || null,
    status: getPolicyStatus(policy),
    countdown: getCountdown(deadline),
    checkDone: policy.checkDone ?? 0,
    checkTotal: policy.checkTotal ?? 5,
  }
}

export function normalizePlace(place, index = 0) {
  const category = place.category || place.type || place.benefit_type || ''
  return {
    ...place,
    id: place.id ?? index + 1,
    name: place.name || place.title || `사용처 ${index + 1}`,
    address: place.address || place.road_address || place.road_address_name || '',
    phone: place.phone || place.tel || '',
    hours: place.hours || place.opening_hours || '운영시간 확인 필요',
    lat: Number(place.lat ?? place.latitude ?? place.y),
    lng: Number(place.lng ?? place.longitude ?? place.x),
    rating: place.rating ?? 4.0,
    reviews: place.reviews ?? 0,
    category,
  }
}

export async function fetchPreviewPolicies() {
  const data = await request('/api/policies/preview/')
  return toArray(data).map(normalizePolicy)
}

export async function fetchMatchedPolicies() {
  const data = await request('/api/policies/match/')
  return toArray(data).map(normalizePolicy)
}

export async function fetchRegions() {
  const data = await request('/api/regions/')
  return toArray(data)
}

export async function fetchPlaces() {
  const data = await request('/api/places/')
  return toArray(data).map(normalizePlace).filter(place => Number.isFinite(place.lat) && Number.isFinite(place.lng))
}

export async function fetchProfile() {
  const data = await request('/api/profile/')
  console.log('[fetchProfile] response:', JSON.stringify(data))
  return data
}

export async function updateProfile(profile) {
  return request('/api/profile/', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  })
}

export async function fetchSavedPolicies() {
  const statusCache = readPolicyStatusCache()
  const savedPolicyCache = readSavedPolicyCache()
  let data = []
  try {
    data = await request('/api/users/me/policies/')
    console.log('[fetchSavedPolicies] raw API response:', JSON.stringify(data).slice(0, 1000))
  } catch (err) {
    console.warn('[fetchSavedPolicies] API error:', err)
    data = []
  }
  const policies = toArray(data).map((item, index) => {
    const policy = (item.policy && typeof item.policy === 'object') ? item.policy : item
    const userStatus = item.user_status || item.status || item.policy_status || item.application_status || policy.user_status
    const normalizedPolicy = normalizePolicy(policy, index)
    return {
      ...normalizedPolicy,
      user_status: normalizeUserPolicyStatus(userStatus) || statusCache[String(normalizedPolicy.id)] || null,
    }
  })
  const ids = new Set(policies.map(policy => String(policy.id)))
  const cachedPolicies = Object.entries(savedPolicyCache)
    .filter(([id]) => !ids.has(id))
    .map(([, policy], index) => ({
      ...normalizePolicy(policy, policies.length + index),
      user_status: normalizeUserPolicyStatus(policy.user_status) || statusCache[String(policy.id)] || null,
    }))
  return [...policies, ...cachedPolicies]
}

export async function savePolicy(policyId) {
  return request(`/api/users/me/policies/${policyId}/save/`, {
    method: 'POST',
  })
}

export async function updateSavedPolicyStatus(policyId, status) {
  const mappedStatus = {
    신청예정: 'planned',
    신청완료: 'completed',
    관심없음: 'not_interested',
  }[status] || status
  const payloads = [
    { status },
    { user_status: status },
    { status: mappedStatus },
    { user_status: mappedStatus },
  ]
  let lastError = null

  for (const payload of payloads) {
    try {
      return await request(`/api/users/me/policies/${policyId}/status/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } catch (err) {
      lastError = err
      if (![400, 422].includes(err.status)) throw err
    }
  }

  throw lastError
}
