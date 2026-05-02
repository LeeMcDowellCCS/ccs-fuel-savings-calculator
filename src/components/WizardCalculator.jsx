import { useState, useEffect, useMemo } from 'react'
import gasVehicleData from '../data/gas-vehicles/index.js'
import { getFuelType, FUEL_LABELS } from '../utils/fuelType'
import CTA from './CTA'

// ── Constants ─────────────────────────────────────────────────────────────────
const EIA_BASE =
  'https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=xI8f5dCEIevB4PTyk4hvb4gsoQ0UOc92ciqedgb0' +
  '&frequency=weekly&data%5B0%5D=value&facets%5Bduoarea%5D%5B%5D=R1Z' +
  '&sort%5B0%5D%5Bcolumn%5D=period&sort%5B0%5D%5Bdirection%5D=desc&length=1'

const MILES_PRESETS = [
  { label: '< 10', value: 8 }, { label: '25', value: 25 },
  { label: '40', value: 40 }, { label: '60', value: 60 },
  { label: '80+', value: 85 },
]

const STEPS = [
  'gas-make','gas-year','gas-model','gas-trim',
  'ev-make','ev-model','ev-trim',
  'miles','utility','results',
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n)    { return '$' + Math.abs(Math.round(n)).toLocaleString() }
function fmtD(n,d) { return n.toFixed(d) }

function calcSavings({ gasVehicle, evVehicle, electricRate, gasPrice, milesPerDay }) {
  const annualMiles       = milesPerDay * 365
  const annualGallons     = annualMiles / gasVehicle.mpg
  const annualGasCost     = annualGallons * gasPrice
  const annualKWh         = annualMiles / evVehicle.miPerKWh
  const annualElectricCost = annualKWh * electricRate
  const annualSavings     = annualGasCost - annualElectricCost
  const monthlySavings    = annualSavings / 12
  const pctSavings        = annualGasCost > 0 ? (annualSavings / annualGasCost) * 100 : 0
  const co2SavedLbs       = annualGallons * 19.59 - annualKWh * 0.41 * 2.205
  const treesEquiv        = Math.max(0, Math.round(co2SavedLbs / 48))
  return {
    annualMiles, annualGallons, annualGasCost, annualKWh, annualElectricCost,
    annualSavings, monthlySavings, pctSavings, co2SavedLbs, treesEquiv,
  }
}

// ── Reusable UI pieces ────────────────────────────────────────────────────────
function Progress({ step }) {
  const idx = STEPS.indexOf(step)
  const pct = idx < 0 ? 100 : Math.round(((idx + 1) / STEPS.length) * 100)
  return (
    <div className="h-1.5 bg-gray-200">
      <div className="h-full bg-ccs-red transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
    </div>
  )
}

function StepShell({ step, onBack, onExit, label, title, subtitle, children }) {
  const idx = STEPS.indexOf(step)
  const total = STEPS.length - 1 // exclude results
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Progress step={step} />
      <div className="max-w-2xl mx-auto w-full px-4 pt-6 pb-3 flex items-start gap-3">
        {onBack ? (
          <button onClick={onBack} className="mt-1 text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0">←</button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
              {label || (idx >= 0 ? `Step ${idx + 1} of ${total}` : 'Results')}
            </p>
            <button onClick={onExit} className="text-xs text-gray-400 hover:text-gray-600">← Classic View</button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-1 leading-tight">{title}</h2>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto w-full px-4 pb-10 flex-1">
        {children}
      </div>
    </div>
  )
}

function MakeGrid({ makes, selected, onSelect }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-2">
      {makes.map(make => (
        <button
          key={make}
          onClick={() => onSelect(make)}
          className={`py-3.5 px-2 rounded-xl border-2 text-sm font-semibold text-center transition-all ${
            selected === make
              ? 'border-ccs-red bg-red-50 text-ccs-red shadow-sm'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 active:bg-gray-50'
          }`}
        >
          {make}
        </button>
      ))}
    </div>
  )
}

function OptionList({ items, selected, onSelect, getLabel = x => x, getSub }) {
  return (
    <div className="space-y-2 mt-2">
      {items.map((item, i) => {
        const label = getLabel(item)
        const isSelected = selected === label || selected === item
        return (
          <button
            key={i}
            onClick={() => onSelect(item)}
            className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-ccs-red bg-red-50'
                : 'border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50'
            }`}
          >
            <span className={`text-sm font-semibold ${isSelected ? 'text-ccs-red' : 'text-gray-800'}`}>{label}</span>
            {getSub && <span className="block text-xs text-gray-400 mt-0.5">{getSub(item)}</span>}
          </button>
        )
      })}
    </div>
  )
}

function YearGrid({ years, selected, onSelect }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 mt-2">
      {years.map(y => (
        <button
          key={y}
          onClick={() => onSelect(y)}
          className={`py-4 rounded-xl border-2 text-sm font-bold transition-all ${
            selected === y
              ? 'border-ccs-red bg-red-50 text-ccs-red shadow-sm'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
          }`}
        >
          {y}
        </button>
      ))}
    </div>
  )
}

// ── Wizard Component ──────────────────────────────────────────────────────────
export default function WizardCalculator({ onExit }) {
  const [step, setStep]       = useState('gas-make')
  const [evVehicles, setEvVehicles] = useState([])
  const [utilities, setUtilities] = useState([])

  // Gas vehicle
  const [gasMake,    setGasMake]    = useState(null)
  const [gasYear,    setGasYear]    = useState(null)
  const [gasModel,   setGasModel]   = useState(null)
  const [gasVehicle, setGasVehicle] = useState(null)

  // EV vehicle
  const [evMake,    setEvMake]    = useState(null)
  const [evModel,   setEvModel]   = useState(null)
  const [evVehicle, setEvVehicle] = useState(null)

  // Inputs
  const [milesPerDay,  setMilesPerDay]  = useState(35)
  const [electricRate, setElectricRate] = useState(null)
  const [utilityId,    setUtilityId]    = useState(null)
  const [gasPrice,     setGasPrice]     = useState(null)
  const [gasPriceOverride, setGasPriceOverride] = useState(null)

  // Load EV data + utilities + gas price in background
  useEffect(() => {
    fetch('/data/ev-vehicles.json').then(r => r.json()).then(setEvVehicles).catch(() => {})
    fetch('/data/utilities.json').then(r => r.json()).then(setUtilities).catch(() => {})
    const grade = gasMake ? getFuelType({ make: gasMake, model: gasModel || '', trim: '' }) : 'regular'
    const product = grade === 'diesel' ? 'EPD2D' : grade === 'premium' ? 'EPM2' : 'EPM0'
    fetch(`${EIA_BASE}&facets%5Bproduct%5D%5B%5D=${product}`)
      .then(r => r.json())
      .then(d => { const v = parseFloat(d?.response?.data?.[0]?.value); if (!isNaN(v)) setGasPrice(v) })
      .catch(() => setGasPrice(3.10))
  }, [])

  // Refresh gas price grade when vehicle chosen
  useEffect(() => {
    if (!gasVehicle) return
    const grade = getFuelType(gasVehicle)
    const product = grade === 'diesel' ? 'EPD2D' : grade === 'premium' ? 'EPM2' : 'EPM0'
    fetch(`${EIA_BASE}&facets%5Bproduct%5D%5B%5D=${product}`)
      .then(r => r.json())
      .then(d => { const v = parseFloat(d?.response?.data?.[0]?.value); if (!isNaN(v)) { setGasPrice(v); setGasPriceOverride(null) } })
      .catch(() => {})
  }, [gasVehicle])

  // ── Derived lists ──────────────────────────────────────────────────────────
  const gasMakes  = useMemo(() => [...new Set(gasVehicleData.map(v => v.make))].sort(), [])
  const gasYears  = useMemo(() => {
    if (!gasMake) return []
    return [...new Set(gasVehicleData.filter(v => v.make === gasMake).map(v => v.year))].sort((a,b) => b-a)
  }, [gasMake])
  const gasModels = useMemo(() => {
    if (!gasMake || !gasYear) return []
    return [...new Set(gasVehicleData.filter(v => v.make === gasMake && v.year === gasYear).map(v => v.model))].sort()
  }, [gasMake, gasYear])
  const gasTrims  = useMemo(() => {
    if (!gasMake || !gasYear || !gasModel) return []
    return gasVehicleData.filter(v => v.make === gasMake && v.year === gasYear && v.model === gasModel)
  }, [gasMake, gasYear, gasModel])

  const evMakes   = useMemo(() => [...new Set(evVehicles.map(v => v.make))].sort(), [evVehicles])
  const evModels  = useMemo(() => {
    if (!evMake) return []
    const latestYear = {}
    evVehicles.filter(v => v.make === evMake).forEach(v => {
      if (!latestYear[v.model] || v.year > latestYear[v.model]) latestYear[v.model] = v.year
    })
    return Object.keys(latestYear).sort().map(m => ({ model: m, year: latestYear[m] }))
  }, [evVehicles, evMake])
  const evTrims   = useMemo(() => {
    if (!evMake || !evModel) return []
    const entry = evModels.find(e => e.model === evModel)
    if (!entry) return []
    return evVehicles.filter(v => v.make === evMake && v.model === evModel && v.year === entry.year)
  }, [evVehicles, evMake, evModel, evModels])

  // Auto-advance when there's only one option
  useEffect(() => {
    if (step === 'gas-trim' && gasTrims.length === 1) {
      setGasVehicle(gasTrims[0])
      setTimeout(() => setStep('ev-make'), 250)
    }
  }, [step, gasTrims])
  useEffect(() => {
    if (step === 'ev-trim' && evTrims.length === 1) {
      setEvVehicle(evTrims[0])
      setTimeout(() => setStep('miles'), 250)
    }
  }, [step, evTrims])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goBack = () => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }
  const goNext = () => {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  // ── Calculations ────────────────────────────────────────────────────────────
  const effectiveGasPrice = gasPriceOverride ?? gasPrice ?? 3.10
  const calc = useMemo(() => {
    if (!gasVehicle || !evVehicle || !electricRate) return null
    return calcSavings({ gasVehicle, evVehicle, electricRate, gasPrice: effectiveGasPrice, milesPerDay })
  }, [gasVehicle, evVehicle, electricRate, effectiveGasPrice, milesPerDay])

  // ── Render ─────────────────────────────────────────────────────────────────

  // GAS MAKE
  if (step === 'gas-make') return (
    <StepShell step={step} onExit={onExit} title="What's the make of your current vehicle?">
      <MakeGrid makes={gasMakes} selected={gasMake} onSelect={m => { setGasMake(m); setGasYear(null); setGasModel(null); setGasVehicle(null); setTimeout(() => setStep('gas-year'), 200) }} />
    </StepShell>
  )

  // GAS YEAR
  if (step === 'gas-year') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title={`What year is your ${gasMake}?`}>
      <YearGrid years={gasYears} selected={gasYear} onSelect={y => { setGasYear(y); setGasModel(null); setGasVehicle(null); setTimeout(() => setStep('gas-model'), 200) }} />
    </StepShell>
  )

  // GAS MODEL
  if (step === 'gas-model') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title={`Which ${gasYear} ${gasMake} model?`}>
      <OptionList items={gasModels} selected={gasModel} onSelect={m => { setGasModel(m); setGasVehicle(null); setTimeout(() => setStep('gas-trim'), 200) }} />
    </StepShell>
  )

  // GAS TRIM
  if (step === 'gas-trim') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title="Which trim?" subtitle={`${gasYear} ${gasMake} ${gasModel}`}>
      {gasTrims.length === 1 ? (
        <div className="mt-4 rounded-xl border-2 border-ccs-red bg-red-50 px-4 py-4 text-ccs-red text-sm font-semibold">
          ✓ {gasTrims[0].trim} — auto-selected
        </div>
      ) : (
        <OptionList
          items={gasTrims}
          selected={gasVehicle?.trim}
          getLabel={t => t.trim}
          getSub={t => {
            const ft = getFuelType(t)
            return `${t.mpg} MPG combined${ft !== 'regular' ? ` · ${FUEL_LABELS[ft]}` : ''}`
          }}
          onSelect={t => { setGasVehicle(t); setTimeout(() => setStep('ev-make'), 200) }}
        />
      )}
    </StepShell>
  )

  // EV MAKE
  if (step === 'ev-make') return (
    <StepShell step={step} onBack={goBack} onExit={onExit}
      title="Which EV are you considering?"
      subtitle="Select the make"
    >
      {gasVehicle && (
        <div className="mb-4 text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2">
          Gas vehicle locked in: <span className="font-semibold text-gray-700">{gasVehicle.year} {gasVehicle.make} {gasVehicle.model} {gasVehicle.trim}</span> · {gasVehicle.mpg} MPG
        </div>
      )}
      <MakeGrid makes={evMakes} selected={evMake} onSelect={m => { setEvMake(m); setEvModel(null); setEvVehicle(null); setTimeout(() => setStep('ev-model'), 200) }} />
    </StepShell>
  )

  // EV MODEL
  if (step === 'ev-model') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title={`Which ${evMake} model?`} subtitle="Showing latest model year available">
      <OptionList
        items={evModels}
        selected={evModel}
        getLabel={e => e.model}
        getSub={e => `${e.year}`}
        onSelect={e => { setEvModel(e.model); setEvVehicle(null); setTimeout(() => setStep('ev-trim'), 200) }}
      />
    </StepShell>
  )

  // EV TRIM
  if (step === 'ev-trim') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title="Which trim / configuration?" subtitle={`${evMake} ${evModel}`}>
      {evTrims.length === 1 ? (
        <div className="mt-4 rounded-xl border-2 border-ccs-red bg-red-50 px-4 py-4 text-ccs-red text-sm font-semibold">
          ✓ {evTrims[0].trim} — auto-selected
        </div>
      ) : (
        <OptionList
          items={evTrims}
          selected={evVehicle?.trim}
          getLabel={t => t.trim}
          getSub={t => `${t.miPerKWh} mi/kWh · ${t.rangeMi} mi range`}
          onSelect={t => { setEvVehicle(t); setTimeout(() => setStep('miles'), 200) }}
        />
      )}
    </StepShell>
  )

  // MILES
  if (step === 'miles') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title="How many miles do you drive per day?" subtitle="Your average — no need to be exact">
      <div className="mt-4 space-y-6">
        <div className="flex gap-2 flex-wrap">
          {MILES_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setMilesPerDay(p.value)}
              className={`flex-1 min-w-[70px] py-4 rounded-xl border-2 text-base font-bold transition-all ${
                milesPerDay === p.value ? 'border-ccs-red bg-red-50 text-ccs-red' : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div>
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>5 miles</span>
            <span className="text-2xl font-bold text-ccs-black">{milesPerDay} mi/day</span>
            <span>150 miles</span>
          </div>
          <input type="range" min={5} max={150} step={5} value={milesPerDay}
            onChange={e => setMilesPerDay(+e.target.value)} className="w-full accent-ccs-red" />
          <p className="text-xs text-gray-400 text-center mt-1">{(milesPerDay * 365).toLocaleString()} miles/year</p>
        </div>
        <button onClick={goNext} className="w-full py-4 bg-ccs-red text-white rounded-xl font-bold text-base hover:bg-ccs-red-dark transition-colors">
          Continue →
        </button>
      </div>
    </StepShell>
  )

  // UTILITY
  if (step === 'utility') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title="Who's your electric utility?" subtitle="Sets your charging cost per kWh">
      <div className="mt-2 space-y-2">
        {utilities.map(u => (
          <button
            key={u.id}
            onClick={() => {
              setUtilityId(u.id)
              setElectricRate(u.standardRate)
              setTimeout(() => setStep('results'), 200)
            }}
            className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all ${
              utilityId === u.id ? 'border-ccs-red bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`font-semibold text-sm ${utilityId === u.id ? 'text-ccs-red' : 'text-gray-800'}`}>{u.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              ${u.standardRate.toFixed(4)}/kWh standard
              {u.hasTou && ` · TOU off-peak $${u.touOffPeakRate.toFixed(4)}/kWh`}
            </div>
          </button>
        ))}
        <button
          onClick={() => { setUtilityId('other'); setElectricRate(0.12); setTimeout(() => setStep('results'), 200) }}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${utilityId === 'other' ? 'border-ccs-red bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <div className={`font-semibold text-sm ${utilityId === 'other' ? 'text-ccs-red' : 'text-gray-800'}`}>Other / Not sure</div>
          <div className="text-xs text-gray-400">Uses $0.12/kWh — GA average</div>
        </button>
      </div>
    </StepShell>
  )

  // RESULTS
  if (step === 'results' && calc) {
    const { annualMiles, annualGallons, annualGasCost, annualKWh, annualElectricCost,
            annualSavings, monthlySavings, pctSavings, co2SavedLbs, treesEquiv } = calc
    const positive = annualSavings > 0
    const fuelType = getFuelType(gasVehicle)
    const fuelLabel = FUEL_LABELS[fuelType]

    const costPerMileGas = annualGasCost / annualMiles
    const costPerMileEV  = annualElectricCost / annualMiles

    const yearRows = [1,2,3,5,7,10].map(y => ({
      y, gas: annualGasCost * y, ev: annualElectricCost * y, saved: annualSavings * y,
    }))

    return (
      <div className="min-h-screen bg-gray-50">
        <Progress step="results" />

        {/* Header */}
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Your Results</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {positive ? `You could save ${fmt(annualSavings)}/year` : 'EV fueling costs more with these inputs'}
            </h1>
          </div>
          <button onClick={onExit} className="text-xs text-gray-400 hover:text-gray-600 shrink-0 ml-4">← Classic View</button>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-16 space-y-5">

          {/* ── Summary cards ── */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Monthly Savings', val: monthlySavings },
              { label: 'Annual Savings',  val: annualSavings  },
              { label: '5-Year Savings',  val: annualSavings * 5  },
              { label: '10-Year Savings', val: annualSavings * 10 },
            ].map(({ label, val }) => (
              <div key={label} className={`rounded-xl p-4 text-center ${(val > 0) ? 'bg-green-600' : 'bg-ccs-red'}`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">{label}</div>
                <div className="text-2xl font-bold text-white">{fmt(val)}</div>
              </div>
            ))}
          </div>

          {/* % fuel reduction */}
          <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${positive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <span className={`text-sm font-medium ${positive ? 'text-green-800' : 'text-red-800'}`}>Fuel Cost Reduction</span>
            <span className={`text-2xl font-bold ${positive ? 'text-green-700' : 'text-red-700'}`}>{positive ? '▼ ' : '▲ '}{Math.abs(Math.round(pctSavings))}%</span>
          </div>

          {/* ── Vehicle comparison ── */}
          <div className="card">
            <h3 className="text-base font-bold text-ccs-black mb-3">Vehicle Comparison</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                <div className="text-xs text-red-400 font-semibold uppercase mb-1">Gas Vehicle</div>
                <div className="text-sm font-bold text-gray-900">{gasVehicle.year} {gasVehicle.make}</div>
                <div className="text-sm text-gray-700">{gasVehicle.model} {gasVehicle.trim}</div>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <div><span className="font-medium">{gasVehicle.mpg} MPG</span> combined</div>
                  <div><span className="font-medium">{fuelLabel}</span> fuel</div>
                  <div><span className="font-medium">{fmt(effectiveGasPrice)}/gal</span></div>
                  <div>Cost per mile: <span className="font-medium">${costPerMileGas.toFixed(3)}</span></div>
                </div>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                <div className="text-xs text-green-500 font-semibold uppercase mb-1">Electric Vehicle</div>
                <div className="text-sm font-bold text-gray-900">{evVehicle.year} {evVehicle.make}</div>
                <div className="text-sm text-gray-700">{evVehicle.model} {evVehicle.trim}</div>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <div><span className="font-medium">{evVehicle.miPerKWh} mi/kWh</span></div>
                  <div><span className="font-medium">{evVehicle.rangeMi} mi</span> range</div>
                  <div><span className="font-medium">${electricRate.toFixed(4)}/kWh</span></div>
                  <div>Cost per mile: <span className="font-medium">${costPerMileEV.toFixed(3)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Annual usage breakdown ── */}
          <div className="card">
            <h3 className="text-base font-bold text-ccs-black mb-3">Annual Usage & Cost Breakdown</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Miles driven per year', annualMiles.toLocaleString() + ' mi', null],
                ['Gallons of gas burned', Math.round(annualGallons).toLocaleString() + ' gal', 'text-red-600'],
                ['Annual fuel cost (gas)', fmt(annualGasCost), 'text-red-600'],
                ['kWh of electricity used', Math.round(annualKWh).toLocaleString() + ' kWh', null],
                ['Annual charging cost (EV)', fmt(annualElectricCost), 'text-green-600'],
                ['Annual savings', fmt(annualSavings), positive ? 'text-green-700 font-bold' : 'text-red-600 font-bold'],
              ].map(([label, val, cls]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">{label}</span>
                  <span className={`font-semibold ${cls || 'text-gray-800'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 10-year projection ── */}
          <div className="card">
            <h3 className="text-base font-bold text-ccs-black mb-3">Cumulative Cost Projection</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-200">
                    <th className="text-left pb-2 font-semibold">Year</th>
                    <th className="text-right pb-2 font-semibold text-red-400">Gas Total</th>
                    <th className="text-right pb-2 font-semibold text-green-600">EV Total</th>
                    <th className="text-right pb-2 font-semibold text-gray-600">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {yearRows.map(({ y, gas, ev, saved }) => (
                    <tr key={y} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 font-medium text-gray-700">Yr {y}</td>
                      <td className="py-2 text-right text-red-600 font-medium">{fmt(gas)}</td>
                      <td className="py-2 text-right text-green-600 font-medium">{fmt(ev)}</td>
                      <td className={`py-2 text-right font-bold ${saved > 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(saved)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Environmental impact ── */}
          {positive && (
            <div className="card bg-green-50 border border-green-200">
              <h3 className="text-base font-bold text-green-900 mb-3">Environmental Impact (Annual)</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-700">{Math.round(co2SavedLbs / 2000 * 10) / 10}</div>
                  <div className="text-xs text-green-700 mt-1">tons CO₂ avoided</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">{treesEquiv.toLocaleString()}</div>
                  <div className="text-xs text-green-700 mt-1">trees equivalent</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">{Math.round(annualGallons).toLocaleString()}</div>
                  <div className="text-xs text-green-700 mt-1">gallons not burned</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Assumptions used ── */}
          <div className="card border border-gray-200">
            <h3 className="text-base font-bold text-ccs-black mb-3">Assumptions Used in This Calculation</h3>
            <div className="space-y-1.5 text-xs text-gray-600">
              {[
                [`Gas price (${fuelLabel})`, `${fmt(effectiveGasPrice)}/gal`],
                [`Electricity rate`, `$${electricRate.toFixed(4)}/kWh`],
                [`Daily miles`, `${milesPerDay} mi/day`],
                [`Annual miles`, `${annualMiles.toLocaleString()} mi`],
                [`Gas vehicle efficiency`, `${gasVehicle.mpg} MPG`],
                [`EV efficiency`, `${evVehicle.miPerKWh} mi/kWh`],
                [`CO₂ per gallon of gas`, `19.59 lbs (EPA)`],
                [`GA grid carbon intensity`, `0.41 kg CO₂/kWh (EPA eGRID)`],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between border-b border-gray-100 pb-1.5 last:border-0">
                  <span>{k}</span><span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            {/* Gas price override */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-500">Adjust gas price:</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">$</span>
                <input type="number" step="0.01" min="0"
                  value={gasPriceOverride ?? gasPrice ?? ''}
                  onChange={e => setGasPriceOverride(+e.target.value || null)}
                  className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                />
                {gasPriceOverride && (
                  <button onClick={() => setGasPriceOverride(null)} className="text-xs text-ccs-red hover:underline">Reset</button>
                )}
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <CTA />

          {/* Back to wizard / classic */}
          <div className="flex gap-3">
            <button onClick={() => setStep('utility')} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-300">
              ← Adjust inputs
            </button>
            <button onClick={onExit} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-300">
              Classic view
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback — shouldn't normally be reached
  return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title="One moment…">
      <p className="text-gray-400 text-sm mt-4">Loading data, please wait…</p>
    </StepShell>
  )
}
