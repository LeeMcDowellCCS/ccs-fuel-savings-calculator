import { useState, useEffect, useMemo } from 'react'
import gasVehicleData from '../data/gas-vehicles/index.js'

function CascadeSelects({ vehicles, onSelect, label }) {
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [trim, setTrim] = useState('')

  const years = useMemo(() => {
    const s = new Set(vehicles.map(v => v.year))
    return [...s].sort((a, b) => b - a)
  }, [vehicles])

  const makes = useMemo(() => {
    if (!year) return []
    const s = new Set(vehicles.filter(v => v.year === +year).map(v => v.make))
    return [...s].sort()
  }, [vehicles, year])

  const models = useMemo(() => {
    if (!year || !make) return []
    const s = new Set(vehicles.filter(v => v.year === +year && v.make === make).map(v => v.model))
    return [...s].sort()
  }, [vehicles, year, make])

  const trims = useMemo(() => {
    if (!year || !make || !model) return []
    return vehicles.filter(v => v.year === +year && v.make === make && v.model === model)
  }, [vehicles, year, make, model])

  useEffect(() => {
    setMake(''); setModel(''); setTrim('')
    onSelect(null)
  }, [year])

  useEffect(() => {
    setModel(''); setTrim('')
    onSelect(null)
  }, [make])

  useEffect(() => {
    setTrim('')
    onSelect(null)
    if (trims.length === 1) {
      setTrim(trims[0].trim)
      onSelect(trims[0])
    }
  }, [model])

  const handleTrim = (e) => {
    const val = e.target.value
    setTrim(val)
    const found = trims.find(t => t.trim === val)
    onSelect(found || null)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="section-label">{label} Year</label>
        <select className="select-field" value={year} onChange={e => setYear(e.target.value)}>
          <option value="">Select year…</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div>
        <label className="section-label">Make</label>
        <select className="select-field" value={make} onChange={e => setMake(e.target.value)} disabled={!year}>
          <option value="">Select make…</option>
          {makes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="section-label">Model</label>
        <select className="select-field" value={model} onChange={e => setModel(e.target.value)} disabled={!make}>
          <option value="">Select model…</option>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="section-label">Trim</label>
        <select className="select-field" value={trim} onChange={handleTrim} disabled={!model}>
          <option value="">Select trim…</option>
          {trims.map(t => <option key={t.trim} value={t.trim}>{t.trim}</option>)}
        </select>
      </div>
    </div>
  )
}

export function GasVehicleSelector({ onSelect }) {
  const vehicles = gasVehicleData

  return (
    <div className="card">
      <h2 className="section-title flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">1</span>
        Your Current Gas Vehicle
      </h2>
      <CascadeSelects vehicles={vehicles} onSelect={onSelect} label="Gas Vehicle" />
    </div>
  )
}

export function EVSelector({ onSelect }) {
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    fetch('/data/ev-vehicles.json')
      .then(r => r.json())
      .then(setVehicles)
      .catch(console.error)
  }, [])

  return (
    <div className="card">
      <h2 className="section-title flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-ccs-red flex items-center justify-center text-sm font-bold text-white">2</span>
        EV You're Considering
      </h2>
      <CascadeSelects vehicles={vehicles} onSelect={onSelect} label="EV" />
    </div>
  )
}
