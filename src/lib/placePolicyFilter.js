function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '')
}

function policyTerms(policy) {
  const values = [
    policy?.title,
    policy?.summary,
    policy?.subtitle,
    policy?.benefit_type,
    policy?.benefitType,
    policy?.amount_text,
    policy?.agency,
    ...(Array.isArray(policy?.reasons) ? policy.reasons : []),
    ...(Array.isArray(policy?.occupation_tags) ? policy.occupation_tags : []),
  ]

  return values.map(normalizeText).filter(Boolean)
}

export function isPlaceRelatedToPolicy(place, policy) {
  if (!policy) return true

  const tags = Array.isArray(place?.subsidy_tags) ? place.subsidy_tags : []
  if (tags.length === 0) return false

  const terms = policyTerms(policy)
  if (terms.length === 0) return false

  return tags.some(tag => {
    const normalizedTag = normalizeText(tag)
    return normalizedTag && terms.some(term => term.includes(normalizedTag) || normalizedTag.includes(term))
  })
}

export function filterPlacesByPolicy(places, policy) {
  return policy ? places.filter(place => isPlaceRelatedToPolicy(place, policy)) : places
}
