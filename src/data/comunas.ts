import type { ComunaRM } from './comunasRM.ts'

// Admin choices and location types use the full RM catalog, including communes
// without listings. Keep this export compatible with existing consumers.
export { COMUNAS_RM as COMUNA_OPTIONS } from './comunasRM.ts'
export type Comuna = ComunaRM

// Public/admin listing filters derive their options from records, not the catalog.
export function getLocationComunas(locations: readonly { comuna: Comuna }[]): Comuna[] {
  return [...new Set(locations.map(({ comuna }) => comuna))]
}
