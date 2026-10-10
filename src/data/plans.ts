import type { Plan } from '../types/index.ts'

export const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    monthlyHours: 20,
    priceClp: 49990,
    description: 'Para quienes trabajan desde un cowork un par de veces por semana.',
    features: [
      '20 horas al mes',
      'Acceso a todos los coworks de la red',
      'Wi-Fi y café incluidos',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyHours: 50,
    priceClp: 99990,
    description: 'Ideal para freelancers y trabajo híbrido.',
    features: [
      '50 horas al mes',
      'Acceso a todos los coworks de la red',
      '4 horas de sala de reuniones',
      'Las horas no usadas pasan al mes siguiente',
    ],
    highlighted: true,
  },
  {
    id: 'full',
    name: 'Full',
    monthlyHours: 100,
    priceClp: 169990,
    description: 'Para quienes hacen del cowork su oficina.',
    features: [
      '100 horas al mes',
      'Acceso a todos los coworks de la red',
      '10 horas de sala de reuniones',
      'Las horas no usadas pasan al mes siguiente',
      'Invita a un acompañante 2 veces al mes',
    ],
  },
]
