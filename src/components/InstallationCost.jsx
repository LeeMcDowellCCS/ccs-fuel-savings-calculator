import { useState, useEffect } from 'react'

const LOCATIONS = [
  { id: 'garage', label: 'Garage', min: 750, max: 1250 },
  { id: 'unfinished-basement', label: 'Unfinished Basement', min: 1150, max: 1550 },
  { id: 'finished-basement', label: 'Finished Basement', min: 1450, max: 2250 },
  { id: 'main-floor', label: 'Main Floor', min: 1150, max: 1450 },
]

const CHARGER_COST = 500

export default function InstallationCost({ enabled, onToggle, onCostChange }) {
  const [location, setLocation] = useState(LOCATIONS[0])
  const [includeCharger, setIncludeCharger] = useState(false)
  const [sliderVal, setSliderVal] = useState(LOCATIONS[0].min)
  const [address, setAddress] = useState('')

  const baseMin = location.min
  const baseMax = location.max
  const totalMin = baseMin + (includeCharger ? CHARGER_COST : 0)
  const totalMax = baseMax + (includeCharger ? CHARGER_COST : 0)
  const totalCost = sliderVal + (includeCharger ? CHARGER_COST : 0)

  useEffect(() => {
    setSliderVal(location.min)
  }, [location])

  useEffect(() => {
    if (enabled) onCostChange(totalCost)
    else onCostChange(null)
  }, [enabled, totalCost])

  const handleLocation = (loc) => {
    setLocation(loc)
  }

  return (
    <div className="card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left group"
      >
        <h2 className="section-title flex items-center gap-2 mb-0">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${enabled ? 'bg-ccs-red text-white' : 'bg-gray-100 text-gray-600'}`}>6</span>
          Charger Installation Cost
          <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
        </h2>
        <span className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${enabled ? 'bg-ccs-red text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
          {enabled ? 'Included ✓' : 'Add Payback Calc'}
        </span>
      </button>

      {enabled && (
        <div className="mt-5 space-y-5 border-t border-gray-100 pt-5">
          <div>
            <label className="section-label">Panel / Charger Location</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {LOCATIONS.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => handleLocation(loc)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    location.id === loc.id
                      ? 'border-ccs-red bg-red-50 text-ccs-red font-medium'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{loc.label}</div>
                  <div className="text-xs text-gray-500">${loc.min.toLocaleString()}–${loc.max.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="section-label">Charger Included?</label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(val => (
                <button
                  key={String(val)}
                  onClick={() => setIncludeCharger(val)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    includeCharger === val
                      ? 'border-ccs-red bg-red-50 text-ccs-red'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {val ? `Yes (+$${CHARGER_COST})` : 'No (I have one)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="section-label mb-0">Estimated Install Cost</label>
              <span className="text-2xl font-bold text-ccs-black">${totalCost.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={baseMin}
              max={baseMax}
              step={50}
              value={sliderVal}
              onChange={e => setSliderVal(+e.target.value)}
              className="w-full accent-ccs-red"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>${totalMin.toLocaleString()}</span>
              <span>${totalMax.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="section-label">Your Address <span className="normal-case font-normal text-gray-400">(optional)</span></label>
            <input
              type="text"
              className="input-field"
              placeholder="123 Main St, Atlanta, GA 30301"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Used for local permitting context when you request a quote.</p>
          </div>
        </div>
      )}
    </div>
  )
}
