import { useState, useEffect } from 'react'

export default function UtilitySelector({ onRateChange }) {
  const [utilities, setUtilities] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [useTou, setUseTou] = useState(false)
  const [rate, setRate] = useState('')

  useEffect(() => {
    fetch('/data/utilities.json')
      .then(r => r.json())
      .then(setUtilities)
      .catch(console.error)
  }, [])

  const selected = utilities.find(u => u.id === selectedId)

  useEffect(() => {
    if (!selected) { setRate(''); setUseTou(false); onRateChange(null); return }
    const r = useTou && selected.hasTou ? selected.touOffPeakRate : selected.standardRate
    setRate(r.toFixed(4))
    onRateChange(r)
  }, [selected, useTou])

  const handleRateEdit = (e) => {
    const val = e.target.value
    setRate(val)
    const parsed = parseFloat(val)
    onRateChange(isNaN(parsed) ? null : parsed)
  }

  const handleTouChange = (e) => {
    setUseTou(e.target.checked)
  }

  return (
    <div className="card">
      <h2 className="section-title flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">3</span>
        Electric Utility &amp; Rate
      </h2>
      <div className="space-y-3">
        <div>
          <label className="section-label">Your Utility Provider</label>
          <select
            className="select-field"
            value={selectedId}
            onChange={e => { setSelectedId(e.target.value); setUseTou(false) }}
          >
            <option value="">Select utility…</option>
            {utilities.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {selected?.hasTou && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <input
              type="checkbox"
              id="tou-check"
              checked={useTou}
              onChange={handleTouChange}
              className="mt-0.5 accent-ccs-red w-4 h-4"
            />
            <label htmlFor="tou-check" className="text-sm text-blue-900 cursor-pointer">
              <span className="font-medium">I have a Time-of-Use (TOU) plan</span>
              {selected.touDescription && (
                <span className="block text-blue-700 text-xs mt-0.5">{selected.touDescription}</span>
              )}
            </label>
          </div>
        )}

        {selected && (
          <div>
            <label className="section-label">
              {useTou && selected.hasTou ? selected.touLabel : 'Standard Rate'} ($/kWh)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                step="0.0001"
                min="0"
                className="input-field pl-7"
                value={rate}
                onChange={handleRateEdit}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Rate auto-populated — edit if your bill shows a different amount.</p>
          </div>
        )}
      </div>
    </div>
  )
}
