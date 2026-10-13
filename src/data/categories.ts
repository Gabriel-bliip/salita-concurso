import { AMENITIES } from './amenities.ts'
import { SPACE_TYPES } from '../lib/spaces.ts'
import type { CategoryDefinition } from '../types/category.ts'

// The only category registry: IDs also define routes and the location type.
const definitions = [
  {
    id: 'cowork',
    name: 'Cowork',
    filters: {
      spaceTypes: SPACE_TYPES,
      people: [1, 2, 4, 6, 8, 10, 12],
      comuna: true,
      amenityIds: AMENITIES.map(({ id }) => id),
    },
  },
  { id: 'taller-musica', name: 'Taller de música', filters: { comuna: true } },
  { id: 'taller-arte', name: 'Taller de arte', filters: { comuna: true } },
  { id: 'sala-terapia', name: 'Sala de terapia', filters: { comuna: true } },
  { id: 'salon-eventos', name: 'Salón de eventos', filters: { comuna: true } },
  { id: 'sala-reuniones', name: 'Sala de reuniones', filters: { comuna: true } },
  { id: 'estudio-fotografico', name: 'Estudio fotográfico', filters: { comuna: true } },
  { id: 'sala-ensayo', name: 'Sala de ensayo', filters: { comuna: true } },
  { id: 'aula-formacion', name: 'Aula de formación', filters: { comuna: true } },
] as const satisfies readonly CategoryDefinition[]

export type CategoryId = typeof definitions[number]['id']
export type Category = Omit<CategoryDefinition, 'id'> & { id: CategoryId }

export const CATEGORIES: readonly Category[] = definitions
export const COWORK_CATEGORY: Category = CATEGORIES[0]

export function getCategory(id: string) {
  return CATEGORIES.find((category) => category.id === id)
}
