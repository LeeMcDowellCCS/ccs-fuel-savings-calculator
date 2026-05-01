import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer, Label
} from 'recharts'

function fmt(v) { return '$' + Math.round(v).toLocaleString() }

function formatBreakEven(years) {
  const totalMonths = Math.round(years * 12)
  const yr = Math.floor(totalMonths / 12)
  const mo = totalMonths % 12
  if (yr === 0) return `${mo} mo`
  if (mo === 0) return `${yr} yr`
  return `${yr} yr ${mo} mo`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">Year {label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-900">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function SavingsGraph({ calc }) {
  const { annualGasCost, annualElectricCost, installCost } = calc
  const annualSavings = annualGasCost - annualElectricCost

  // Exact fractional year where cumulative savings covers install cost
  const breakEvenYears = (installCost != null && annualSavings > 0)
    ? installCost / annualSavings
    : null
  const breakEvenLabel = breakEvenYears != null ? formatBreakEven(breakEvenYears) : null
  const showBreakEven = breakEvenYears != null && breakEvenYears <= 10

  const data = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1
    return {
      year,
      'Gas Cost': Math.round(annualGasCost * year),
      'EV Cost': Math.round(annualElectricCost * year),
      ...(installCost != null ? { 'Install Cost': installCost } : {}),
    }
  })

  const maxVal = Math.max(...data.map(d => d['Gas Cost']))
  const yMax = Math.ceil(maxVal * 1.1 / 1000) * 1000

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-ccs-black mb-1">10-Year Cumulative Cost Comparison</h2>
      <p className="text-sm text-gray-500 mb-5">Total fuel costs over time — gas vs. electric.</p>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            tickFormatter={v => `Yr ${v}`}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis
            tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            domain={[0, yMax]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }} />
          <Line
            type="monotone"
            dataKey="Gas Cost"
            stroke="#E8272A"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="EV Cost"
            stroke="#16a34a"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
          {installCost != null && (
            <Line
              type="monotone"
              dataKey="Install Cost"
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
            />
          )}
          {showBreakEven && (
            <ReferenceLine
              x={breakEvenYears}
              stroke="#16a34a"
              strokeWidth={2}
              strokeDasharray="5 4"
            >
              <Label
                value={`Break-Even: ${breakEvenLabel}`}
                position="top"
                fill="#16a34a"
                fontSize={11}
                fontWeight={600}
              />
            </ReferenceLine>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
