import { Building2 } from 'lucide-react'
import type { Comuna, Cowork } from '../types/index.ts'

// Placeholder gradients until real photos are added to the mock data.
const comunaGradients: Record<Comuna, string> = {
  'Santiago Centro': 'from-amber-200 to-orange-300',
  Providencia: 'from-teal-200 to-emerald-300',
  'Las Condes': 'from-sky-200 to-indigo-300',
  Ñuñoa: 'from-rose-200 to-pink-300',
  Vitacura: 'from-violet-200 to-purple-300',
  'Lo Barnechea': 'from-lime-200 to-green-300',
}

interface CoworkImageProps {
  cowork: Cowork
  className?: string
}

function CoworkImage({ cowork, className = '' }: CoworkImageProps) {
  const [image] = cowork.images

  if (image) {
    return <img src={image} alt={cowork.name} className={`object-cover ${className}`} />
  }

  return (
    <div
      className={`flex items-center justify-center bg-linear-to-br ${comunaGradients[cowork.comuna]} ${className}`}
    >
      <Building2 className="size-12 text-white/80" aria-hidden />
    </div>
  )
}

export default CoworkImage
