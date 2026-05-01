function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-4 text-center ${highlight ? 'bg-ccs-red text-white' : 'bg-gray-50 border border-gray-100'}`}>
      <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${highlight ? 'text-red-100' : 'text-gray-500'}`}>{label}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-ccs-black'}`}>{value}</div>
    </div>
  )
}

function fmt(n) {
  return '$' + Math.round(n).toLocaleString()
}

export default function Results({ calc }) {
  const { annualGasCost, annualElectricCost, annualSavings, monthlySavings, installCost, paybackMonths } = calc

  return (
    <div className="card border-2 border-ccs-red">
      <h2 className="text-xl font-bold text-ccs-black mb-1">Your Estimated Savings</h2>
      <p className="text-sm text-gray-500 mb-5">Switching from gas to electric.</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Monthly Savings" value={fmt(monthlySavings)} highlight />
        <StatCard label="Annual Savings" value={fmt(annualSavings)} highlight />
        <StatCard label="5-Year Savings" value={fmt(annualSavings * 5)} />
        <StatCard label="10-Year Savings" value={fmt(annualSavings * 10)} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-red-50 p-3 text-center">
          <div className="text-xs text-gray-500 font-medium mb-0.5">Annual Gas Cost</div>
          <div className="text-lg font-bold text-red-600">{fmt(annualGasCost)}</div>
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <div className="text-xs text-gray-500 font-medium mb-0.5">Annual EV Cost</div>
          <div className="text-lg font-bold text-green-600">{fmt(annualElectricCost)}</div>
        </div>
      </div>

      {installCost != null && paybackMonths != null && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-center">
          <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Charger Payback Period</div>
          <div className="text-2xl font-bold text-blue-900">
            {Math.ceil(paybackMonths)} months
          </div>
          <div className="text-sm text-blue-700">
            ({(paybackMonths / 12).toFixed(1)} years) on a ${installCost.toLocaleString()} install
          </div>
        </div>
      )}
    </div>
  )
}
