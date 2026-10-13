import type { Equipment, Space, SpaceType } from '../types/space.ts'

export const SPACE_TYPES: SpaceType[] = ['coworking', 'meeting_room', 'office_box']

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  coworking: 'Escritorio compartido',
  meeting_room: 'Sala de reuniones',
  office_box: 'Oficina privada',
}

export const SPACE_TYPE_PLURAL_LABELS: Record<SpaceType, string> = {
  coworking: 'Escritorios compartidos',
  meeting_room: 'Salas de reuniones',
  office_box: 'Oficinas privadas',
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  screen: 'Pantalla',
  whiteboard: 'Pizarra',
  video_call: 'Equipo de videollamada',
  projector: 'Proyector',
}

// How many people a single booking of this space can include.
export function getCapacityRange(space: Space) {
  switch (space.type) {
    case 'coworking':
      return { min: 1, max: 1 }
    case 'meeting_room':
      return space.capacity
    case 'office_box':
      return { min: 1, max: space.capacity }
  }
}

export function formatCapacity(space: Space) {
  const { min, max } = getCapacityRange(space)
  if (max === 1) return '1 persona'
  if (space.type === 'office_box') return `Hasta ${max} personas`
  return `${min}–${max} personas`
}

export function getLowestPrice(spaces: Space[]) {
  return Math.min(...spaces.map((space) => space.pricePerHour))
}
