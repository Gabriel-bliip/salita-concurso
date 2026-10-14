import type { Space } from './space.ts'
import type { CategoryId } from '../data/categories.ts'
import type { AmenityId } from '../data/amenities.ts'
export type { AmenityId } from '../data/amenities.ts'

export const COMUNA_OPTIONS = [
  'Santiago Centro', 'Providencia', 'Las Condes', 'Ñuñoa', 'Vitacura', 'Lo Barnechea',
] as const
export type Comuna = typeof COMUNA_OPTIONS[number]

export interface Amenity {
  id: AmenityId
  label: string
}

// 0 = Sunday … 6 = Saturday, matching Date.getDay().
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

// Whole hours, e.g. { open: 8, close: 20 } = 8:00–20:00. null = closed that day.
export type OpeningHours = Record<Weekday, { open: number; close: number } | null>

export interface SpaceLocation {
  id: string
  categoryId: CategoryId
  // Optional category-specific data; only populate attributes verified for the location.
  attributes?: Record<string, string | number | boolean | readonly string[]>
  slug: string
  name: string
  comuna: Comuna
  // Dirección visible en la ficha y el mapa. Mantenerla alineada con location.
  address: string
  // UBICACIÓN DEL MARCADOR: grados decimales WGS84, latitud y luego longitud.
  location: { latitude: number; longitude: number }
  description: string
  contact?: { email?: string; phone?: string; website?: string }
  amenityIds: AmenityId[]
  openingHours: OpeningHours
  rules: string[]
  // Empty until real photos are available; cards fall back to a placeholder.
  // images[0] is also the map bubble cover (see docs/ubicaciones.md).
  images: string[]
  // One caption per photo slot; used as alt text and on placeholders.
  photoCaptions: string[]
  spaces: Space[]
}

// Compatibility with the existing cards, map and booking flow.
export type Cowork = SpaceLocation
