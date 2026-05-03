import { useState, useEffect } from 'react'
import { getFuelType, FUEL_LABELS, FUEL_COLORS } from '../utils/fuelType'

const API_BASE =
  'https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=xI8f5dCEIevB4PTyk4hvb4gsoQ0UOc92ciqedgb0' +
  '&frequency=weekly&data%5B0%5D=value&facets%5Bduoarea%5D%5B%5D=R1Z' +
  '&sort%5B0%5D%5Bcolumn%5D=period&sort%5B0%5D%5Bdirection%5D=desc&length=1'

const PRODUCT_CODES = { regular: 'EPM0', premium: 'EPM2', diesel: 'EPD2D' }
const FALLBACKS      = { regular: 3.10,  premium: 3.60,  diesel: 3.40  }

async function fetchGrade(grade) {
  try {
    const r = await fetch(`${API_BASE}&facets%5Bproduct%5D%5B%5D=${PRODUCT_CODES[grade]}`)
    const d = await r.json()
    const v = parseFloat(d?.response?.data?.[0]?.value)
    return isNaN(v) ? null : v
  } catch { return null }
}

export default function GasPrice({ gasVehicle, onPriceChange }) {
  const [prices,  setPrices]       = useState(null)
  const [grade,   setGrade]        = useState('regular')
  const [override, setOverride]    = useState(null)
  const [status,  setStatus]       = useState('loading')
  const [autoGrade, setAutoGrade]  = useState(null)

  // Fetch all three grades on mount
  useEffect(() => {
    Promise.all(['regular','premium','diesel'].map(fetchGrade)).then(([reg, prem, dies]) => {
      const r = reg  ?? FALLBACKS.regular
      const p = prem ?? (r + 0.50)
      const d = dies ?? (r + 0.30)
      setPrices({ regular: +r.toFixed(3), premium: +p.toFixed(3), diesel: +d.toFixed(3) })
      setStatus(reg != null ? 'live' : 'fallback')
    })
  }, [])

  useEffect(() => {
    if (!gasVehicle) return
    const detected = getFuelType(gasVehicle)
    setAutoGrade(detected)
    setGrade(detected)
    setOverride(null)
  }, [gasVehicle])

  useEffect(() => {
    if (!prices) return
    const effective = override ?? prices[grade]
    onPriceChange(effective)
  }, [prices, grade, override])

  const handleGradeClick = (g) => {
    setGrade(g)
    setOverride(null)
  }

  const displayPrice = override != null ? override : (prices ? prices[grade] : '')

  return (
    <div className="card">
      <h2 className="section-title flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">4</span>
        Georgia Gas Price
      </h2>

      {/* Grade tabs */}
      <div className="flex gap-2 mb-4">
        {(['regular','premium','diesel']).map(g => (
          <button
            key={g}
            onClick={() => handleGradeClick(g)}
            className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
              grade === g
                ? 'border-ccs-red bg-red-950/50 text-ccs-red'
                : 'border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            {FUEL_LABELS[g]}
            {prices && <span className="block text-base font-bold mt-0.5">${prices[g].toFixed(2)}</span>}
          </button>
        ))}
      </div>

      {/* Auto-detected badge */}
      {autoGrade && autoGrade !== 'regular' && (
        <div className={`text-xs font-medium px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5 mb-3 ${FUEL_COLORS[autoGrade]}`}>
          <span>★</span>
          {autoGrade === 'premium' ? 'This vehicle recommends premium fuel' : 'This vehicle uses diesel'}
          {grade !== autoGrade && (
            <button onClick={() => handleGradeClick(autoGrade)} className="underline ml-1">
              Switch back
            </button>
          )}
        </div>
      )}

      {/* Price input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="section-label">Price Per Gallon — {FUEL_LABELS[grade]}</label>
          {status === 'live' && (
            <span className="text-xs text-green-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Live GA Avg
            </span>
          )}
          {status === 'fallback' && <span className="text-xs text-amber-400 font-medium">Est.</span>}
          {status === 'loading' && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block animate-pulse" />
              Loading…
            </span>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input-field pl-7"
            value={displayPrice}
            onChange={e => {
              const v = e.target.value
              setOverride(v === '' ? null : parseFloat(v))
            }}
            placeholder={prices ? prices[grade].toFixed(2) : '3.10'}
          />
        </div>
        {override != null && (
          <button
            className="text-xs text-ccs-red mt-1 hover:underline"
            onClick={() => setOverride(null)}
          >
            Reset to live price
          </button>
        )}
      </div>
    </div>
  )
}
