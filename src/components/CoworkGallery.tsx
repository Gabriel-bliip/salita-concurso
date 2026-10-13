import { Image } from 'lucide-react'
import type { Cowork } from '../types/index.ts'

// First photo large, the rest beside it. Slots without a real image show a captioned placeholder.
function CoworkGallery({ cowork }: { cowork: Cowork }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:grid-rows-2">
      {cowork.photoCaptions.map((caption, index) => {
        const image = cowork.images[index]
        const sizeClass = index === 0 ? 'col-span-2 aspect-[16/10] sm:row-span-2 sm:aspect-auto' : 'aspect-[4/3] sm:aspect-[16/10]'
        return image ? (
          <img
            key={caption}
            src={image}
            alt={caption}
            className={`h-full w-full rounded-card object-cover ${sizeClass}`}
          />
        ) : (
          <figure
            key={caption}
            className={`flex flex-col items-center justify-center gap-2 rounded-card bg-linear-to-br from-primary-soft to-sunken p-4 text-center ${sizeClass}`}
          >
            <Image className="size-8 text-primary/40" aria-hidden />
            <figcaption className="text-sm text-ink-muted">
              {caption}
              <span className="block text-xs">Foto próximamente</span>
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}

export default CoworkGallery
