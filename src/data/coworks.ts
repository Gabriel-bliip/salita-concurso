import type { Comuna, SpaceLocation } from '../types/index.ts'
import { withLocation } from '../lib/location.ts'
import { getLocationComunas } from './comunas.ts'
import entries from './locations.json' with { type: 'json' }

// Single static source, written by the local administrator.
// Preserve normalization of legacy records and all existing consumers.
export const LOCATIONS: SpaceLocation[] = (entries as Parameters<typeof withLocation>[0][]).map(withLocation)
export const COWORKS = LOCATIONS.filter(({ categoryId }) => categoryId === 'cowork')
export const COMUNAS: Comuna[] = getLocationComunas(COWORKS)
