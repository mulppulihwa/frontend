import { Building2, Landmark, Store, Tractor, Wallet } from 'lucide-react'

const palette = [
  { color: '#076818', bg: '#e8f3e8' },
  { color: '#FFA100', bg: '#fff3e0' },
  { color: '#5b6ee1', bg: '#eef0ff' },
  { color: '#0f7f7a', bg: '#e5f5f4' },
  { color: '#8a5a16', bg: '#f8efe2' },
  { color: '#6f42c1', bg: '#f1eafb' },
]

function getIcon(category = '') {
  if (category.includes('농자재') || category.includes('농기계')) return Tractor
  if (category.includes('지원금') || category.includes('화폐')) return Wallet
  if (category.includes('농협')) return Landmark
  if (category.includes('행정')) return Building2
  return Store
}

export function getPlaceCategoryMeta(category, index = 0) {
  const safeIndex = Math.max(0, index)
  const tone = palette[safeIndex % palette.length]
  return {
    id: category,
    label: category || '기타',
    icon: getIcon(category),
    ...tone,
  }
}

export function getPlaceCategories(places) {
  return Array.from(new Set(places.map(place => place.category).filter(Boolean)))
    .map((category, index) => getPlaceCategoryMeta(category, index))
}
