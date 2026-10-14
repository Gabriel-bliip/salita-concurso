import { number, text, choice, option } from '../lib/fields.ts'
import type { FormField } from '../lib/fields.ts'

export const EQUIPMENT_LABELS = {
  screen: 'Pantalla', whiteboard: 'Pizarra', video_call: 'Equipo de videollamada', projector: 'Proyector',
}
export type Equipment = keyof typeof EQUIPMENT_LABELS

export const SPACE_FIELDS = {
  name: text('Nombre del espacio reservable'),
  description: text('Descripción del espacio reservable'),
  pricePerHour: number('Precio por hora (CLP)', 0, Number.MAX_SAFE_INTEGER),
  minHours: number('Mínimo de horas por reserva', 1, 24),
}

// IDs, fields, creation defaults, capacity and availability live together.
// Existing JSON shapes remain unchanged; dot paths describe nested capacity fields.
export const SPACE_DEFINITIONS = {
  coworking: {
    label: 'Escritorio compartido', plural: 'Escritorios compartidos', icon: 'desk', takenPercent: 15,
    defaults: { capacity: 1 as const, deskCount: 1 },
    fields: { deskCount: number('Cantidad de escritorios', 1, Number.MAX_SAFE_INTEGER) },
    getCapacity: () => ({ min: 1, max: 1 }),
  },
  meeting_room: {
    label: 'Sala de reuniones', plural: 'Salas de reuniones', icon: 'room', takenPercent: 30,
    defaults: { capacity: { min: 1, max: 2 }, equipment: [] as Equipment[] },
    fields: {
      'capacity.min': number('Capacidad mínima', 1, Number.MAX_SAFE_INTEGER),
      'capacity.max': number('Capacidad máxima', 1, Number.MAX_SAFE_INTEGER),
      equipment: choice('Equipamiento', Object.entries(EQUIPMENT_LABELS).map(([id, label]) => option(id, label)), false, true),
    },
    getCapacity: (space: { capacity: number | { min: number; max: number } }) => {
      if (typeof space.capacity !== 'object' || !space.capacity) throw new Error('Capacidad de sala inválida.')
      return space.capacity
    },
  },
  office_box: {
    label: 'Oficina privada', plural: 'Oficinas privadas', icon: 'office', takenPercent: 25,
    defaults: { capacity: 2 as 2 | 3 | 4 | 5 | 6 },
    fields: { capacity: number('Capacidad de la oficina', 2, 6) },
    getCapacity: (space: { capacity: number | { min: number; max: number } }) => ({ min: 1, max: typeof space.capacity === 'number' ? space.capacity : NaN }),
  },
}
export type SpaceType = keyof typeof SPACE_DEFINITIONS
export const SPACE_TYPES = Object.keys(SPACE_DEFINITIONS) as SpaceType[]
export function spaceFields(type: SpaceType): Record<string, FormField> {
  return { ...SPACE_FIELDS, ...SPACE_DEFINITIONS[type].fields }
}
