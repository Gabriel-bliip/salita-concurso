export interface PriceBreakdown {
  hours: number
  pricePerHour: number
  subtotal: number
  total: number
}

// The only place a booking price is calculated: total = hours × price per hour.
// Platform commission and cancellation policy are NOT decided yet. When they are,
// add them here so every screen (summary, payment, confirmation) picks them up.
export function calculateBookingPrice({
  pricePerHour,
  hours,
}: {
  pricePerHour: number
  hours: number
}): PriceBreakdown {
  const subtotal = pricePerHour * hours
  return { hours, pricePerHour, subtotal, total: subtotal }
}
