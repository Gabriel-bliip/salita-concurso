import { ArrowUpRight, Shapes } from 'lucide-react'
import { Link } from 'react-router'
import type { Category } from '../data/categories.ts'

function CategoryCard({ category }: { category: Category }) {
  const Icon = category.icon ?? Shapes

  return (
    <Link to={`/espacios/${category.id}`} className="group flex aspect-square flex-col overflow-hidden rounded-card border border-line bg-surface transition hover:border-primary hover:shadow-card focus-visible:border-primary">
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-sunken">
        <span className="absolute size-48 rounded-full border border-line-strong/15" aria-hidden />
        <span className="flex size-20 items-center justify-center rounded-full bg-surface text-primary transition group-hover:bg-primary-soft">
          <Icon className="size-9" strokeWidth={1.5} aria-hidden />
        </span>
        {category.cover && <img src={category.cover.src} alt={category.cover.alt ?? ''} loading="lazy" className="absolute inset-0 size-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} />}
      </div>
      <div className="flex min-h-20 items-center justify-between gap-2 p-4 sm:p-5">
        <h2 className="text-base font-semibold group-hover:text-primary sm:text-lg">{category.name}</h2>
        <ArrowUpRight className="size-5 shrink-0 text-primary" aria-hidden />
      </div>
    </Link>
  )
}

export default CategoryCard
