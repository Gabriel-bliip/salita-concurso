import type { Comuna, Cowork } from '../types/index.ts'

// Fictional coworks for the demo.
export const COWORKS: Cowork[] = [
  {
    id: 'cw-1',
    slug: 'casa-lastarria',
    name: 'Casa Lastarria',
    comuna: 'Santiago Centro',
    address: 'José Victorino Lastarria 120, Santiago',
    description:
      'Una casona restaurada en pleno barrio Lastarria, con techos altos, luz natural y un patio interior para tomar un respiro entre reuniones.',
    amenityIds: ['wifi', 'coffee', 'meeting-room', 'phone-booth', 'bike-parking', 'terrace'],
    openingHours: 'Lun–Vie 8:00–20:00 · Sáb 10:00–14:00',
    capacity: 45,
    images: [],
  },
  {
    id: 'cw-2',
    slug: 'nodo-moneda',
    name: 'Nodo Moneda',
    comuna: 'Santiago Centro',
    address: 'Agustinas 1050, piso 9, Santiago',
    description:
      'Oficina en altura a pasos de metro La Moneda. Silencioso, con escritorios ergonómicos y vista a la cordillera.',
    amenityIds: ['wifi', 'coffee', 'meeting-room', 'printer', 'lockers'],
    openingHours: 'Lun–Vie 7:30–21:00',
    capacity: 80,
    images: [],
  },
  {
    id: 'cw-3',
    slug: 'patio-italia',
    name: 'Patio Italia',
    comuna: 'Providencia',
    address: 'Av. Italia 1400, Providencia',
    description:
      'Espacio creativo en el barrio Italia, rodeado de cafés y tiendas de diseño. Perfecto para equipos pequeños y freelancers.',
    amenityIds: ['wifi', 'coffee', 'phone-booth', 'bike-parking', 'terrace', 'pet-friendly'],
    openingHours: 'Lun–Vie 8:30–20:00 · Sáb 10:00–15:00',
    capacity: 35,
    images: [],
  },
  {
    id: 'cw-4',
    slug: 'torre-pocuro',
    name: 'Torre Pocuro',
    comuna: 'Providencia',
    address: 'Av. Pocuro 2200, piso 4, Providencia',
    description:
      'Coworking moderno cerca de metro Pedro de Valdivia, con salas de reuniones equipadas y zonas de concentración.',
    amenityIds: ['wifi', 'coffee', 'meeting-room', 'phone-booth', 'parking', 'printer', 'lockers'],
    openingHours: 'Lun–Vie 8:00–21:00',
    capacity: 90,
    images: [],
  },
  {
    id: 'cw-5',
    slug: 'distrito-golf',
    name: 'Distrito Golf',
    comuna: 'Las Condes',
    address: 'Isidora Goyenechea 3000, piso 12, Las Condes',
    description:
      'Espacio ejecutivo en el corazón de Sanhattan. Recepción, salas para clientes y estacionamiento para visitas.',
    amenityIds: ['wifi', 'coffee', 'meeting-room', 'phone-booth', 'parking', 'printer', 'lockers'],
    openingHours: 'Lun–Vie 8:00–20:00',
    capacity: 120,
    images: [],
  },
  {
    id: 'cw-6',
    slug: 'apoquindo-hub',
    name: 'Apoquindo Hub',
    comuna: 'Las Condes',
    address: 'Av. Apoquindo 5400, Las Condes',
    description:
      'Planta abierta con mucha luz, a una cuadra de metro Escuela Militar. Ambiente tranquilo y terraza con vista al cerro.',
    amenityIds: ['wifi', 'coffee', 'meeting-room', 'bike-parking', 'terrace', 'lockers'],
    openingHours: 'Lun–Vie 8:00–20:00 · Sáb 9:00–13:00',
    capacity: 60,
    images: [],
  },
  {
    id: 'cw-7',
    slug: 'plaza-nunoa',
    name: 'Plaza Ñuñoa Studio',
    comuna: 'Ñuñoa',
    address: 'Jorge Washington 300, Ñuñoa',
    description:
      'Un cowork de barrio, a pasos de Plaza Ñuñoa. Comunidad cercana, mascotas bienvenidas y el mejor café de la red.',
    amenityIds: ['wifi', 'coffee', 'phone-booth', 'bike-parking', 'pet-friendly'],
    openingHours: 'Lun–Vie 8:30–19:30 · Sáb 10:00–14:00',
    capacity: 30,
    images: [],
  },
  {
    id: 'cw-8',
    slug: 'alonso-de-cordova',
    name: 'Estudio Alonso',
    comuna: 'Vitacura',
    address: 'Alonso de Córdova 2800, Vitacura',
    description:
      'Espacio boutique entre galerías de arte. Diseño cuidado, salas privadas y terraza para reuniones al aire libre.',
    amenityIds: ['wifi', 'coffee', 'meeting-room', 'phone-booth', 'parking', 'terrace', 'pet-friendly'],
    openingHours: 'Lun–Vie 8:00–19:00',
    capacity: 40,
    images: [],
  },
  {
    id: 'cw-9',
    slug: 'la-dehesa-work',
    name: 'Dehesa Work',
    comuna: 'Lo Barnechea',
    address: 'Av. La Dehesa 1200, Lo Barnechea',
    description:
      'Trabaja cerca de casa sin bajar a la ciudad. Amplio estacionamiento, cabinas para videollamadas y lockers personales.',
    amenityIds: ['wifi', 'coffee', 'meeting-room', 'phone-booth', 'parking', 'lockers'],
    openingHours: 'Lun–Vie 8:00–20:00',
    capacity: 50,
    images: [],
  },
]

export const COMUNAS: Comuna[] = [...new Set(COWORKS.map((cowork) => cowork.comuna))]
