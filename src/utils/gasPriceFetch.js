const EIA_BASE =
  'https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=xI8f5dCEIevB4PTyk4hvb4gsoQ0UOc92ciqedgb0' +
  '&frequency=weekly&data%5B0%5D=value' +
  '&sort%5B0%5D%5Bcolumn%5D=period&sort%5B0%5D%5Bdirection%5D=desc&length=1'

const PRODUCT_CODES = { regular: 'EPM0', premium: 'EPM2', diesel: 'EPD2D' }

// Georgia-specific fallbacks (GA has lower state gas tax than the broader Lower Atlantic region)
export const GAS_PRICE_FALLBACKS = { regular: 3.25, premium: 3.75, diesel: 3.50 }

// Tries Georgia state-level data (SGA) first, falls back to Lower Atlantic region (R1Z)
export async function fetchGasPrice(grade) {
  const product = `&facets%5Bproduct%5D%5B%5D=${PRODUCT_CODES[grade]}`
  try {
    for (const area of ['SGA', 'R1Z']) {
      const r = await fetch(`${EIA_BASE}&facets%5Bduoarea%5D%5B%5D=${area}${product}`)
      const d = await r.json()
      const v = parseFloat(d?.response?.data?.[0]?.value)
      if (!isNaN(v)) return v
    }
    return null
  } catch { return null }
}

export async function fetchAllGasPrices() {
  const [reg, prem, dies] = await Promise.all(
    ['regular', 'premium', 'diesel'].map(fetchGasPrice)
  )
  const r = reg  ?? GAS_PRICE_FALLBACKS.regular
  const p = prem ?? (r + 0.50)
  const d = dies ?? (r + 0.30)
  return {
    prices: {
      regular: +r.toFixed(3),
      premium: +p.toFixed(3),
      diesel:  +d.toFixed(3),
    },
    live: reg != null,
  }
}
