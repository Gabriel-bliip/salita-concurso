import type { Amenity, AmenityId } from '../types/index.ts'

export const AMENITIES: Amenity[] = [
  { id: 'wifi', label: 'Wi-Fi de alta velocidad' },
  { id: 'coffee', label: 'Café de grano' },
  { id: 'phone-booth', label: 'Cabina telefónica' },
  { id: 'parking', label: 'Estacionamiento' },
  { id: 'bike-parking', label: 'Bicicletero' },
  { id: 'printer', label: 'Impresora' },
  { id: 'lockers', label: 'Lockers' },
  { id: 'terrace', label: 'Terraza' },
  { id: 'pet-friendly', label: 'Pet friendly' },
]

export const AMENITY_LABELS = Object.fromEntries(
  AMENITIES.map((amenity) => [amenity.id, amenity.label]),
) as Record<AmenityId, string>
