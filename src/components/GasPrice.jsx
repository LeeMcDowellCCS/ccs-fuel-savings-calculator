import { useState, useEffect } from 'react'

const GA_FALLBACK = 3.10
// EIA doesn't track Georgia individually — Lower Atlantic (PADD 1C) is the closest regional proxy
const EIA_URL =
  'https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=xI8f5dCEIevB4PTyk4hvb4gsoQ0UOc92ciqedgb0&frequency=weekly&data%5B0%5D=value&facets%5Bduoarea%5D%5B%5D=R1Z&facets%5Bproduct%5D%5B%5D=EPM0&sort%5B0%5D%5Bcolumn%5D=period&sort%5B0%5D%5Bdirection%5D=desc&length=1'

export default function GasPrice({ onPriceChange }) {
  const [price, setPrice] = useState('')
  const [source, setSource] = useState('loading')

  useEffect(() => {
    fetch(EIA_URL)
      .then(r => r.json())
      .then(data => {
        const val = data?.response?.data?.[0]?.value
        if (val != null && !isNaN(parseFloat(val))) {
          const p = parseFloat(val).toFixed(2)
          setPrice(p)
          setSource('live')
          onPriceChange(parseFloat(p))
        } else {
          throw new Error('No data')
        }
      })
      .catch(() => {
        setPrice(GA_FALLBACK.toFixed(2))
        setSource('fallback')
        onPriceChange(GA_FALLBACK)
      })
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setPrice(val)
    const parsed = parseFloat(val)
    onPriceChange(isNaN(parsed) ? null : parsed)
  }

  return (
    <div className="card">
      <h2 className="section-title flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">4</span>
        Georgia Gas Price
      </h2>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="section-label">Price Per Gallon (Regular)</label>
          {source === 'live' && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
              Lower Atlantic Avg
            </span>
          )}
          {source === 'fallback' && (
            <span className="text-xs text-amber-600 font-medium">Recent estimate</span>
          )}
          {source === 'loading' && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block animate-pulse"></span>
              Refreshing…
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
            value={price}
            onChange={handleChange}
            placeholder="3.10"
          />
        </div>
        {source === 'fallback' && (
          <p className="text-xs text-amber-600 mt-1">
            Live price unavailable — using a recent GA average. You can edit this.
          </p>
        )}
      </div>
    </div>
  )
}
