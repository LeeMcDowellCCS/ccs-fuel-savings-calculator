import { useState, useMemo } from 'react'
import Header from './components/Header'
import { GasVehicleSelector, EVSelector } from './components/VehicleSelector'
import UtilitySelector from './components/UtilitySelector'
import GasPrice from './components/GasPrice'
import MilesDriven from './components/MilesDriven'
import InstallationCost from './components/InstallationCost'
import TCOCalculator from './components/TCOCalculator'
import Results from './components/Results'
import SavingsGraph from './components/SavingsGraph'
import CTA from './components/CTA'
import WizardCalculator from './components/WizardCalculator'

function calculate({ gasVehicle, evVehicle, electricRate, gasPrice, milesPerDay, installCost }) {
  const annualMiles = milesPerDay * 365
  const annualGasCost = (annualMiles / gasVehicle.mpg) * gasPrice
  const kWhPer100Mi = 100 / evVehicle.miPerKWh
  const annualElectricCost = (annualMiles * kWhPer100Mi / 100) * electricRate
  const annualSavings = annualGasCost - annualElectricCost
  const monthlySavings = annualSavings / 12
  const paybackMonths = installCost != null && monthlySavings > 0 ? installCost / monthlySavings : null

  return { annualGasCost, annualElectricCost, annualSavings, monthlySavings, installCost, paybackMonths }
}

function calculateTCO({ annualGasCost, annualElectricCost }, tcoInputs) {
  const { gasPayment, gasInsurance, gasMaintenance, evPayment, evInsurance, evMaintenance, tavt, tradeInTaxSavings, totalFinanced } = tcoInputs
  const monthlyGasFuel = annualGasCost / 12
  const monthlyEvFuel = annualElectricCost / 12
  const gasMonthlyTCO = gasPayment + gasInsurance + monthlyGasFuel + gasMaintenance
  const evMonthlyTCO = evPayment + evInsurance + monthlyEvFuel + evMaintenance
  const monthlyTCOSavings = gasMonthlyTCO - evMonthlyTCO
  return {
    gasPayment, gasInsurance, gasMaintenance,
    evPayment, evInsurance, evMaintenance,
    monthlyGasFuel, monthlyEvFuel,
    gasMonthlyTCO, evMonthlyTCO,
    monthlyTCOSavings,
    annualTCOSavings: monthlyTCOSavings * 12,
    tavt, tradeInTaxSavings, totalFinanced,
  }
}

export default function App() {
  const [mode, setMode] = useState('wizard') // 'classic' | 'wizard'
  const [gasVehicle, setGasVehicle] = useState(null)
  const [evVehicle, setEvVehicle] = useState(null)
  const [electricRate, setElectricRate] = useState(null)
  const [gasPrice, setGasPrice] = useState(null)
  const [milesPerDay, setMilesPerDay] = useState(35)
  const [installEnabled, setInstallEnabled] = useState(false)
  const [installCost, setInstallCost] = useState(null)
  const [tcoEnabled, setTcoEnabled] = useState(false)
  const [tcoInputs, setTcoInputs] = useState(null)

  const ready = gasVehicle && evVehicle && electricRate && gasPrice

  const calc = useMemo(() => {
    if (!ready) return null
    return calculate({
      gasVehicle, evVehicle, electricRate, gasPrice, milesPerDay,
      installCost: installEnabled ? installCost : null,
    })
  }, [gasVehicle, evVehicle, electricRate, gasPrice, milesPerDay, installEnabled, installCost])

  const tco = useMemo(() => {
    if (!calc || !tcoEnabled || !tcoInputs) return null
    return calculateTCO(calc, tcoInputs)
  }, [calc, tcoEnabled, tcoInputs])

  const missingFields = []
  if (!gasVehicle) missingFields.push('gas vehicle')
  if (!evVehicle) missingFields.push('EV')
  if (!electricRate) missingFields.push('utility & rate')
  if (!gasPrice) missingFields.push('gas price')

  if (mode === 'wizard') {
    return <WizardCalculator onExit={() => setMode('classic')} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Mode toggle */}
      <div className="max-w-5xl mx-auto px-4 pt-4 flex justify-between items-center">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Classic View</span>
        <button
          onClick={() => setMode('wizard')}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border-2 border-ccs-red text-ccs-red hover:bg-red-50 transition-colors"
        >
          ⚡ Switch to Quick Wizard
        </button>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ccs-black mb-2">Fuel Savings Calculator</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            See exactly how much you'll save switching from gas to electric —
            based on your actual vehicle, utility, and driving habits.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GasVehicleSelector onSelect={setGasVehicle} />
          <EVSelector onSelect={setEvVehicle} />
          <UtilitySelector onRateChange={setElectricRate} />
          <GasPrice gasVehicle={gasVehicle} onPriceChange={setGasPrice} />
          <MilesDriven value={milesPerDay} onChange={setMilesPerDay} />
          <InstallationCost
            enabled={installEnabled}
            onToggle={() => setInstallEnabled(e => !e)}
            onCostChange={setInstallCost}
          />
          <TCOCalculator
            enabled={tcoEnabled}
            onToggle={() => setTcoEnabled(e => !e)}
            onChange={setTcoInputs}
          />
        </div>

        <div className="mt-8 space-y-5">
          {!calc && (
            <div className="card border border-dashed border-gray-200 text-center py-10">
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-gray-500 font-medium">Complete all fields to see your savings</p>
              {missingFields.length > 0 && (
                <p className="text-sm text-gray-400 mt-1">Still needed: {missingFields.join(', ')}</p>
              )}
            </div>
          )}

          {calc && calc.annualSavings <= 0 && (
            <div className="card border border-amber-200 bg-amber-50">
              <p className="text-amber-800 font-medium text-sm">
                ⚠️ With these inputs, the EV costs more to charge than the gas vehicle costs to fuel.
                Try adjusting the gas price, electric rate, or selecting a more efficient EV.
              </p>
            </div>
          )}

          {calc && (
            <>
              <Results calc={calc} tco={tco} />
              <SavingsGraph calc={calc} />
              <CTA />
            </>
          )}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 mt-8" style={{ backgroundColor: '#000000', color: '#9ca3af' }}>
        <p>
          © {new Date().getFullYear()} Car Charger Specialists, LLC · Atlanta, GA ·{' '}
          <a href="https://www.carchargerspecialists.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            carchargerspecialists.com
          </a>
        </p>
        <p className="mt-1">
          <a href="tel:4045207349" className="text-gray-400 hover:text-white transition-colors">404-520-7349</a>
        </p>
      </footer>
    </div>
  )
}
