import { FileSearch } from 'lucide-react'

export default function SearchAnimation({ compact = false }) {
  return (
    <div className={`support-search-animation${compact ? ' support-search-animation--compact' : ''}`} aria-hidden="true">
      <div className="analysis-visual">
        <div className="analysis-card analysis-card-one" />
        <div className="analysis-card analysis-card-two" />
        <div className="analysis-card analysis-card-three" />
        <div className="analysis-search-icon">
          <FileSearch size={30} color="#076818" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  )
}
