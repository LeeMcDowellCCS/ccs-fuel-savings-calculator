import { useState, useEffect } from 'react'

const LOAN_TERMS = [24, 36, 48, 60, 72, 84]

function calcMonthlyPayment(principal, aprPct, termMonths) {
  if (principal <= 0) return 0
  const r = aprPct / 100 / 12
  if (r === 0) return principal / termMonths
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

function fmt(n) { return '$' + Math.round(n).toLocaleString() }

function NumericInput({ label, prefix, suffix, value, onChange, min = 0, step = 1, note }) {
  return (
    <div>
      <label className="section-label">{label}</label>
      {note && <p className="text-xs text-gray-400 mb-1">{note}</p>}
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-ccs-red transition-colors">
        {prefix && <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r border-gray-200">{prefix}</span>}
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={e => onChange(Math.max(min, +e.target.value))}
          className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
        />
        {suffix && <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-l border-gray-200">{suffix}</span>}
      </div>
    </div>
  )
}

function LoanBreakdown({ newCarCost, tradeIn, tavtRate, apr, loanTerm, evPayment, totalFinanced, tavt, tradeInTaxSavings }) {
  const netCost = Math.max(0, newCarCost - tradeIn)
  return (
    <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 space-y-2 text-sm">
      <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">EV Purchase Breakdown</div>

      <div className="flex justify-between text-gray-600">
        <span>New EV Price</span>
        <span className="font-medium">{fmt(newCarCost)}</span>
      </div>
      {tradeIn > 0 && (
        <div className="flex justify-between text-green-700">
          <span>− Trade-In Value</span>
          <span className="font-semibold">− {fmt(tradeIn)}</span>
        </div>
      )}
      <div className="flex justify-between text-gray-700 border-t border-green-200 pt-2">
        <span>Net Vehicle Cost</span>
        <span className="font-semibold">{fmt(netCost)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>+ Ad Valorem Tax ({tavtRate}%)</span>
        <span className="font-medium">+ {fmt(tavt)}</span>
      </div>
      <div className="flex justify-between text-gray-800 border-t border-green-200 pt-2 font-bold">
        <span>Total Financed</span>
        <span>{fmt(totalFinanced)}</span>
      </div>

      {tradeIn > 0 && tradeInTaxSavings > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-white border border-green-300 px-3 py-2">
          <span className="text-xs text-green-700 font-medium">Trade-in Tax Savings ({tavtRate}% of {fmt(tradeIn)})</span>
          <span className="text-sm font-bold text-green-700">+ {fmt(tradeInTaxSavings)} saved</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between rounded-lg bg-green-600 text-white px-4 py-2.5">
        <span className="text-xs font-medium opacity-90">
          {totalFinanced > 0
            ? `${fmt(totalFinanced)} at ${apr}% for ${loanTerm} mo`
            : 'Vehicle fully covered by trade-in'}
        </span>
        <span className="text-xl font-bold">{fmt(evPayment)}<span className="text-sm font-normal">/mo</span></span>
      </div>
    </div>
  )
}

export default function TCOCalculator({ enabled, onToggle, onChange }) {
  const [gasPayment, setGasPayment] = useState(500)
  const [gasInsurance, setGasInsurance] = useState(150)
  const [gasMaintenance, setGasMaintenance] = useState(100)

  const [newCarCost, setNewCarCost] = useState(45000)
  const [tradeIn, setTradeIn] = useState(0)
  const [tavtRate, setTavtRate] = useState(7)
  const [loanTerm, setLoanTerm] = useState(60)
  const [apr, setApr] = useState(6.5)
  const [evInsurance, setEvInsurance] = useState(160)
  const [evMaintenance, setEvMaintenance] = useState(42)

  const netCost = Math.max(0, newCarCost - tradeIn)
  const tavt = netCost * (tavtRate / 100)
  const totalFinanced = netCost + tavt
  const tradeInTaxSavings = tradeIn * (tavtRate / 100)
  const evPayment = calcMonthlyPayment(totalFinanced, apr, loanTerm)

  useEffect(() => {
    if (!enabled) { onChange(null); return }
    onChange({
      gasPayment, gasInsurance, gasMaintenance,
      evPayment, evInsurance, evMaintenance,
      tavt, tradeInTaxSavings, totalFinanced,
    })
  }, [enabled, gasPayment, gasInsurance, gasMaintenance, evPayment, evInsurance, evMaintenance, tavt, tradeInTaxSavings, totalFinanced])

  return (
    <div className="card lg:col-span-2">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-colors ${enabled ? 'bg-ccs-red text-white' : 'bg-gray-100 text-gray-600'}`}>7</span>
        <h2 className="text-lg font-semibold text-ccs-black">Total Cost of Ownership</h2>
        <span className="text-xs text-gray-400 font-normal">(optional)</span>
      </div>
      <button onClick={onToggle} className="group">
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${enabled ? 'bg-ccs-red text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
          {enabled ? 'Enabled ✓' : '+ Include Full TCO'}
        </span>
      </button>
      <p className="text-xs text-gray-400 mt-2">
        Compare all-in monthly costs including payment, insurance, fuel, and maintenance — gas vs. electric.
      </p>

      {enabled && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* ── Gas Vehicle ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-ccs-red flex-shrink-0" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Current Gas Vehicle</h3>
              </div>
              <NumericInput
                label="Monthly Car Payment"
                prefix="$"
                value={gasPayment}
                onChange={setGasPayment}
                note="Enter $0 if your car is paid off"
              />
              <NumericInput
                label="Monthly Insurance"
                prefix="$"
                value={gasInsurance}
                onChange={setGasInsurance}
                note="Your current full-coverage premium ÷ 12"
              />
              <NumericInput
                label="Monthly Maintenance"
                prefix="$"
                value={gasMaintenance}
                onChange={setGasMaintenance}
                note="Avg. gas car: ~$100/mo (oil changes, filters, brakes, etc.)"
              />
            </div>

            {/* ── New EV ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-600 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your New Electric Vehicle</h3>
              </div>
              <NumericInput label="Purchase Price" prefix="$" value={newCarCost} onChange={setNewCarCost} step={500} />
              <NumericInput
                label="Trade-In Value"
                prefix="$"
                value={tradeIn}
                onChange={setTradeIn}
                step={500}
                note="Reduces your loan amount and ad valorem tax basis"
              />
              <NumericInput
                label="Ad Valorem / Title Tax Rate"
                suffix="%"
                value={tavtRate}
                onChange={setTavtRate}
                step={0.1}
                min={0}
                note="GA TAVT is 7% of net vehicle value (purchase − trade-in)"
              />
              <div>
                <label className="section-label">Loan Term</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {LOAN_TERMS.map(t => (
                    <button
                      key={t}
                      onClick={() => setLoanTerm(t)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${loanTerm === t ? 'border-ccs-red bg-red-50 text-ccs-red' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {t} mo
                    </button>
                  ))}
                </div>
              </div>
              <NumericInput label="APR" suffix="%" value={apr} onChange={setApr} step={0.1} min={0} />
              <NumericInput
                label="Monthly Insurance (EV)"
                prefix="$"
                value={evInsurance}
                onChange={setEvInsurance}
                note="EVs often insure slightly higher due to repair costs"
              />
              <NumericInput
                label="Monthly Maintenance (EV)"
                prefix="$"
                value={evMaintenance}
                onChange={setEvMaintenance}
                note="Avg. EV: ~$42/mo (tires, wipers, brake fluid — no oil changes)"
              />
            </div>
          </div>

          <LoanBreakdown
            newCarCost={newCarCost}
            tradeIn={tradeIn}
            tavtRate={tavtRate}
            apr={apr}
            loanTerm={loanTerm}
            evPayment={evPayment}
            totalFinanced={totalFinanced}
            tavt={tavt}
            tradeInTaxSavings={tradeInTaxSavings}
          />
        </div>
      )}
    </div>
  )
}
