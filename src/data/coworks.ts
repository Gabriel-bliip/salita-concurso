import type { Comuna, SpaceLocation } from '../types/index.ts'
import { withLocation } from '../lib/location.ts'
import entries from './locations.json' with { type: 'json' }

// Single static source, also written by npm run spaces:add.
// Preserve normalization of legacy records and all existing consumers.
export const LOCATIONS: SpaceLocation[] = (entries as Parameters<typeof withLocation>[0][]).map(withLocation)
export const COWORKS = LOCATIONS.filter(({ categoryId }) => categoryId === 'cowork')
export const COMUNAS: Comuna[] = [...new Set(COWORKS.map((cowork) => cowork.comuna))]
