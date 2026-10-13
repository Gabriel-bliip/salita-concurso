import type { Space } from './space.ts'

export type Comuna =
  | 'Santiago Centro'
  | 'Providencia'
  | 'Las Condes'
  | 'Ñuñoa'
  | 'Vitacura'
  | 'Lo Barnechea'

export type AmenityId =
  | 'wifi'
  | 'coffee'
  | 'phone-booth'
  | 'parking'
  | 'bike-parking'
  | 'printer'
  | 'lockers'
  | 'terrace'
  | 'pet-friendly'

export interface Amenity {
  id: AmenityId
  label: string
}

// 0 = Sunday … 6 = Saturday, matching Date.getDay().
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

// Whole hours, e.g. { open: 8, close: 20 } = 8:00–20:00. null = closed that day.
export type OpeningHours = Record<Weekday, { open: number; close: number } | null>

export interface Cowork {
  id: string
  slug: string
  name: string
  comuna: Comuna
  // Dirección visible en la ficha y el mapa. Mantenerla alineada con location.
  address: string
  // UBICACIÓN DEL MARCADOR: grados decimales WGS84, latitud y luego longitud.
  location: { latitude: number; longitude: number }
  description: string
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
