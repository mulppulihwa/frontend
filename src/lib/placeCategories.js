import {
  Building2,
  Landmark,
  ShoppingBag,
  UsersRound,
  UtensilsCrossed,
} from 'lucide-react'

export const PLACE_CATEGORIES = [
  {
    id: '행정',
    label: '행정',
    icon: Landmark,
    color: '#076818',
    bg: '#e8f3e8',
  },
  {
    id: '부동산',
    label: '부동산',
    icon: Building2,
    color: '#0f7f7a',
    bg: '#e5f5f4',
  },
  {
    id: '동호회',
    label: '동호회',
    icon: UsersRound,
    color: '#5b6ee1',
    bg: '#eef0ff',
  },
  {
    id: '맛집',
    label: '맛집',
    icon: UtensilsCrossed,
    color: '#FFA100',
    bg: '#fff3e0',
  },
  {
    id: '생활',
    label: '생활',
    icon: ShoppingBag,
    color: '#e06f3a',
    bg: '#fdf0e8',
  },
]

export function normalizePlaceCategory(category = '') {
  const value = String(category).trim()

  if (value.includes('행정') || value.includes('농협')) {
    return '행정'
  }

  if (value.includes('부동산') || value.includes('건축')) {
    return '부동산'
  }

  if (value.includes('동호회')) {
    return '동호회'
  }

  if (value.includes('맛집') || value.includes('음식점')) {
    return '맛집'
  }

  if (value.includes('생활')) {
    return '생활'
  }

  return null
}

export function getPlaceCategoryMeta(category) {
  const normalizedCategory = normalizePlaceCategory(category)

  if (!normalizedCategory) {
    return null
  }

  return (
    PLACE_CATEGORIES.find(
      categoryItem => categoryItem.id === normalizedCategory,
    ) ?? null
  )
}

export function getPlaceCategories() {
  return PLACE_CATEGORIES
}