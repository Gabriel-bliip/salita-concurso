import { ArrowLeft, Clock, MapPin, Users } from 'lucide-react'
import { Link, useParams } from 'react-router'
import AmenityBadge from '../components/AmenityBadge.tsx'
import CoworkCard from '../components/CoworkCard.tsx'
import CoworkImage from '../components/CoworkImage.tsx'
import { COWORKS } from '../data/coworks.ts'
import NotFoundPage from './NotFoundPage.tsx'

const MAX_RELATED_COWORKS = 3

function CoworkDetailPage() {
  const { slug } = useParams()
  const cowork = COWORKS.find((item) => item.slug === slug)

  if (!cowork) {
    return <NotFoundPage message="Este cowork no existe o ya no forma parte de la red." />
  }

  // Same comuna first, then the rest of the network.
  const relatedCoworks = COWORKS.filter((item) => item.id !== cowork.id)
    .sort((a, b) => Number(b.comuna === cowork.comuna) - Number(a.comuna === cowork.comuna))
    .slice(0, MAX_RELATED_COWORKS)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/coworks"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a coworks
      </Link>

      <CoworkImage cowork={cowork} className="mt-6 aspect-[21/9] w-full rounded-3xl" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {cowork.name}
          </h1>
          <p className="mt-3 flex items-center gap-1.5 text-slate-600">
            <MapPin className="size-5 shrink-0" aria-hidden />
            {cowork.address} · {cowork.comuna}
          </p>
          <p className="mt-6 text-lg leading-relaxed text-slate-700">{cowork.description}</p>

          <h2 className="mt-10 text-xl font-semibold text-slate-900">Servicios</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {cowork.amenityIds.map((amenityId) => (
              <AmenityBadge key={amenityId} amenityId={amenityId} />
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-5 self-start rounded-2xl border border-slate-200 p-6 lg:sticky lg:top-24">
          <div className="flex gap-3">
            <Clock className="size-5 shrink-0 text-brand-600" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-slate-900">Horario</p>
              <p className="text-sm text-slate-600">{cowork.openingHours}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Users className="size-5 shrink-0 text-brand-600" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-slate-900">Capacidad</p>
              <p className="text-sm text-slate-600">{cowork.capacity} personas</p>
            </div>
          </div>
          <p className="border-t border-slate-200 pt-5 text-sm text-slate-600">
            Sin planes ni suscripciones: pagas solo por las horas que reservas. Las reservas en
            línea estarán disponibles pronto.
          </p>
        </aside>
      </div>

      <section className="mt-20">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Otros coworks</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {relatedCoworks.map((item) => (
            <CoworkCard key={item.id} cowork={item} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default CoworkDetailPage
