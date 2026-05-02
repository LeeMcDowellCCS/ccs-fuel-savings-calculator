function fmt(n) {
  const abs = Math.abs(Math.round(n))
  return (n < 0 ? '-' : '') + '$' + abs.toLocaleString()
}

function fmtPct(n) {
  return Math.abs(Math.round(n)) + '%'
}

function SavingsCard({ label, value, positive }) {
  const bg = positive ? 'bg-green-600' : 'bg-ccs-red'
  return (
    <div className={`rounded-xl p-4 text-center ${bg}`}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-white/80">{label}</div>
      <div className="text-2xl font-bold text-white">{fmt(value)}</div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl p-4 text-center bg-gray-50 border border-gray-100">
      <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-ccs-black">{value}</div>
    </div>
  )
}

function TcoRow({ label, gasVal, evVal }) {
  return (
    <div className="grid grid-cols-3 text-sm py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-center font-medium text-red-600">{fmt(gasVal)}</span>
      <span className="text-center font-medium text-green-600">{fmt(evVal)}</span>
    </div>
  )
}

export default function Results({ calc, tco }) {
  const { annualGasCost, annualElectricCost, annualSavings, monthlySavings, installCost, paybackMonths } = calc
  const positive = annualSavings > 0
  const pctSavings = annualGasCost > 0 ? (annualSavings / annualGasCost) * 100 : 0

  return (
    <div className="card border-2 border-ccs-red space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ccs-black mb-1">Your Estimated Savings</h2>
        <p className="text-sm text-gray-500">Switching from gas to electric.</p>
      </div>

      {/* Monthly + Annual savings — color based on direction */}
      <div className="grid grid-cols-2 gap-3">
        <SavingsCard label="Monthly Savings" value={monthlySavings} positive={positive} />
        <SavingsCard label="Annual Savings" value={annualSavings} positive={positive} />
      </div>

      {/* 5- and 10-year */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="5-Year Savings" value={fmt(annualSavings * 5)} />
        <StatCard label="10-Year Savings" value={fmt(annualSavings * 10)} />
      </div>

      {/* Percentage savings banner */}
      <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${positive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <span className={`text-sm font-medium ${positive ? 'text-green-800' : 'text-red-800'}`}>
          Fuel Cost Reduction vs. Gas
        </span>
        <span className={`text-xl font-bold ${positive ? 'text-green-700' : 'text-red-700'}`}>
          {positive ? '▼ ' : '▲ '}{fmtPct(pctSavings)}
        </span>
      </div>

      {/* Annual cost breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-red-50 p-3 text-center">
          <div className="text-xs text-gray-500 font-medium mb-0.5">Annual Gas Cost</div>
          <div className="text-lg font-bold text-red-600">{fmt(annualGasCost)}</div>
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <div className="text-xs text-gray-500 font-medium mb-0.5">Annual EV Cost</div>
          <div className="text-lg font-bold text-green-600">{fmt(annualElectricCost)}</div>
        </div>
      </div>

      {/* Charger payback */}
      {installCost != null && paybackMonths != null && paybackMonths > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-center">
          <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Charger Payback Period</div>
          <div className="text-2xl font-bold text-blue-900">{Math.ceil(paybackMonths)} months</div>
          <div className="text-sm text-blue-700">
            ({(paybackMonths / 12).toFixed(1)} years) on a ${installCost.toLocaleString()} install
          </div>
        </div>
      )}

      {/* TCO Section */}
      {tco && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-base font-bold text-ccs-black mb-3">Total Cost of Ownership (Monthly)</h3>

          {/* Headers */}
          <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-wide text-gray-400 pb-1 border-b border-gray-200 mb-1">
            <span />
            <span className="text-center text-red-500">Gas Vehicle</span>
            <span className="text-center text-green-600">Electric</span>
          </div>

          <TcoRow label="Car Payment" gasVal={tco.gasPayment} evVal={tco.evPayment} />
          <TcoRow label="Fuel / Electricity" gasVal={tco.monthlyGasFuel} evVal={tco.monthlyEvFuel} />
          <TcoRow label="Maintenance" gasVal={tco.gasMaintenance} evVal={tco.evMaintenance} />

          {/* Totals row */}
          <div className="grid grid-cols-3 text-sm pt-2 mt-1">
            <span className="font-bold text-gray-700">Monthly Total</span>
            <span className="text-center text-lg font-bold text-red-600">{fmt(tco.gasMonthlyTCO)}</span>
            <span className="text-center text-lg font-bold text-green-600">{fmt(tco.evMonthlyTCO)}</span>
          </div>

          {/* TCO savings cards */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <SavingsCard label="Monthly TCO Savings" value={tco.monthlyTCOSavings} positive={tco.monthlyTCOSavings > 0} />
            <SavingsCard label="Annual TCO Savings" value={tco.annualTCOSavings} positive={tco.annualTCOSavings > 0} />
          </div>

          {tco.annualTCOSavings > 0 && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Even with a new EV loan, your estimated all-in monthly cost is{' '}
              <span className="text-green-700 font-semibold">{fmt(Math.abs(tco.monthlyTCOSavings))} less per month</span> than your current gas vehicle.
            </p>
          )}
          {tco.annualTCOSavings <= 0 && (
            <p className="text-xs text-gray-400 text-center mt-3">
              With these inputs the EV has a higher all-in monthly cost. Try adjusting the purchase price, trade-in, or loan term.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
