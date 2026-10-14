export const AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi de alta velocidad' },
  { id: 'coffee', label: 'Café de grano' },
  { id: 'phone-booth', label: 'Cabina telefónica' },
  { id: 'parking', label: 'Estacionamiento' },
  { id: 'bike-parking', label: 'Bicicletero' },
  { id: 'printer', label: 'Impresora' },
  { id: 'lockers', label: 'Lockers' },
  { id: 'terrace', label: 'Terraza' },
  { id: 'pet-friendly', label: 'Pet friendly' },
] as const

export type AmenityId = typeof AMENITIES[number]['id']

export function hasAmenity(location: { amenityIds?: readonly string[] }, id: string): boolean {
  return location.amenityIds?.includes(id) ?? false
}

export const AMENITY_LABELS = Object.fromEntries(
  AMENITIES.map((amenity) => [amenity.id, amenity.label]),
) as Record<AmenityId, string>
