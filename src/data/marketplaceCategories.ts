import { Laptop, Users } from 'lucide-react'
import { getCategory } from './categories.ts'
import type { Category } from './categories.ts'

// Public demo presentation only; the full registry and legacy routes remain available.
export const MARKETPLACE_CATEGORIES: readonly Category[] = [
  { ...getCategory('cowork')!, name: 'Coworks', icon: Laptop },
  { ...getCategory('sala-reuniones')!, name: 'Salas de reuniones', icon: Users },
]
