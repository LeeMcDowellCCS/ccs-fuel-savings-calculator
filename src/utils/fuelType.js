// Returns 'regular', 'premium', or 'diesel' for a given gas vehicle
export function getFuelType({ make, model, trim = '' }) {
  const t = trim.toLowerCase()

  // Diesel — check trim first (covers all makes)
  if (/diesel|duramax|powerstroke|cummins|ecodiesel|bluetec|tdi|3\.0d|6\.7l cummins/i.test(t)) return 'diesel'

  // Makes that universally require premium in the US market
  if (['BMW', 'Mercedes-Benz', 'Audi', 'Porsche', 'Volvo', 'Maserati', 'Alfa Romeo'].includes(make)) return 'premium'

  // Make/model-specific rules
  switch (make) {
    case 'Lexus':
      return ['IS', 'LC', 'LS', 'LX', 'GX', 'RC'].includes(model) ? 'premium' : 'regular'

    case 'Cadillac':
      if (['Escalade'].includes(model)) return 'premium'
      if (model === 'CT5') return 'premium'
      if (/blackwing|v-series/i.test(t)) return 'premium'
      return 'regular'

    case 'Infiniti':
      if (model === 'Q60' || model === 'QX80') return 'premium'
      if (/red sport/i.test(t)) return 'premium'
      return 'regular'

    case 'Acura':
      if (model === 'NSX') return 'premium'
      if (/type[\s-]?s/i.test(t)) return 'premium'
      return 'regular'

    case 'Genesis':
      if (model === 'G90') return 'premium'
      if (/3\.5t|5\.0v/i.test(t)) return 'premium'
      return 'regular'

    case 'Lincoln':
      if (['Navigator', 'Aviator'].includes(model)) return 'premium'
      return 'regular'

    case 'Chevrolet':
      if (model === 'Corvette') return 'premium'
      if (/zl1|z06/i.test(t)) return 'premium'
      return 'regular'

    case 'Ford':
      if (/gt500|shelby/i.test(t)) return 'premium'
      return 'regular'

    default:
      return 'regular'
  }
}

export const FUEL_LABELS = { regular: 'Regular', premium: 'Premium', diesel: 'Diesel' }
export const FUEL_COLORS = {
  regular: 'text-gray-300 bg-gray-800',
  premium: 'text-amber-400 bg-amber-900/30 border-amber-700',
  diesel:  'text-blue-400 bg-blue-900/30 border-blue-700',
}
