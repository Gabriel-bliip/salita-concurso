import type { Cowork } from '../types/index.ts'

// Geocoded street address; shared by every entry without a location.
export const DEFAULT_LOCATION = {
  address: 'Suecia 810, Providencia, Santiago de Chile',
  comuna: 'Providencia' as const,
  location: { latitude: -33.421795865179, longitude: -70.607290416391 },
}

type CoworkInput = Omit<Cowork, 'address' | 'location'> &
  Partial<Pick<Cowork, 'address' | 'location'>>

export function withLocation(cowork: CoworkInput): Cowork {
  const position = cowork.location
  const validPosition = position && Number.isFinite(position.latitude) &&
    Number.isFinite(position.longitude) && Math.abs(position.latitude) <= 90 &&
    Math.abs(position.longitude) <= 180

  if (!cowork.address?.trim() || !validPosition) {
    return { ...cowork, ...DEFAULT_LOCATION }
  }
  return { ...cowork, address: cowork.address.trim(), location: position }
}
