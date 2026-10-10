const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export function formatClp(amount: number) {
  return clpFormatter.format(amount)
}

export function formatHours(hours: number) {
  return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
}
