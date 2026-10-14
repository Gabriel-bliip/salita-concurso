import type { LucideIcon } from 'lucide-react'
import type { AmenityId } from './index.ts'
import type { SpaceType } from './space.ts'

export interface AttributeFilter {
  id: string
  label: string
  options: readonly { value: string; label: string }[]
}

export type CategoryAttribute = {
  id: string
  label: string
  required?: boolean
  example?: string
} & (
  | { type: 'text' }
  | { type: 'number'; min?: number; max?: number; integer?: boolean }
  | { type: 'boolean' }
  | { type: 'select' | 'multiselect'; options: AttributeFilter['options']; filter?: boolean }
)

export interface CategoryFilters {
  spaceTypes?: readonly SpaceType[]
  people?: readonly number[]
  comuna?: boolean
  amenityIds?: readonly AmenityId[]
  // Multiple selections require all selected values on the location.
  attributes?: readonly AttributeFilter[]
}

export interface CategoryDefinition {
  id: string
  name: string
  cover?: { src: string; alt?: string }
  icon?: LucideIcon
  attributes?: readonly CategoryAttribute[]
  filters: CategoryFilters
}
