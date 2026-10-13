import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

function CategoryBackLink() {
  return (
    <Link to="/espacios" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-primary">
      <ArrowLeft className="size-4" aria-hidden /> Todas las categorías
    </Link>
  )
}

export default CategoryBackLink
