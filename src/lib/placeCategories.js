import {
  Armchair,
  Building2,
  CreditCard,
  Droplets,
  Factory,
  Landmark,
  Package,
  Pill,
  Shirt,
  ShoppingBasket,
  Sprout,
  Tractor,
  UtensilsCrossed,
  UsersRound,
} from 'lucide-react'

// Keep these IDs aligned 1:1 with LocalPlace.CATEGORIES in the backend.
export const PLACE_CATEGORIES = [
  { id: '지원금사용처', label: '지원금사용처', icon: CreditCard, color: '#076818', bg: '#e8f3e8' },
  { id: '농자재', label: '농자재', icon: Sprout, color: '#4f7d32', bg: '#edf5e8' },
  { id: '농기계', label: '농기계', icon: Tractor, color: '#9a6200', bg: '#fff3d7' },
  { id: '농협', label: '농협', icon: Landmark, color: '#2f6f4e', bg: '#e8f2ed' },
  { id: '행정', label: '행정', icon: Building2, color: '#365f8d', bg: '#eaf1f8' },
  { id: '생활', label: '생활', icon: Droplets, color: '#2872b7', bg: '#e9f4ff' },
  { id: '음식점', label: '음식점', icon: UtensilsCrossed, color: '#d56d00', bg: '#fff1df' },
  { id: '약국', label: '약국', icon: Pill, color: '#a94567', bg: '#faebf0' },
  { id: '건축자재', label: '건축자재', icon: Factory, color: '#0f7f7a', bg: '#e5f5f4' },
  { id: '의류', label: '의류', icon: Shirt, color: '#7452a1', bg: '#f1ebf8' },
  { id: '식품', label: '식품', icon: ShoppingBasket, color: '#ad6a24', bg: '#fff0df' },
  { id: '전자제품', label: '전자제품', icon: Package, color: '#4e678f', bg: '#edf1f7' },
  { id: '가구', label: '가구', icon: Armchair, color: '#8a6040', bg: '#f5eee8' },
  { id: '동호회', label: '동호회', icon: UsersRound, color: '#087c63', bg: '#e6f5ef' },
]

export function normalizePlaceCategory(category = '', name = '') {
  const value = `${category} ${name}`.trim()

  if (PLACE_CATEGORIES.some(item => item.id === category)) return category
  if (value.includes('지원금')) return '지원금사용처'
  if (value.includes('농자재')) return '농자재'
  if (value.includes('농기계')) return '농기계'
  if (value.includes('농협')) return '농협'
  if (value.includes('행정') || value.includes('교육센터') || value.includes('교육장')) return '행정'
  if (value.includes('음식점') || value.includes('맛집')) return '음식점'
  if (value.includes('약국')) return '약국'
  if (value.includes('건축') || value.includes('부동산')) return '건축자재'
  if (value.includes('의류')) return '의류'
  if (value.includes('식품')) return '식품'
  if (value.includes('전자')) return '전자제품'
  if (value.includes('가구')) return '가구'
  if (value.includes('동호회')) return '동호회'
  if (value.includes('수도') || value.includes('상하수도') || value.includes('집') || value.includes('레저') || value.includes('수련관') || value.includes('캠핑') || value.includes('명소') || value.includes('생가') || value.includes('공원')) return '생활'

  return null
}

export function getPlaceCategoryMeta(category) {
  const normalizedCategory = normalizePlaceCategory(category)
  return PLACE_CATEGORIES.find(item => item.id === normalizedCategory) ?? null
}

export function getPlaceCategories() {
  return PLACE_CATEGORIES
}
