import { Search } from 'lucide-react'

export default function SearchAnimation() {
  return (
    <div className="support-search-animation" aria-hidden="true">
      <div className="moving-search-stage">
        <div className="moving-search-icon">
          <Search size={28} color="#fff" strokeWidth={2.6} />
        </div>
      </div>
    </div>
  )
}
