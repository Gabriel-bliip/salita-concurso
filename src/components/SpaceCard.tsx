import type { LucideIcon } from 'lucide-react'
import { DoorClosed, Laptop, Monitor, Presentation, Projector, Users, Video } from 'lucide-react'
import { formatClp, formatHours } from '../lib/format.ts'
import { EQUIPMENT_LABELS, formatCapacity } from '../lib/spaces.ts'
import type { Equipment, Space } from '../types/space.ts'
import { SPACE_DEFINITIONS } from '../data/spaceTypes.ts'
import Button from './Button.tsx'

const SPACE_TYPE_ICONS: Record<string, LucideIcon> = {
  desk: Laptop,
  room: Users,
  office: DoorClosed,
}

const EQUIPMENT_ICONS: Partial<Record<Equipment, LucideIcon>> = {
  screen: Monitor,
  whiteboard: Presentation,
  video_call: Video,
  projector: Projector,
}

// The part of the card that differs per space type.
function SpaceDetails({ space }: { space: Space }) {
  switch (space.type) {
    case 'coworking':
      return (
        <p className="text-sm text-ink-muted">
          1 persona por reserva · {space.deskCount} escritorios en zona compartida
        </p>
      )
    case 'meeting_room':
      return (
        <>
          <p className="text-sm text-ink-muted">{formatCapacity(space)}</p>
          <ul className="flex flex-wrap gap-2" aria-label="Equipamiento">
            {space.equipment.map((item) => {
              const Icon = EQUIPMENT_ICONS[item] ?? Monitor
              return (
                <li
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1 text-xs text-ink"
                >
                  <Icon className="size-3.5 text-primary" aria-hidden />
                  {EQUIPMENT_LABELS[item]}
                </li>
              )
            })}
          </ul>
        </>
      )
    case 'office_box':
      return (
        <p className="text-sm text-ink-muted">
          {formatCapacity(space)} · Oficina cerrada, solo para tu equipo
        </p>
      )
    default:
      return <p className="text-sm text-ink-muted">{formatCapacity(space)}</p>
  }
}

interface SpaceCardProps {
  space: Space
  bookingUrl: string
  actionLabel?: string
  selected?: boolean
}

function SpaceCard({ space, bookingUrl, actionLabel = 'Reservar', selected = false }: SpaceCardProps) {
  const Icon = SPACE_TYPE_ICONS[SPACE_DEFINITIONS[space.type].icon] ?? Users

  return (
    <article
      className={`flex flex-col gap-4 rounded-card border bg-surface p-5 sm:flex-row sm:items-start ${
        selected ? 'border-primary ring-2 ring-primary-soft' : 'border-line'
      }`}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="flex flex-1 flex-col gap-2">
        <h4 className="font-semibold text-ink">{space.name}</h4>
        <p className="text-sm text-ink">{space.description}</p>
        <SpaceDetails space={space} />
      </div>
      <div className="flex flex-col gap-2 sm:items-end sm:text-right">
        <p>
          <span className="text-lg font-semibold text-primary">{formatClp(space.pricePerHour)}</span>{' '}
          <span className="text-sm text-ink-muted">por hora</span>
        </p>
        <p className="text-xs text-ink-muted">Mínimo {formatHours(space.minHours)}</p>
        <Button to={bookingUrl} variant={selected ? 'secondary' : 'primary'} className="mt-1">
          {selected ? 'Seleccionado · Continuar' : actionLabel}
        </Button>
      </div>
    </article>
  )
}

export default SpaceCard
