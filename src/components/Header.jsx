export default function Header() {
  return (
    <header style={{ backgroundColor: '#000000' }} className="text-white shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <a
          href="https://www.carchargerspecialists.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
        >
          <img
            src="https://carchargerspecialists.com/wp-content/uploads/2026/01/New-CCS-Logo-No-Background-Name-Under-1.png"
            alt="Car Charger Specialists"
            height="55"
            style={{ height: '55px', width: 'auto' }}
          />
        </a>

        <div className="flex items-center gap-5 ml-auto">
          <a
            href="https://www.google.com/maps/search/Car+Charger+Specialists+Atlanta"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm text-white hover:text-gray-200 transition-colors whitespace-nowrap"
          >
            <span>⭐ 5-Star Reviews · 715 Reviews</span>
          </a>
          <a
            href="tel:4045207349"
            className="flex items-center gap-2 text-sm text-white hover:text-gray-200 transition-colors whitespace-nowrap font-medium"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            404-520-7349
          </a>
        </div>
      </div>
    </header>
  )
}
