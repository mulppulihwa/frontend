import {
  Building2,
  Droplets,
  GraduationCap,
  House,
  MapPinned,
  TentTree,
  Tractor,
  UtensilsCrossed,
} from 'lucide-react'

export const PLACE_CATEGORIES = [
  { id: '집', label: '집', icon: House, color: '#076818', bg: '#e8f3e8' },
  { id: '부동산', label: '부동산', icon: Building2, color: '#0f7f7a', bg: '#e5f5f4' },
  { id: '농기계', label: '농기계', icon: Tractor, color: '#9a6200', bg: '#fff3d7' },
  { id: '수도', label: '수도', icon: Droplets, color: '#2872b7', bg: '#e9f4ff' },
  { id: '교육센터', label: '교육센터', icon: GraduationCap, color: '#5b6ee1', bg: '#eef0ff' },
  { id: '레저시설', label: '레저시설', icon: TentTree, color: '#087c63', bg: '#e6f5ef' },
  { id: '명소', label: '명소', icon: MapPinned, color: '#c14f75', bg: '#fbeaf0' },
  { id: '맛집', label: '맛집', icon: UtensilsCrossed, color: '#d56d00', bg: '#fff1df' },
]

export function normalizePlaceCategory(category = '', name = '') {
  const value = `${category} ${name}`.trim()

  if (value.includes('귀농인의 집') || value.includes('러스틱팜하우스') || category === '집') return '집'
  if (value.includes('부동산') || value.includes('건축')) return '부동산'
  if (value.includes('농기계')) return '농기계'
  if (value.includes('수도') || value.includes('상하수도')) return '수도'
  if (value.includes('교육센터') || value.includes('교육장')) return '교육센터'
  if (value.includes('레저') || value.includes('수련관') || value.includes('캠핑')) return '레저시설'
  if (value.includes('명소') || value.includes('생가') || value.includes('공원') || value.includes('용암사') || value.includes('호수길') || value.includes('정원') || value.includes('문화체험관') || value.includes('부소감악')) return '명소'
  if (value.includes('맛집') || value.includes('음식점')) return '맛집'

  return PLACE_CATEGORIES.some(item => item.id === category) ? category : null
}

export function getPlaceCategoryMeta(category) {
  const normalizedCategory = normalizePlaceCategory(category)
  return PLACE_CATEGORIES.find(item => item.id === normalizedCategory) ?? null
}

export function getPlaceCategories() {
  return PLACE_CATEGORIES
}
