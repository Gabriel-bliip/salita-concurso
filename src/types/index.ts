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
  | 'meeting-room'
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

export interface Plan {
  id: string
  name: string
  monthlyHours: number
  priceClp: number
  description: string
  features: string[]
  highlighted?: boolean
}

export interface Cowork {
  id: string
  slug: string
  name: string
  comuna: Comuna
  address: string
  location: { latitude: number; longitude: number }
  description: string
  amenityIds: AmenityId[]
  openingHours: string
  capacity: number
  // Empty until real photos are available; cards fall back to a placeholder.
  images: string[]
}
