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
    <div className="rounded-xl p-4 text-center bg-gray-800 border border-gray-700">
      <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

function TcoRow({ label, gasVal, evVal, gasClass = 'text-red-400', evClass = 'text-green-500' }) {
  return (
    <div className="grid grid-cols-3 text-sm py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className={`text-center font-medium ${gasClass}`}>{fmt(gasVal)}</span>
      <span className={`text-center font-medium ${evClass}`}>{fmt(evVal)}</span>
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
        <h2 className="text-xl font-bold text-white mb-1">Your Estimated Savings</h2>
        <p className="text-sm text-gray-400">Switching from gas to electric.</p>
      </div>

      {/* Net monthly impact hero — only when TCO data is available */}
      {tco && (
        <div className={`rounded-xl p-4 text-center border-2 ${tco.monthlyTCOSavings > 0 ? 'border-green-500 bg-green-900/20' : 'border-ccs-red bg-red-900/20'}`}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-400">All-In Monthly Impact</div>
          <div className={`text-3xl font-bold ${tco.monthlyTCOSavings > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {tco.monthlyTCOSavings > 0 ? '▼ ' : '▲ '}{fmt(Math.abs(tco.monthlyTCOSavings))}/mo
          </div>
          <div className="text-xs text-gray-400 mt-1">
            switching {tco.monthlyTCOSavings > 0 ? 'saves you' : 'costs you'} this much all-in each month
          </div>
        </div>
      )}

      {/* Fuel savings section label */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">⛽ Fuel Savings</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      {/* Monthly + Annual fuel savings */}
      <div className="grid grid-cols-2 gap-3">
        <SavingsCard label="Monthly Fuel Savings" value={monthlySavings} positive={positive} />
        <SavingsCard label="Annual Fuel Savings" value={annualSavings} positive={positive} />
      </div>

      {/* 5- and 10-year */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="5-Year Savings" value={fmt(annualSavings * 5)} />
        <StatCard label="10-Year Savings" value={fmt(annualSavings * 10)} />
      </div>

      {/* Fuel cost reduction % */}
      <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${positive ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
        <span className={`text-sm font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
          Fuel Cost Reduction vs. Gas
        </span>
        <span className={`text-xl font-bold ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {positive ? '▼ ' : '▲ '}{fmtPct(pctSavings)}
        </span>
      </div>

      {/* Annual cost breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-red-900/20 p-3 text-center">
          <div className="text-xs text-gray-400 font-medium mb-0.5">Annual Gas Cost</div>
          <div className="text-lg font-bold text-red-400">{fmt(annualGasCost)}</div>
        </div>
        <div className="rounded-lg bg-green-900/20 p-3 text-center">
          <div className="text-xs text-gray-400 font-medium mb-0.5">Annual EV Cost</div>
          <div className="text-lg font-bold text-green-500">{fmt(annualElectricCost)}</div>
        </div>
      </div>

      {/* Charger payback */}
      {installCost != null && paybackMonths != null && paybackMonths > 0 && (
        <div className="rounded-lg bg-blue-900/20 border border-blue-700 p-4 text-center">
          <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">Charger Payback Period</div>
          <div className="text-2xl font-bold text-blue-200">{Math.ceil(paybackMonths)} months</div>
          <div className="text-sm text-blue-400">
            ({(paybackMonths / 12).toFixed(1)} years) on a ${installCost.toLocaleString()} install
          </div>
        </div>
      )}

      {/* TCO nudge when not filled in */}
      {!tco && (
        <div className="rounded-xl border border-dashed border-gray-700 px-4 py-3 text-center">
          <p className="text-sm text-gray-400 font-medium">Want the full financial picture?</p>
          <p className="text-xs text-gray-500 mt-1">Add your car payment & insurance in the section above to see whether switching saves money overall — not just on fuel.</p>
        </div>
      )}

      {/* TCO Section */}
      {tco && (
        <div className="border-t-2 border-gray-800 pt-5">
          <p className="text-xs text-gray-400 mb-3">
            Fuel {positive ? 'saves you' : 'costs you'}{' '}
            <span className={`font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>{fmt(Math.abs(monthlySavings))}/mo</span>
            . Here's how that rolls up into your full monthly cost:
          </p>
          <h3 className="text-base font-bold text-white mb-1">Total Cost of Ownership</h3>
          <p className="text-xs text-gray-500 mb-4">All-in monthly comparison: payment + insurance + fuel + maintenance.</p>

          {/* Trade-in tax savings callout */}
          {tco.tradeInTaxSavings > 0 && (
            <div className="rounded-lg bg-green-900/20 border border-green-700 px-4 py-2.5 flex items-center justify-between mb-4">
              <span className="text-xs text-green-400 font-medium">Trade-in reduces your ad valorem tax basis</span>
              <span className="text-sm font-bold text-green-400">You save {fmt(tco.tradeInTaxSavings)} in taxes</span>
            </div>
          )}

          {/* Column headers */}
          <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-wide text-gray-500 pb-1.5 border-b border-gray-700 mb-0.5">
            <span />
            <span className="text-center text-red-400">Gas Vehicle</span>
            <span className="text-center text-green-500">Electric</span>
          </div>

          <TcoRow label="Car Payment" gasVal={tco.gasPayment} evVal={tco.evPayment} />
          <TcoRow label="Insurance" gasVal={tco.gasInsurance} evVal={tco.evInsurance} />
          <TcoRow label="Fuel / Electricity" gasVal={tco.monthlyGasFuel} evVal={tco.monthlyEvFuel} />
          <TcoRow label="Maintenance" gasVal={tco.gasMaintenance} evVal={tco.evMaintenance} />

          {/* Totals */}
          <div className="grid grid-cols-3 text-sm pt-3 mt-1 border-t border-gray-700">
            <span className="font-bold text-gray-300">Monthly Total</span>
            <span className="text-center text-xl font-bold text-red-400">{fmt(tco.gasMonthlyTCO)}</span>
            <span className="text-center text-xl font-bold text-green-500">{fmt(tco.evMonthlyTCO)}</span>
          </div>

          {/* TCO savings cards */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <SavingsCard label="Monthly TCO Savings" value={tco.monthlyTCOSavings} positive={tco.monthlyTCOSavings > 0} />
            <SavingsCard label="Annual TCO Savings" value={tco.annualTCOSavings} positive={tco.annualTCOSavings > 0} />
          </div>

          {tco.annualTCOSavings > 0 ? (
            <p className="text-xs text-gray-400 text-center mt-3">
              Even with a new EV loan, your estimated all-in monthly cost is{' '}
              <span className="text-green-400 font-semibold">{fmt(Math.abs(tco.monthlyTCOSavings))} less per month</span> than your current gas vehicle.
            </p>
          ) : (
            <p className="text-xs text-gray-400 text-center mt-3">
              With these inputs the EV has a higher all-in monthly cost. Try increasing trade-in value, extending the loan term, or negotiating a lower purchase price.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
