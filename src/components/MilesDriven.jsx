const OPTIONS = [5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]

export default function MilesDriven({ value, onChange }) {
  return (
    <div className="card">
      <h2 className="section-title flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">5</span>
        Daily Miles Driven
      </h2>
      <div>
        <label className="section-label">Average Miles Per Day</label>
        <select
          className="select-field"
          value={value}
          onChange={e => onChange(+e.target.value)}
        >
          {OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt} miles/day</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2">
          US average is ~37 miles/day. Your actual commute + errands.
        </p>
      </div>
    </div>
  )
}
