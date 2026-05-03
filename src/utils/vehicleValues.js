// MSRP lookup for current EV models — falls back to a sensible default by segment.
// Values are approximate base-trim MSRPs (USD, before incentives). Numbers reflect
// 2024-2026 pricing.
const MSRP_LOOKUP = {
  // Tesla
  'Tesla|Model 3':     { base: 42990, perTrim: { 'Performance AWD': 54990, 'Long Range AWD': 47990 } },
  'Tesla|Model Y':     { base: 44990, perTrim: { 'Performance AWD': 51490, 'Long Range AWD': 47990 } },
  'Tesla|Model S':     { base: 79990, perTrim: { 'Plaid AWD': 94990 } },
  'Tesla|Model X':     { base: 84990, perTrim: { 'Plaid AWD': 99990 } },
  'Tesla|Cybertruck':  { base: 79990, perTrim: { 'Cyberbeast AWD': 99990, 'Tri-Motor AWD': 79990 } },

  // Chevrolet
  'Chevrolet|Bolt EV':       { base: 26500 },
  'Chevrolet|Bolt EUV':      { base: 27800 },
  'Chevrolet|Equinox EV':    { base: 34995 },
  'Chevrolet|Blazer EV':     { base: 44600, perTrim: { 'SS AWD': 60215 } },
  'Chevrolet|Silverado EV':  { base: 54995, perTrim: { 'RST First Edition': 96495 } },

  // Hyundai
  'Hyundai|Ioniq 5':   { base: 42500, perTrim: { 'XRT AWD': 55400, 'N AWD': 66100 } },
  'Hyundai|Ioniq 6':   { base: 37500, perTrim: { 'N AWD': 66100 } },
  'Hyundai|Ioniq 9':   { base: 58955, perTrim: { 'Calligraphy AWD': 73120 } },
  'Hyundai|Kona Electric': { base: 32675 },
  'Hyundai|Kona EV':   { base: 32675 },

  // Kia
  'Kia|EV6':           { base: 42900, perTrim: { 'GT AWD': 63800, 'GT-Line AWD LR': 56400 } },
  'Kia|EV9':           { base: 54900, perTrim: { 'GT AWD': 73900, 'Land AWD': 65000 } },
  'Kia|Niro EV':       { base: 39600 },

  // Ford
  'Ford|F-150 Lightning':    { base: 54995, perTrim: { 'Platinum 4WD': 84995 } },
  'Ford|Mustang Mach-E':     { base: 36495, perTrim: { 'GT AWD': 53995 } },

  // Rivian
  'Rivian|R1T':        { base: 71700, perTrim: { 'Quad Motor Large Pack': 99900, 'Tri Motor Large Pack': 99900, 'Performance Dual Motor Large Pack': 86700 } },
  'Rivian|R1S':        { base: 77700, perTrim: { 'Quad Motor Large Pack': 105900, 'Tri Motor Large Pack': 105900, 'Performance Dual Motor Large Pack': 92700 } },
  'Rivian|R2':         { base: 45000 },

  // BMW
  'BMW|i4':            { base: 52200, perTrim: { 'M50 xDrive': 74400, 'xDrive40 Gran Coupe AWD': 58300 } },
  'BMW|iX':            { base: 87250, perTrim: { 'M70 AWD': 112800, 'M60 AWD': 109200 } },
  'BMW|i5':            { base: 66800, perTrim: { 'M60 xDrive': 86100 } },
  'BMW|i7':            { base: 105700, perTrim: { 'M70 xDrive': 168500 } },

  // Mercedes
  'Mercedes-Benz|EQS':         { base: 104400, perTrim: { '580 4MATIC AWD': 131150 } },
  'Mercedes-Benz|EQE':         { base: 74900, perTrim: { 'AMG EQE AWD': 109550 } },
  'Mercedes-Benz|EQE SUV':     { base: 78050 },
  'Mercedes-Benz|EQS SUV':     { base: 105550 },
  'Mercedes-Benz|EQB':         { base: 52750 },

  // Audi
  'Audi|Q4 e-tron':    { base: 50000 },
  'Audi|Q6 e-tron':    { base: 63800 },
  'Audi|Q8 e-tron':    { base: 74400, perTrim: { 'SQ8 e-tron AWD': 92800 } },
  'Audi|e-tron GT':    { base: 106500, perTrim: { 'RS e-tron GT Performance AWD (912 hp)': 168000 } },

  // Volkswagen
  'Volkswagen|ID.4':       { base: 39735 },
  'Volkswagen|ID.Buzz':    { base: 59995, perTrim: { '1st Edition AWD': 65995 } },

  // Nissan
  'Nissan|Leaf':       { base: 28140, perTrim: { 'Platinum+ RWD (75 kWh)': 38990 } },
  'Nissan|Ariya':      { base: 39590, perTrim: { 'Platinum+ e-4ORCE AWD': 54690 } },

  // Cadillac
  'Cadillac|Lyriq':       { base: 58490, perTrim: { 'Sport AWD': 67990 } },
  'Cadillac|Optiq':       { base: 54000 },
  'Cadillac|Escalade IQ': { base: 129990, perTrim: { 'Sport AWD': 132995 } },
  'Cadillac|Escalade IQL':{ base: 134990 },
  'Cadillac|Celestiq':    { base: 340000 },

  // Polestar
  'Polestar|Polestar 2':   { base: 48400 },
  'Polestar|Polestar 3':   { base: 67500 },
  'Polestar|Polestar 4':   { base: 54300 },

  // Lucid
  'Lucid|Air':            { base: 69900, perTrim: { 'Sapphire AWD': 250500, 'Grand Touring AWD': 109900 } },
  'Lucid|Gravity':        { base: 94900 },

  // Porsche
  'Porsche|Taycan':           { base: 99400, perTrim: { 'Turbo S AWD': 209000, 'Turbo GT AWD': 231000 } },
  'Porsche|Macan Electric':   { base: 75300 },

  // Honda / Acura
  'Honda|Prologue':       { base: 48795 },
  'Acura|ZDX':            { base: 66950, perTrim: { 'Type S AWD': 73850 } },

  // Subaru / Toyota
  'Subaru|Solterra':      { base: 44995 },
  'Toyota|bZ4X':          { base: 44425 },

  // Genesis
  'Genesis|GV60':                     { base: 59000 },
  'Genesis|Electrified GV70':         { base: 71825 },
  'Genesis|Electrified G80':          { base: 79825 },
  'Genesis|GV90':                     { base: 80000 },

  // Volvo
  'Volvo|EX30':           { base: 44900 },
  'Volvo|EX40':           { base: 52000 },
  'Volvo|EC40':           { base: 54000 },
  'Volvo|EX90':           { base: 77990 },
  'Volvo|XC40 Recharge':  { base: 52000 },
  'Volvo|C40 Recharge':   { base: 54000 },

  // Jeep / Dodge
  'Jeep|Wagoneer S':       { base: 66995, perTrim: { 'Trailhawk AWD': 71995 } },
  'Dodge|Charger Daytona': { base: 54995, perTrim: { 'Scat Pack AWD': 71995 } },

  // Mini
  'Mini|Cooper SE':        { base: 30900 },
  'Mini|Countryman SE':    { base: 45200 },

  // Rolls-Royce / GMC / Fisker (luxury / niche)
  'Rolls-Royce|Spectre':   { base: 422750 },
  'GMC|Hummer EV':         { base: 98845 },
  'GMC|Sierra EV':         { base: 99495 },
}

const SEGMENT_DEFAULT = 45000 // Generic mid-tier EV default

export function getEvMsrp(evVehicle) {
  if (!evVehicle) return SEGMENT_DEFAULT
  const key = `${evVehicle.make}|${evVehicle.model}`
  const entry = MSRP_LOOKUP[key]
  if (!entry) return SEGMENT_DEFAULT
  if (entry.perTrim && entry.perTrim[evVehicle.trim] != null) return entry.perTrim[evVehicle.trim]
  return entry.base
}

// ── Trade-in value estimator ────────────────────────────────────────────────
// Estimates a starting MSRP based on make tier + body type, then applies
// straight-line + curve depreciation by age.
const LUXURY_MAKES = ['BMW','Mercedes-Benz','Mercedes','Audi','Lexus','Porsche','Volvo','Cadillac','Lincoln','Acura','Infiniti','Genesis','Maserati','Alfa Romeo','Land Rover','Jaguar']
const PREMIUM_MAKES = ['Buick','Volkswagen','Mazda','Mini']

const SUV_PATTERNS  = /tahoe|suburban|expedition|navigator|escalade|sequoia|armada|yukon|wagoneer|grand cherokee|grand wagoneer|gx|lx|qx80|gls|gle|x7|x5|q7|q8|range rover|cx-90|telluride|palisade|atlas|pilot|highlander|4runner|pathfinder|explorer|durango|traverse|acadia|enclave|outlook|pacifica|odyssey|sienna|carnival/i
const TRUCK_PATTERNS = /silverado|sierra|f-150|f150|f-250|f-350|ram \d+|tundra|tacoma|frontier|ridgeline|titan|gladiator|colorado|canyon|maverick|ranger/i
const SPORTS_PATTERNS = /corvette|gt-r|gtr|nsx|gt500|gt350|aventador|huracan|ferrari|mclaren|911|718|gt3|gt4|amg gt|m3|m4|m5|m8|rs[\s-]?[3567]|s[3568] sportback|c8|z06|zr1|zl1|trackhawk|hellcat|demon|trx|raptor|shelby|brz|mx-5|miata|supra|gr86|gr corolla|wrx|sti/i

function estimateMsrpForGas({ make, model = '', trim = '' }) {
  const t = `${trim} ${model}`
  const isLuxury  = LUXURY_MAKES.includes(make)
  const isPremium = PREMIUM_MAKES.includes(make)
  const isSports  = SPORTS_PATTERNS.test(t)
  const isTruck   = TRUCK_PATTERNS.test(t) || /\bf-?(150|250|350)\b|silverado|sierra/i.test(t)
  const isSuv     = SUV_PATTERNS.test(t)

  if (isSports && isLuxury) return 95000
  if (isSports)             return 55000
  if (isTruck && isLuxury)  return 80000
  if (isTruck)              return 55000
  if (isSuv && isLuxury)    return 75000
  if (isSuv)                return 42000
  if (isLuxury)             return 55000
  if (isPremium)            return 32000
  return 28000
}

// Industry depreciation curve (approximate residual % of MSRP after N years)
const RESIDUAL = [1.00, 0.78, 0.66, 0.56, 0.48, 0.42, 0.36, 0.31, 0.26, 0.22, 0.18, 0.15, 0.13, 0.11, 0.10]

export function estimateTradeIn(gasVehicle, currentYear = new Date().getFullYear()) {
  if (!gasVehicle) return 0
  const age = Math.max(0, currentYear - gasVehicle.year)
  const residual = age >= RESIDUAL.length ? 0.08 : RESIDUAL[age]
  const baseMsrp = estimateMsrpForGas(gasVehicle)
  // Round to nearest $250 — trade-in values aren't reported with high precision
  return Math.max(500, Math.round((baseMsrp * residual) / 250) * 250)
}
