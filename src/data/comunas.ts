// Communes that locations can be in. Extend this list to add locations in a new commune.
export const COMUNA_OPTIONS = [
  'Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'Vitacura', 'Lo Barnechea',
] as const
export type Comuna = typeof COMUNA_OPTIONS[number]
