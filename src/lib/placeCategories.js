import {
  Building2, Landmark, Store, UsersRound, UtensilsCrossed,
} from 'lucide-react'

export const PLACE_CATEGORIES = [
  { id: '행정', label: '행정', icon: Landmark, color: '#076818', bg: '#e8f3e8' },
  { id: '부동산', label: '부동산', icon: Building2, color: '#0f7f7a', bg: '#e5f5f4' },
  { id: '동호회', label: '동호회', icon: UsersRound, color: '#5b6ee1', bg: '#eef0ff' },
  { id: '맛집', label: '맛집', icon: UtensilsCrossed, color: '#FFA100', bg: '#fff3e0' },
  { id: '생활', label: '생활', icon: Store, color: '#8a5a16', bg: '#f8efe2' },
]

export function normalizePlaceCategory(category = '') {
  if (category.includes('행정') || category.includes('농협')) return '행정'
  if (category.includes('부동산') || category.includes('건축')) return '부동산'
  if (category.includes('동호회')) return '동호회'
  if (category.includes('맛집') || category.includes('음식점')) return '맛집'
  return '생활'
}

export function getPlaceCategoryMeta(category) {
  const normalized = normalizePlaceCategory(category)
  return PLACE_CATEGORIES.find(item => item.id === normalized) || PLACE_CATEGORIES.at(-1)
}

export function getPlaceCategories() {
  return PLACE_CATEGORIES
}
