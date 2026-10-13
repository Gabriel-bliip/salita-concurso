import { Building2 } from 'lucide-react'
import type { Cowork } from '../types/index.ts'

interface CoworkImageProps {
  cowork: Cowork
  className?: string
}

function CoworkImage({ cowork, className = '' }: CoworkImageProps) {
  const [image] = cowork.images

  if (image) {
    return <img src={image} alt={cowork.name} className={`object-cover ${className}`} />
  }

  // Placeholder until real photos are added to the mock data.
  return (
    <div
      className={`flex items-center justify-center bg-linear-to-br from-primary-soft to-sunken ${className}`}
    >
      <Building2 className="size-12 text-primary/40" aria-hidden />
    </div>
  )
}

export default CoworkImage
