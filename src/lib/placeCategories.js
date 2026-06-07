import {
  Armchair, Building2, Hammer, Landmark, Pill, Shirt,
  ShoppingBasket, Smartphone, Store, Tractor, UtensilsCrossed, Wallet,
} from 'lucide-react'

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
  if (category.includes('음식점')) return UtensilsCrossed
  if (category.includes('약국')) return Pill
  if (category.includes('건축')) return Hammer
  if (category.includes('의류')) return Shirt
  if (category.includes('식품')) return ShoppingBasket
  if (category.includes('전자')) return Smartphone
  if (category.includes('가구')) return Armchair
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
