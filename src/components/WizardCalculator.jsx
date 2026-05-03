import { useState, useEffect, useMemo, useRef } from 'react'
import gasVehicleData from '../data/gas-vehicles/index.js'
import { getFuelType, FUEL_LABELS } from '../utils/fuelType'
import { getEvMsrp, estimateTradeIn } from '../utils/vehicleValues'
import { fetchGasPrice, GAS_PRICE_FALLBACKS } from '../utils/gasPriceFetch'
import CTA from './CTA'

// ── Email service config ──────────────────────────────────────────────────────
// To enable real email sending, sign up at https://emailjs.com (free 200/mo),
// configure a service + template, then replace these values. The template
// should include a hard-coded BCC: installations@carchargerspecialists.com.
// Until set, the "Email My Results" button uses a mailto: fallback.
const EMAILJS_CONFIG = {
  serviceId:  'YOUR_SERVICE_ID',
  templateId: 'YOUR_TEMPLATE_ID',
  publicKey:  'YOUR_PUBLIC_KEY',
}
const EMAILJS_READY = !EMAILJS_CONFIG.serviceId.startsWith('YOUR_')
const HCP_LEAD_URL =
  'https://book.housecallpro.com/lead-form/Car-Charger-Specialists-LLC/fcb749cd2e9748849f539ba8c3937347'
const BCC_EMAIL = 'installations@carchargerspecialists.com'

// ── Constants ─────────────────────────────────────────────────────────────────

const MILES_PRESETS = [
  { label: '< 10', value: 8 }, { label: '25', value: 25 },
  { label: '40', value: 40 }, { label: '60', value: 60 },
  { label: '80+', value: 85 },
]

const STEPS = [
  'gas-make','gas-year','gas-model','gas-trim',
  'ev-make','ev-model','ev-trim',
  'miles','utility',
  'install','tco',
  'results',
]

const INSTALL_LOCATIONS = [
  { id: 'garage',              label: 'Garage',              min: 750,  max: 1250 },
  { id: 'unfinished-basement', label: 'Unfinished Basement', min: 1150, max: 1550 },
  { id: 'finished-basement',   label: 'Finished Basement',   min: 1450, max: 2250 },
  { id: 'main-floor',          label: 'Main Floor',          min: 1150, max: 1450 },
]
const CHARGER_HW_COST = 500
const LOAN_TERMS = [36, 48, 60, 72, 84]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n)  { return '$' + Math.abs(Math.round(n)).toLocaleString() }
function fmtPct(n){ return Math.abs(Math.round(n)) + '%' }

function calcSavings({ gasVehicle, evVehicle, electricRate, gasPrice, milesPerDay }) {
  const annualMiles        = milesPerDay * 365
  const annualGallons      = annualMiles / gasVehicle.mpg
  const annualGasCost      = annualGallons * gasPrice
  const annualKWh          = annualMiles / evVehicle.miPerKWh
  const annualElectricCost = annualKWh * electricRate
  const annualSavings      = annualGasCost - annualElectricCost
  const monthlySavings     = annualSavings / 12
  const pctSavings         = annualGasCost > 0 ? (annualSavings / annualGasCost) * 100 : 0
  const co2SavedLbs        = annualGallons * 19.59 - annualKWh * 0.41 * 2.205
  const treesEquiv         = Math.max(0, Math.round(co2SavedLbs / 48))
  return {
    annualMiles, annualGallons, annualGasCost, annualKWh, annualElectricCost,
    annualSavings, monthlySavings, pctSavings, co2SavedLbs, treesEquiv,
  }
}

function calcMonthlyPayment(principal, aprPct, termMonths) {
  if (principal <= 0) return 0
  const r = aprPct / 100 / 12
  if (r === 0) return principal / termMonths
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

function fireConfetti() {
  const fire = () => {
    if (!window.confetti) return
    const colors = ['#E8272A', '#16a34a', '#fbbf24', '#3b82f6', '#a855f7']
    window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.35 }, colors })
    setTimeout(() => window.confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 }, colors }), 250)
    setTimeout(() => window.confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors }), 400)
  }
  if (window.confetti) { fire(); return }
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'
  s.async = true
  s.onload = fire
  document.head.appendChild(s)
}

// ── Reusable UI ───────────────────────────────────────────────────────────────
function Progress({ step }) {
  const idx = STEPS.indexOf(step)
  const pct = idx < 0 ? 100 : Math.round(((idx + 1) / STEPS.length) * 100)
  return (
    <div className="h-1.5 bg-gray-800">
      <div className="h-full bg-ccs-red transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
    </div>
  )
}

function StepShell({ step, onBack, onExit, label, title, subtitle, children }) {
  const idx = STEPS.indexOf(step)
  const total = STEPS.length - 1
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      <Progress step={step} />
      <div className="max-w-2xl mx-auto w-full px-4 pt-6 pb-3 flex items-start gap-3">
        {onBack ? (
          <button onClick={onBack} className="mt-1 text-gray-500 hover:text-gray-300 text-lg leading-none flex-shrink-0">←</button>
        ) : <div className="w-5 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              {label || (idx >= 0 ? `Step ${idx + 1} of ${total}` : 'Results')}
            </p>
            <button onClick={onExit} className="text-xs text-gray-500 hover:text-gray-300">Classic View →</button>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1 leading-tight">{title}</h2>
          {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto w-full px-4 pb-10 flex-1">{children}</div>
    </div>
  )
}

function MakeGrid({ makes, selected, onSelect }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-2">
      {makes.map(make => (
        <button key={make} onClick={() => onSelect(make)}
          className={`py-3.5 px-2 rounded-xl border-2 text-sm font-semibold text-center transition-all ${
            selected === make
              ? 'border-ccs-red bg-red-950/50 text-ccs-red shadow-sm'
              : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600 active:bg-gray-800'
          }`}>{make}</button>
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
          <button key={i} onClick={() => onSelect(item)}
            className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
              isSelected ? 'border-ccs-red bg-red-950/50' : 'border-gray-700 bg-gray-900 hover:border-gray-600 active:bg-gray-800'
            }`}>
            <span className={`text-sm font-semibold ${isSelected ? 'text-ccs-red' : 'text-gray-200'}`}>{label}</span>
            {getSub && <span className="block text-xs text-gray-500 mt-0.5">{getSub(item)}</span>}
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
        <button key={y} onClick={() => onSelect(y)}
          className={`py-4 rounded-xl border-2 text-sm font-bold transition-all ${
            selected === y ? 'border-ccs-red bg-red-950/50 text-ccs-red shadow-sm' : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600'
          }`}>{y}</button>
      ))}
    </div>
  )
}

function NumField({ label, prefix, suffix, value, onChange, step = 1, hint }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">{label}</label>
      <div className="flex items-center border-2 border-gray-700 rounded-lg overflow-hidden focus-within:border-ccs-red transition-colors">
        {prefix && <span className="px-2.5 py-2 bg-gray-800 text-gray-400 text-sm border-r border-gray-700">{prefix}</span>}
        <input type="number" min={0} step={step} value={value}
          onChange={e => onChange(Math.max(0, +e.target.value))}
          className="flex-1 px-3 py-2 text-sm outline-none w-full bg-gray-900 text-gray-100" />
        {suffix && <span className="px-2.5 py-2 bg-gray-800 text-gray-400 text-sm border-l border-gray-700">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

// ── Email dialog ──────────────────────────────────────────────────────────────
function EmailDialog({ open, onClose, calc, gasVehicle, evVehicle, electricRate, gasPrice, milesPerDay, tco, install, fuelLabel }) {
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')

  if (!open) return null

  const buildEmailBody = () => {
    const lines = []
    lines.push(`Hi ${name || 'there'},`)
    lines.push('')
    lines.push(`Here's your personalized EV vs Gas savings report from Car Charger Specialists:`)
    lines.push('')
    lines.push(`════════════════════════════════════════`)
    lines.push(`  YOUR ESTIMATED SAVINGS`)
    lines.push(`════════════════════════════════════════`)
    lines.push(`  Monthly Savings:  ${fmt(calc.monthlySavings)}`)
    lines.push(`  Annual Savings:   ${fmt(calc.annualSavings)}`)
    lines.push(`  5-Year Savings:   ${fmt(calc.annualSavings * 5)}`)
    lines.push(`  10-Year Savings:  ${fmt(calc.annualSavings * 10)}`)
    lines.push(`  Fuel Cost Reduction: ${fmtPct(calc.pctSavings)}`)
    lines.push('')
    lines.push(`VEHICLES COMPARED`)
    lines.push(`  Current Gas Vehicle: ${gasVehicle.year} ${gasVehicle.make} ${gasVehicle.model} ${gasVehicle.trim}`)
    lines.push(`    ${gasVehicle.mpg} MPG · ${fuelLabel} fuel · ${fmt(gasPrice)}/gal`)
    lines.push(`  Electric Vehicle:    ${evVehicle.year} ${evVehicle.make} ${evVehicle.model} ${evVehicle.trim}`)
    lines.push(`    ${evVehicle.miPerKWh} mi/kWh · ${evVehicle.rangeMi} mi range · $${electricRate.toFixed(4)}/kWh`)
    lines.push('')
    lines.push(`USAGE`)
    lines.push(`  Daily miles: ${milesPerDay}    Annual miles: ${calc.annualMiles.toLocaleString()}`)
    lines.push(`  Annual gallons: ${Math.round(calc.annualGallons).toLocaleString()}    Annual kWh: ${Math.round(calc.annualKWh).toLocaleString()}`)
    if (install) {
      lines.push('')
      lines.push(`CHARGER INSTALL`)
      lines.push(`  Installation cost: ${fmt(install.cost)}`)
      if (install.payback) lines.push(`  Payback period: ${install.payback}`)
    }
    if (tco) {
      lines.push('')
      lines.push(`TOTAL COST OF OWNERSHIP (Monthly)`)
      lines.push(`                    Gas       EV`)
      lines.push(`  Car Payment:      ${fmt(tco.gasPayment).padEnd(10)} ${fmt(tco.evPayment)}`)
      lines.push(`  Insurance:        ${fmt(tco.gasInsurance).padEnd(10)} ${fmt(tco.evInsurance)}`)
      lines.push(`  Fuel/Electricity: ${fmt(tco.monthlyGasFuel).padEnd(10)} ${fmt(tco.monthlyEvFuel)}`)
      lines.push(`  Maintenance:      ${fmt(tco.gasMaintenance).padEnd(10)} ${fmt(tco.evMaintenance)}`)
      lines.push(`  Monthly Total:    ${fmt(tco.gasMonthlyTCO).padEnd(10)} ${fmt(tco.evMonthlyTCO)}`)
      lines.push(`  ➤ Monthly TCO Savings: ${fmt(tco.monthlyTCOSavings)}`)
      lines.push(`  ➤ Annual TCO Savings:  ${fmt(tco.annualTCOSavings)}`)
      if (tco.tradeInTaxSavings > 0)
        lines.push(`  ✓ Trade-in saved you ${fmt(tco.tradeInTaxSavings)} in ad valorem tax!`)
    }
    lines.push('')
    lines.push(`════════════════════════════════════════`)
    lines.push(`  READY TO START SAVING?`)
    lines.push(`════════════════════════════════════════`)
    lines.push(``)
    lines.push(`To unlock these savings, you need a Level 2 EV charger installed`)
    lines.push(`at home. Car Charger Specialists is Tesla Certified, fast, and`)
    lines.push(`reliable — serving the Atlanta metro area.`)
    lines.push(``)
    lines.push(`📅 BOOK YOUR FREE QUOTE: ${HCP_LEAD_URL}`)
    lines.push(`📞 OR CALL: 404-520-7349`)
    lines.push(``)
    lines.push(`— The Car Charger Specialists Team`)
    lines.push(`Atlanta, GA · carchargerspecialists.com`)
    return lines.join('\n')
  }

  const sendViaEmailJS = async () => {
    if (!window.emailjs) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js'
        s.onload = resolve
        s.onerror = reject
        document.head.appendChild(s)
      })
    }
    window.emailjs.init(EMAILJS_CONFIG.publicKey)
    return window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
      to_name: name,
      to_email: email,
      bcc_email: BCC_EMAIL,
      subject: 'Your EV Savings Report — Car Charger Specialists',
      monthly_savings: fmt(calc.monthlySavings),
      annual_savings:  fmt(calc.annualSavings),
      pct_savings:     fmtPct(calc.pctSavings),
      gas_vehicle:     `${gasVehicle.year} ${gasVehicle.make} ${gasVehicle.model} ${gasVehicle.trim}`,
      ev_vehicle:      `${evVehicle.year} ${evVehicle.make} ${evVehicle.model} ${evVehicle.trim}`,
      lead_form_url:   HCP_LEAD_URL,
      message_body:    buildEmailBody(),
    })
  }

  const sendViaMailto = () => {
    const subject = encodeURIComponent('Your EV Savings Report — Car Charger Specialists')
    const body = encodeURIComponent(buildEmailBody())
    const link = `mailto:${email}?bcc=${BCC_EMAIL}&subject=${subject}&body=${body}`
    window.location.href = link
  }

  const handleSend = async () => {
    setError('')
    if (!email || !email.includes('@')) { setError('Please enter a valid email address'); return }
    setSending(true)
    try {
      if (EMAILJS_READY) await sendViaEmailJS()
      else sendViaMailto()
      setSent(true)
    } catch (e) {
      setError('Could not send via email service — opening your email client instead.')
      sendViaMailto()
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800">
          &times;
        </button>

        {sent ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">📨</div>
            <h3 className="text-xl font-bold text-white mb-2">Sent!</h3>
            <p className="text-sm text-gray-400 mb-4">
              Your savings report is on the way. Don't see it? Check your spam folder.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Our team has been notified and will follow up to schedule your free charger install quote.
            </p>
            <a href={HCP_LEAD_URL} target="_blank" rel="noopener noreferrer"
              className="inline-block bg-ccs-red hover:bg-ccs-red-dark text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
              Book Your Free Quote Now →
            </a>
            <button onClick={onClose} className="block w-full mt-3 text-xs text-gray-500 hover:text-gray-300">Close</button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mb-1">Email My Results</h3>
            <p className="text-sm text-gray-400 mb-4">
              Get your personalized savings report — plus a free quote to install your home charger.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Your Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-700 rounded-lg text-sm outline-none focus:border-ccs-red bg-gray-800 text-gray-100"
                  placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-700 rounded-lg text-sm outline-none focus:border-ccs-red bg-gray-800 text-gray-100"
                  placeholder="you@example.com" />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button onClick={handleSend} disabled={sending}
                className="w-full py-3 bg-ccs-red hover:bg-ccs-red-dark text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60">
                {sending ? 'Sending…' : 'Send My Report →'}
              </button>
              <p className="text-xs text-gray-500 text-center">
                We'll BCC the CCS install team so they can prepare your custom quote.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Wizard Component ─────────────────────────────────────────────────────
export default function WizardCalculator({ onExit }) {
  const [step, setStep] = useState('gas-make')
  const [evVehicles, setEvVehicles] = useState([])
  const [utilities, setUtilities]   = useState([])

  // Gas vehicle
  const [gasMake,  setGasMake]    = useState(null)
  const [gasYear,  setGasYear]    = useState(null)
  const [gasModel, setGasModel]   = useState(null)
  const [gasVehicle, setGasVehicle] = useState(null)

  // EV vehicle
  const [evMake,   setEvMake]     = useState(null)
  const [evModel,  setEvModel]    = useState(null)
  const [evVehicle, setEvVehicle] = useState(null)

  // Inputs
  const [milesPerDay,  setMilesPerDay]  = useState(35)
  const [electricRate, setElectricRate] = useState(null)
  const [utilityId,    setUtilityId]    = useState(null)
  const [gasPrice,     setGasPrice]     = useState(null)
  const [gasPriceOverride, setGasPriceOverride] = useState(null)

  // Charger install (optional)
  const [installEnabled, setInstallEnabled] = useState(false)
  const [installLoc, setInstallLoc] = useState(INSTALL_LOCATIONS[0])
  const [installSlider, setInstallSlider] = useState(INSTALL_LOCATIONS[0].min)
  const [includeCharger, setIncludeCharger] = useState(false)

  // TCO (optional)
  const [tcoEnabled, setTcoEnabled] = useState(false)
  const [gasPayment,    setGasPayment]    = useState(500)
  const [gasInsurance,  setGasInsurance]  = useState(150)
  const [gasMaintenance,setGasMaintenance]= useState(100)
  const [newCarCost,    setNewCarCost]    = useState(45000)
  const [tradeIn,       setTradeIn]       = useState(0)
  const [tavtRate,      setTavtRate]      = useState(7)
  const [loanTerm,      setLoanTerm]      = useState(60)
  const [apr,           setApr]           = useState(6.5)
  const [evInsurance,   setEvInsurance]   = useState(160)
  const [evMaintenance, setEvMaintenance] = useState(42)

  // Email dialog
  const [showEmail, setShowEmail] = useState(false)

  // Track confetti firing once per results visit
  const confettiFired = useRef(false)

  // Load EV data + utilities
  useEffect(() => {
    fetch('/data/ev-vehicles.json').then(r => r.json()).then(setEvVehicles).catch(() => {})
    fetch('/data/utilities.json').then(r => r.json()).then(setUtilities).catch(() => {})
  }, [])

  // Fetch gas price for the right grade using shared utility (SGA → R1Z → fallback)
  useEffect(() => {
    const grade = gasVehicle ? getFuelType(gasVehicle) : 'regular'
    fetchGasPrice(grade).then(v => {
      setGasPrice(v ?? GAS_PRICE_FALLBACKS[grade])
      setGasPriceOverride(null)
    })
  }, [gasVehicle?.make, gasVehicle?.model, gasVehicle?.trim])

  // Auto-populate MSRP and trade-in when vehicles change
  useEffect(() => {
    if (evVehicle) setNewCarCost(getEvMsrp(evVehicle))
  }, [evVehicle])
  useEffect(() => {
    if (gasVehicle) setTradeIn(estimateTradeIn(gasVehicle))
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

  // Auto-advance single-option trims
  useEffect(() => {
    if (step === 'gas-trim' && gasTrims.length === 1) {
      setGasVehicle(gasTrims[0])
      setTimeout(() => setStep('ev-make'), 350)
    }
  }, [step, gasTrims])
  useEffect(() => {
    if (step === 'ev-trim' && evTrims.length === 1) {
      setEvVehicle(evTrims[0])
      setTimeout(() => setStep('miles'), 350)
    }
  }, [step, evTrims])

  // Fire confetti when results show
  useEffect(() => {
    if (step === 'results' && !confettiFired.current) {
      confettiFired.current = true
      setTimeout(fireConfetti, 200)
    }
    if (step !== 'results') confettiFired.current = false
  }, [step])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goBack = () => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }
  const goNext = () => {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  // ── Computed values ─────────────────────────────────────────────────────────
  const effectiveGasPrice = gasPriceOverride ?? gasPrice ?? 3.10
  const calc = useMemo(() => {
    if (!gasVehicle || !evVehicle || !electricRate) return null
    return calcSavings({ gasVehicle, evVehicle, electricRate, gasPrice: effectiveGasPrice, milesPerDay })
  }, [gasVehicle, evVehicle, electricRate, effectiveGasPrice, milesPerDay])

  const installData = useMemo(() => {
    if (!installEnabled || !calc) return null
    const cost = installSlider + (includeCharger ? CHARGER_HW_COST : 0)
    const monthlySav = calc.monthlySavings
    const paybackMonths = monthlySav > 0 ? cost / monthlySav : null
    return {
      cost,
      paybackMonths,
      payback: paybackMonths != null
        ? `${Math.ceil(paybackMonths)} months (${(paybackMonths/12).toFixed(1)} years)`
        : null,
    }
  }, [installEnabled, installSlider, includeCharger, calc])

  const tcoData = useMemo(() => {
    if (!tcoEnabled || !calc) return null
    const netCost = Math.max(0, newCarCost - tradeIn)
    const tavt = netCost * (tavtRate / 100)
    const totalFinanced = netCost + tavt
    const tradeInTaxSavings = tradeIn * (tavtRate / 100)
    const evPayment = calcMonthlyPayment(totalFinanced, apr, loanTerm)
    const monthlyGasFuel = calc.annualGasCost / 12
    const monthlyEvFuel  = calc.annualElectricCost / 12
    const gasMonthlyTCO  = gasPayment + gasInsurance + monthlyGasFuel + gasMaintenance
    const evMonthlyTCO   = evPayment + evInsurance + monthlyEvFuel + evMaintenance
    const monthlyTCOSavings = gasMonthlyTCO - evMonthlyTCO
    return {
      gasPayment, gasInsurance, gasMaintenance,
      evPayment, evInsurance, evMaintenance,
      monthlyGasFuel, monthlyEvFuel,
      gasMonthlyTCO, evMonthlyTCO,
      monthlyTCOSavings, annualTCOSavings: monthlyTCOSavings * 12,
      tavt, tradeInTaxSavings, totalFinanced, netCost,
      newCarCost, tradeIn, tavtRate, apr, loanTerm,
    }
  }, [tcoEnabled, calc, gasPayment, gasInsurance, gasMaintenance,
      newCarCost, tradeIn, tavtRate, apr, loanTerm, evInsurance, evMaintenance])

  // ── Render: each step ──────────────────────────────────────────────────────

  if (step === 'gas-make') return (
    <StepShell step={step} onExit={onExit} title="What's the make of your current vehicle?">
      <MakeGrid makes={gasMakes} selected={gasMake} onSelect={m => {
        setGasMake(m); setGasYear(null); setGasModel(null); setGasVehicle(null)
        setTimeout(() => setStep('gas-year'), 200)
      }} />
    </StepShell>
  )

  if (step === 'gas-year') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title={`What year is your ${gasMake}?`}>
      <YearGrid years={gasYears} selected={gasYear} onSelect={y => {
        setGasYear(y); setGasModel(null); setGasVehicle(null)
        setTimeout(() => setStep('gas-model'), 200)
      }} />
    </StepShell>
  )

  if (step === 'gas-model') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title={`Which ${gasYear} ${gasMake} model?`}>
      <OptionList items={gasModels} selected={gasModel} onSelect={m => {
        setGasModel(m); setGasVehicle(null)
        setTimeout(() => setStep('gas-trim'), 200)
      }} />
    </StepShell>
  )

  if (step === 'gas-trim') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title="Which trim?" subtitle={`${gasYear} ${gasMake} ${gasModel}`}>
      {gasTrims.length === 1 ? (
        <div className="mt-4 rounded-xl border-2 border-ccs-red bg-red-950/50 px-4 py-4 text-ccs-red text-sm font-semibold">
          ✓ {gasTrims[0].trim} — auto-selected
        </div>
      ) : (
        <OptionList items={gasTrims} selected={gasVehicle?.trim} getLabel={t => t.trim}
          getSub={t => {
            const ft = getFuelType(t)
            return `${t.mpg} MPG combined${ft !== 'regular' ? ` · ${FUEL_LABELS[ft]}` : ''}`
          }}
          onSelect={t => { setGasVehicle(t); setTimeout(() => setStep('ev-make'), 200) }}
        />
      )}
    </StepShell>
  )

  if (step === 'ev-make') return (
    <StepShell step={step} onBack={goBack} onExit={onExit}
      title="Which EV are you considering?" subtitle="Select the make">
      {gasVehicle && (
        <div className="mb-4 text-xs text-gray-400 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
          ✓ <span className="font-semibold text-gray-200">{gasVehicle.year} {gasVehicle.make} {gasVehicle.model} {gasVehicle.trim}</span> · {gasVehicle.mpg} MPG · {FUEL_LABELS[getFuelType(gasVehicle)]}
        </div>
      )}
      <MakeGrid makes={evMakes} selected={evMake} onSelect={m => {
        setEvMake(m); setEvModel(null); setEvVehicle(null)
        setTimeout(() => setStep('ev-model'), 200)
      }} />
    </StepShell>
  )

  if (step === 'ev-model') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title={`Which ${evMake} model?`} subtitle="Showing latest model year available">
      <OptionList items={evModels} selected={evModel}
        getLabel={e => e.model} getSub={e => `${e.year}`}
        onSelect={e => { setEvModel(e.model); setEvVehicle(null); setTimeout(() => setStep('ev-trim'), 200) }} />
    </StepShell>
  )

  if (step === 'ev-trim') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title="Which trim / configuration?" subtitle={`${evMake} ${evModel}`}>
      {evTrims.length === 1 ? (
        <div className="mt-4 rounded-xl border-2 border-ccs-red bg-red-950/50 px-4 py-4 text-ccs-red text-sm font-semibold">
          ✓ {evTrims[0].trim} — auto-selected
        </div>
      ) : (
        <OptionList items={evTrims} selected={evVehicle?.trim} getLabel={t => t.trim}
          getSub={t => `${t.miPerKWh} mi/kWh · ${t.rangeMi} mi range`}
          onSelect={t => { setEvVehicle(t); setTimeout(() => setStep('miles'), 200) }} />
      )}
    </StepShell>
  )

  if (step === 'miles') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title="How many miles do you drive per day?" subtitle="Your average — no need to be exact">
      <div className="mt-4 space-y-6">
        <div className="flex gap-2 flex-wrap">
          {MILES_PRESETS.map(p => (
            <button key={p.value} onClick={() => setMilesPerDay(p.value)}
              className={`flex-1 min-w-[70px] py-4 rounded-xl border-2 text-base font-bold transition-all ${
                milesPerDay === p.value ? 'border-ccs-red bg-red-950/50 text-ccs-red' : 'border-gray-700 bg-gray-900 text-gray-300'
              }`}>{p.label}</button>
          ))}
        </div>
        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>5 mi</span>
            <span className="text-2xl font-bold text-white">{milesPerDay} mi/day</span>
            <span>150 mi</span>
          </div>
          <input type="range" min={5} max={150} step={5} value={milesPerDay}
            onChange={e => setMilesPerDay(+e.target.value)} className="w-full accent-ccs-red" />
          <p className="text-xs text-gray-500 text-center mt-1">{(milesPerDay * 365).toLocaleString()} miles/year</p>
        </div>
        <button onClick={goNext} className="w-full py-4 bg-ccs-red text-white rounded-xl font-bold text-base hover:bg-ccs-red-dark transition-colors">
          Continue →
        </button>
      </div>
    </StepShell>
  )

  if (step === 'utility') return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title="Who's your electric utility?" subtitle="Sets your charging cost per kWh">
      <div className="mt-2 space-y-2">
        {utilities.map(u => (
          <button key={u.id}
            onClick={() => { setUtilityId(u.id); setElectricRate(u.standardRate); setTimeout(goNext, 200) }}
            className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all ${
              utilityId === u.id ? 'border-ccs-red bg-red-950/50' : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }`}>
            <div className={`font-semibold text-sm ${utilityId === u.id ? 'text-ccs-red' : 'text-gray-200'}`}>{u.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              ${u.standardRate.toFixed(4)}/kWh standard
              {u.hasTou && ` · TOU off-peak $${u.touOffPeakRate.toFixed(4)}/kWh`}
            </div>
          </button>
        ))}
        <button onClick={() => { setUtilityId('other'); setElectricRate(0.12); setTimeout(goNext, 200) }}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${utilityId === 'other' ? 'border-ccs-red bg-red-950/50' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}>
          <div className={`font-semibold text-sm ${utilityId === 'other' ? 'text-ccs-red' : 'text-gray-200'}`}>Other / Not sure</div>
          <div className="text-xs text-gray-500">Uses $0.12/kWh — GA average</div>
        </button>
      </div>
    </StepShell>
  )

  if (step === 'install') return (
    <StepShell step={step} onBack={goBack} onExit={onExit}
      title="Want to include charger installation costs?"
      subtitle="See exactly when your install pays for itself in fuel savings.">
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setInstallEnabled(true)}
            className={`py-4 rounded-xl border-2 font-semibold transition-all ${installEnabled ? 'border-ccs-red bg-red-950/50 text-ccs-red' : 'border-gray-700 bg-gray-900 text-gray-300'}`}>
            Yes, add it
          </button>
          <button onClick={() => { setInstallEnabled(false); setTimeout(goNext, 200) }}
            className={`py-4 rounded-xl border-2 font-semibold transition-all ${!installEnabled ? 'border-gray-600 bg-gray-800 text-gray-300' : 'border-gray-700 bg-gray-900 text-gray-500'}`}>
            Skip for now
          </button>
        </div>

        {installEnabled && (
          <div className="space-y-4 mt-4 border-t-2 border-gray-800 pt-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Panel / Charger Location</label>
              <div className="grid grid-cols-2 gap-2">
                {INSTALL_LOCATIONS.map(loc => (
                  <button key={loc.id} onClick={() => { setInstallLoc(loc); setInstallSlider(loc.min) }}
                    className={`text-left px-3 py-2.5 rounded-lg border-2 text-sm transition-all ${
                      installLoc.id === loc.id ? 'border-ccs-red bg-red-950/50 text-ccs-red font-medium' : 'border-gray-700 bg-gray-900 text-gray-300'
                    }`}>
                    <div className="font-medium">{loc.label}</div>
                    <div className="text-xs text-gray-500">${loc.min.toLocaleString()}–${loc.max.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Charger Hardware</label>
              <div className="flex gap-2">
                <button onClick={() => setIncludeCharger(true)}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium ${includeCharger ? 'border-ccs-red bg-red-950/50 text-ccs-red' : 'border-gray-700 bg-gray-900 text-gray-400'}`}>
                  Yes (+$500)
                </button>
                <button onClick={() => setIncludeCharger(false)}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium ${!includeCharger ? 'border-ccs-red bg-red-950/50 text-ccs-red' : 'border-gray-700 bg-gray-900 text-gray-400'}`}>
                  I have one
                </button>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Installation Cost</label>
                <span className="text-xl font-bold text-white">${(installSlider + (includeCharger ? CHARGER_HW_COST : 0)).toLocaleString()}</span>
              </div>
              <input type="range" min={installLoc.min} max={installLoc.max} step={50}
                value={installSlider} onChange={e => setInstallSlider(+e.target.value)}
                className="w-full accent-ccs-red" />
            </div>
          </div>
        )}

        <button onClick={goNext} className="w-full py-4 bg-ccs-red text-white rounded-xl font-bold text-base hover:bg-ccs-red-dark transition-colors mt-2">
          Continue →
        </button>
      </div>
    </StepShell>
  )

  if (step === 'tco') return (
    <StepShell step={step} onBack={goBack} onExit={onExit}
      title="See your full Total Cost of Ownership?"
      subtitle="Compare all-in monthly costs: payment + insurance + fuel + maintenance.">
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setTcoEnabled(true)}
            className={`py-4 rounded-xl border-2 font-semibold transition-all ${tcoEnabled ? 'border-ccs-red bg-red-950/50 text-ccs-red' : 'border-gray-700 bg-gray-900 text-gray-300'}`}>
            Yes, compare TCO
          </button>
          <button onClick={() => { setTcoEnabled(false); setTimeout(goNext, 200) }}
            className={`py-4 rounded-xl border-2 font-semibold transition-all ${!tcoEnabled ? 'border-gray-600 bg-gray-800 text-gray-300' : 'border-gray-700 bg-gray-900 text-gray-500'}`}>
            Skip for now
          </button>
        </div>

        {tcoEnabled && (
          <div className="space-y-5 mt-4 border-t-2 border-gray-800 pt-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-ccs-red" />
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Your Current Gas Vehicle</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <NumField label="Monthly Car Payment" prefix="$" value={gasPayment} onChange={setGasPayment} hint="Enter $0 if paid off" />
                <NumField label="Monthly Insurance"    prefix="$" value={gasInsurance} onChange={setGasInsurance} />
                <NumField label="Monthly Maintenance" prefix="$" value={gasMaintenance} onChange={setGasMaintenance} hint="Avg gas car: ~$100/mo" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">New Electric Vehicle</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <NumField label={`MSRP — ${evVehicle?.year} ${evVehicle?.make} ${evVehicle?.model}`} prefix="$" value={newCarCost} onChange={setNewCarCost} step={500} hint="Pre-filled with current MSRP — adjust to actual purchase price" />
                <NumField label={`Trade-In Value — ${gasVehicle?.year} ${gasVehicle?.make} ${gasVehicle?.model}`} prefix="$" value={tradeIn} onChange={setTradeIn} step={250} hint="Estimated by age/segment — reduces loan AND ad valorem tax" />
                <NumField label="Ad Valorem Tax Rate" suffix="%" value={tavtRate} onChange={setTavtRate} step={0.1} hint="GA TAVT: 7% of net vehicle value (purchase − trade-in)" />
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Loan Term</label>
                  <div className="flex gap-2 flex-wrap">
                    {LOAN_TERMS.map(t => (
                      <button key={t} onClick={() => setLoanTerm(t)}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          loanTerm === t ? 'border-ccs-red bg-red-950/50 text-ccs-red' : 'border-gray-700 bg-gray-900 text-gray-400'
                        }`}>{t} mo</button>
                    ))}
                  </div>
                </div>
                <NumField label="APR" suffix="%" value={apr} onChange={setApr} step={0.1} />
                <NumField label="Monthly Insurance (EV)" prefix="$" value={evInsurance} onChange={setEvInsurance} />
                <NumField label="Monthly Maintenance (EV)" prefix="$" value={evMaintenance} onChange={setEvMaintenance} hint="Avg EV: ~$42/mo (no oil changes!)" />
              </div>
            </div>
            {tcoData && (
              <div className="rounded-xl bg-green-900/20 border-2 border-green-700 p-4 text-sm">
                <div className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">Your Estimated EV Loan</div>
                <div className="space-y-1 text-gray-300">
                  <div className="flex justify-between"><span>Net cost (price − trade-in)</span><span className="font-semibold">{fmt(tcoData.netCost)}</span></div>
                  <div className="flex justify-between"><span>+ Ad Valorem Tax ({tavtRate}%)</span><span className="font-semibold">{fmt(tcoData.tavt)}</span></div>
                  <div className="flex justify-between border-t border-green-700 pt-1.5 font-bold text-white"><span>Total Financed</span><span>{fmt(tcoData.totalFinanced)}</span></div>
                  {tcoData.tradeInTaxSavings > 0 && (
                    <div className="text-xs text-green-400 mt-1.5">✓ Trade-in saved you {fmt(tcoData.tradeInTaxSavings)} in TAVT</div>
                  )}
                  <div className="flex justify-between border-t border-green-700 pt-2 mt-1 text-green-400 font-bold text-base"><span>Monthly Payment</span><span>{fmt(tcoData.evPayment)}/mo</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={goNext} className="w-full py-4 bg-ccs-red text-white rounded-xl font-bold text-base hover:bg-ccs-red-dark transition-colors mt-2">
          See My Results →
        </button>
      </div>
    </StepShell>
  )

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (step === 'results' && calc) {
    const { annualMiles, annualGallons, annualGasCost, annualKWh, annualElectricCost,
            annualSavings, monthlySavings, pctSavings, co2SavedLbs, treesEquiv } = calc
    const positive  = annualSavings > 0
    const fuelType  = getFuelType(gasVehicle)
    const fuelLabel = FUEL_LABELS[fuelType]
    const costPerMileGas = annualGasCost / annualMiles
    const costPerMileEV  = annualElectricCost / annualMiles
    const yearRows = [1,2,3,5,7,10].map(y => ({
      y, gas: annualGasCost * y, ev: annualElectricCost * y, saved: annualSavings * y,
    }))

    return (
      <div className="min-h-screen bg-[#0D0D0D]">
        <Progress step="results" />

        {/* Congratulations banner */}
        {positive && (
          <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-6 px-4 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h1 className="text-2xl sm:text-3xl font-bold">Congratulations!</h1>
            <p className="text-sm sm:text-base text-green-100 mt-1">
              You could save <span className="font-bold">{fmt(annualSavings)}/year</span> by going electric
            </p>
          </div>
        )}
        {!positive && (
          <div className="bg-amber-900/40 text-amber-300 py-5 px-4 text-center border-b border-amber-700">
            <h1 className="text-xl font-bold">EV fueling costs more with these inputs</h1>
            <p className="text-xs mt-1 text-amber-400">Try a more efficient EV or check your utility's TOU rate.</p>
          </div>
        )}

        {/* Header */}
        <div className="max-w-3xl mx-auto px-4 pt-5 pb-2 flex items-center justify-between">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Your Results</p>
          <button onClick={onExit} className="text-xs text-gray-500 hover:text-gray-300">Classic View →</button>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-16 space-y-5">

          {/* Email + Quote CTAs (top) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => setShowEmail(true)}
              className="py-4 px-4 bg-ccs-red hover:bg-ccs-red-dark text-white rounded-xl font-bold text-base transition-colors shadow-md flex items-center justify-center gap-2">
              📧 Email My Results
            </button>
            <a href={HCP_LEAD_URL} target="_blank" rel="noopener noreferrer"
              className="py-4 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-md flex items-center justify-center gap-2">
              📅 Book Free Quote
            </a>
          </div>

          {/* Summary cards */}
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

          {/* % Reduction */}
          <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${positive ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
            <span className={`text-sm font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>Fuel Cost Reduction</span>
            <span className={`text-2xl font-bold ${positive ? 'text-green-400' : 'text-red-400'}`}>{positive ? '▼ ' : '▲ '}{fmtPct(pctSavings)}</span>
          </div>

          {/* Vehicle comparison */}
          <div className="card">
            <h3 className="text-base font-bold text-white mb-3">Vehicle Comparison</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-red-900/20 border border-red-800 p-3">
                <div className="text-xs text-red-400 font-semibold uppercase mb-1">Gas Vehicle</div>
                <div className="text-sm font-bold text-white">{gasVehicle.year} {gasVehicle.make}</div>
                <div className="text-sm text-gray-300">{gasVehicle.model}</div>
                <div className="text-xs text-gray-500 mt-0.5">{gasVehicle.trim}</div>
                <div className="mt-2 space-y-1 text-xs text-gray-400">
                  <div><span className="font-medium">{gasVehicle.mpg} MPG</span> combined</div>
                  <div><span className="font-medium">{fuelLabel}</span> fuel @ ${effectiveGasPrice.toFixed(3)}/gal</div>
                  <div>Cost/mile: <span className="font-medium">${costPerMileGas.toFixed(3)}</span></div>
                </div>
              </div>
              <div className="rounded-lg bg-green-900/20 border border-green-800 p-3">
                <div className="text-xs text-green-500 font-semibold uppercase mb-1">Electric Vehicle</div>
                <div className="text-sm font-bold text-white">{evVehicle.year} {evVehicle.make}</div>
                <div className="text-sm text-gray-300">{evVehicle.model}</div>
                <div className="text-xs text-gray-500 mt-0.5">{evVehicle.trim}</div>
                <div className="mt-2 space-y-1 text-xs text-gray-400">
                  <div><span className="font-medium">{evVehicle.miPerKWh} mi/kWh</span> · {evVehicle.rangeMi} mi range</div>
                  <div>Rate: <span className="font-medium">${electricRate.toFixed(4)}/kWh</span></div>
                  <div>Cost/mile: <span className="font-medium">${costPerMileEV.toFixed(3)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Annual usage */}
          <div className="card">
            <h3 className="text-base font-bold text-white mb-3">Annual Usage & Cost Breakdown</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Miles driven per year', annualMiles.toLocaleString() + ' mi', null],
                ['Gallons of gas burned', Math.round(annualGallons).toLocaleString() + ' gal', 'text-red-400'],
                ['Annual fuel cost (gas)', fmt(annualGasCost), 'text-red-400'],
                ['kWh of electricity used', Math.round(annualKWh).toLocaleString() + ' kWh', null],
                ['Annual charging cost (EV)', fmt(annualElectricCost), 'text-green-500'],
                ['Annual savings', fmt(annualSavings), positive ? 'text-green-400 font-bold' : 'text-red-400 font-bold'],
              ].map(([label, val, cls]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-800 last:border-0">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-semibold ${cls || 'text-gray-200'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Charger Install */}
          {installData && (
            <div className="card border-2 border-blue-700 bg-blue-900/20">
              <h3 className="text-base font-bold text-blue-300 mb-2">Charger Installation Payback</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-blue-400 font-semibold uppercase">Total Install</div>
                  <div className="text-xl font-bold text-blue-200">{fmt(installData.cost)}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-400 font-semibold uppercase">Pays for itself in</div>
                  <div className="text-xl font-bold text-blue-200">{installData.payback || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* TCO */}
          {tcoData && (
            <div className="card">
              <h3 className="text-base font-bold text-white mb-1">Total Cost of Ownership (Monthly)</h3>
              <p className="text-xs text-gray-500 mb-3">All-in: payment + insurance + fuel + maintenance</p>
              {tcoData.tradeInTaxSavings > 0 && (
                <div className="rounded-lg bg-green-900/20 border border-green-700 px-4 py-2 flex items-center justify-between mb-3">
                  <span className="text-xs text-green-400 font-medium">Trade-in tax savings (TAVT)</span>
                  <span className="text-sm font-bold text-green-400">{fmt(tcoData.tradeInTaxSavings)}</span>
                </div>
              )}
              <div className="grid grid-cols-3 text-xs font-semibold uppercase text-gray-500 pb-1.5 border-b border-gray-700 mb-0.5">
                <span /><span className="text-center text-red-400">Gas</span><span className="text-center text-green-500">Electric</span>
              </div>
              {[
                ['Car Payment',      tcoData.gasPayment,    tcoData.evPayment],
                ['Insurance',        tcoData.gasInsurance,  tcoData.evInsurance],
                ['Fuel/Electricity', tcoData.monthlyGasFuel, tcoData.monthlyEvFuel],
                ['Maintenance',      tcoData.gasMaintenance, tcoData.evMaintenance],
              ].map(([label, g, e]) => (
                <div key={label} className="grid grid-cols-3 text-sm py-2 border-b border-gray-800">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-center font-medium text-red-400">{fmt(g)}</span>
                  <span className="text-center font-medium text-green-500">{fmt(e)}</span>
                </div>
              ))}
              <div className="grid grid-cols-3 text-sm pt-3 border-t border-gray-700">
                <span className="font-bold text-gray-300">Monthly Total</span>
                <span className="text-center text-xl font-bold text-red-400">{fmt(tcoData.gasMonthlyTCO)}</span>
                <span className="text-center text-xl font-bold text-green-500">{fmt(tcoData.evMonthlyTCO)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className={`rounded-xl p-3 text-center ${tcoData.monthlyTCOSavings > 0 ? 'bg-green-600' : 'bg-ccs-red'}`}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/80 mb-1">Monthly TCO Savings</div>
                  <div className="text-xl font-bold text-white">{fmt(tcoData.monthlyTCOSavings)}</div>
                </div>
                <div className={`rounded-xl p-3 text-center ${tcoData.annualTCOSavings > 0 ? 'bg-green-600' : 'bg-ccs-red'}`}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/80 mb-1">Annual TCO Savings</div>
                  <div className="text-xl font-bold text-white">{fmt(tcoData.annualTCOSavings)}</div>
                </div>
              </div>
            </div>
          )}

          {/* 10-yr projection */}
          <div className="card">
            <h3 className="text-base font-bold text-white mb-3">Cumulative Cost Projection</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-gray-700">
                    <th className="text-left pb-2 font-semibold">Year</th>
                    <th className="text-right pb-2 font-semibold text-red-400">Gas Total</th>
                    <th className="text-right pb-2 font-semibold text-green-500">EV Total</th>
                    <th className="text-right pb-2 font-semibold text-gray-400">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {yearRows.map(({ y, gas, ev, saved }) => (
                    <tr key={y} className="border-b border-gray-800 last:border-0">
                      <td className="py-2 font-medium text-gray-300">Yr {y}</td>
                      <td className="py-2 text-right text-red-400 font-medium">{fmt(gas)}</td>
                      <td className="py-2 text-right text-green-500 font-medium">{fmt(ev)}</td>
                      <td className={`py-2 text-right font-bold ${saved > 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(saved)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Environmental */}
          {positive && (
            <div className="card bg-green-900/20 border border-green-700">
              <h3 className="text-base font-bold text-green-300 mb-3">Environmental Impact (Annual)</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">{Math.round(co2SavedLbs / 2000 * 10) / 10}</div>
                  <div className="text-xs text-green-500 mt-1">tons CO₂ avoided</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{treesEquiv.toLocaleString()}</div>
                  <div className="text-xs text-green-500 mt-1">trees equivalent</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{Math.round(annualGallons).toLocaleString()}</div>
                  <div className="text-xs text-green-500 mt-1">gallons not burned</div>
                </div>
              </div>
            </div>
          )}

          {/* Assumptions */}
          <div className="card border border-gray-700">
            <h3 className="text-base font-bold text-white mb-3">Assumptions Used</h3>
            <div className="space-y-1.5 text-xs text-gray-400">
              {[
                [`Gas price (${fuelLabel})`, `$${effectiveGasPrice.toFixed(3)}/gal`],
                [`Electricity rate`, `$${electricRate.toFixed(4)}/kWh`],
                [`Daily miles`, `${milesPerDay} mi/day`],
                [`Annual miles`, `${annualMiles.toLocaleString()} mi`],
                [`Gas vehicle efficiency`, `${gasVehicle.mpg} MPG`],
                [`EV efficiency`, `${evVehicle.miPerKWh} mi/kWh`],
                [`CO₂ per gallon of gas`, `19.59 lbs (EPA)`],
                [`GA grid carbon intensity`, `0.41 kg CO₂/kWh (EPA eGRID)`],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between border-b border-gray-800 pb-1.5 last:border-0">
                  <span>{k}</span><span className="font-medium text-gray-200">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <label className="text-xs font-medium text-gray-400">Adjust gas price:</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">$</span>
                <input type="number" step="0.01" min="0"
                  value={gasPriceOverride ?? gasPrice ?? ''}
                  onChange={e => setGasPriceOverride(+e.target.value || null)}
                  className="w-24 border border-gray-700 rounded-lg px-2 py-1 text-sm bg-gray-800 text-gray-100 outline-none focus:border-ccs-red" />
                {gasPriceOverride && (
                  <button onClick={() => setGasPriceOverride(null)} className="text-xs text-ccs-red hover:underline">Reset</button>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <CTA />

          {/* Back/Classic */}
          <div className="flex gap-3">
            <button onClick={() => setStep('utility')} className="flex-1 py-3 border-2 border-gray-700 rounded-xl text-sm font-medium text-gray-400 hover:border-gray-600">
              ← Adjust inputs
            </button>
            <button onClick={onExit} className="flex-1 py-3 border-2 border-gray-700 rounded-xl text-sm font-medium text-gray-400 hover:border-gray-600">
              Classic view
            </button>
          </div>
        </div>

        {/* Email Dialog */}
        <EmailDialog
          open={showEmail} onClose={() => setShowEmail(false)}
          calc={calc} gasVehicle={gasVehicle} evVehicle={evVehicle}
          electricRate={electricRate} gasPrice={effectiveGasPrice} milesPerDay={milesPerDay}
          tco={tcoData} install={installData} fuelLabel={fuelLabel}
        />
      </div>
    )
  }

  return (
    <StepShell step={step} onBack={goBack} onExit={onExit} title="One moment…">
      <p className="text-gray-500 text-sm mt-4">Loading data, please wait…</p>
    </StepShell>
  )
}
