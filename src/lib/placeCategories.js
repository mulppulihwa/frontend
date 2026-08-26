import {
  Building2,
  House,
  MapPinned,
  ShoppingBag,
  Sprout,
  Tractor,
  UtensilsCrossed,
  UsersRound,
} from 'lucide-react'

// Keep these IDs aligned 1:1 with LocalPlace.CATEGORIES in the backend.
export const PLACE_CATEGORIES = [
  { id: '농자재', label: '농자재', icon: Sprout, color: '#4f7d32', bg: '#edf5e8' },
  { id: '농기계', label: '농기계', icon: Tractor, color: '#9a6200', bg: '#fff3d7' },
  { id: '행정', label: '행정', icon: Building2, color: '#365f8d', bg: '#eaf1f8' },
  { id: '생활', label: '생활', icon: ShoppingBag, color: '#2872b7', bg: '#e9f4ff' },
  { id: '명소', label: '명소', icon: MapPinned, color: '#b04d70', bg: '#faebf0' },
  { id: '음식점', label: '음식점', icon: UtensilsCrossed, color: '#d56d00', bg: '#fff1df' },
  { id: '동호회', label: '동호회', icon: UsersRound, color: '#087c63', bg: '#e6f5ef' },
  { id: '부동산', label: '부동산', icon: House, color: '#8a6040', bg: '#f5eee8' },
]

export function normalizePlaceCategory(category = '', name = '') {
  const value = `${category} ${name}`.trim()

  if (PLACE_CATEGORIES.some(item => item.id === category)) return category
  if (value.includes('농자재')) return '농자재'
  if (value.includes('농기계')) return '농기계'
  if (value.includes('행정')) return '행정'
  if (value.includes('생활')) return '생활'
  if (value.includes('명소')) return '명소'
  if (value.includes('음식점') || value.includes('맛집')) return '음식점'
  if (value.includes('동호회')) return '동호회'
  if (value.includes('부동산')) return '부동산'

  return null
}

export function getPlaceCategoryMeta(category) {
  const normalizedCategory = normalizePlaceCategory(category)
  return PLACE_CATEGORIES.find(item => item.id === normalizedCategory) ?? null
}

export function getPlaceCategories() {
  return PLACE_CATEGORIES
}
