export default function CTA() {
  return (
    <div className="rounded-2xl p-8 text-center text-white" style={{ backgroundColor: '#1A1A1A' }}>
      <h2 className="text-2xl font-bold mb-2">Ready to start saving?</h2>
      <p className="text-gray-300 mb-6 max-w-md mx-auto">
        Car Charger Specialists installs Level 2 EV chargers across the Atlanta metro area.
        Tesla Certified. Fast. Reliable.
      </p>
      <a
        href="https://www.carchargerspecialists.com/contact"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-ccs-red hover:bg-ccs-red-dark text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg"
      >
        Get Your Charger Installed
      </a>
      <p className="text-gray-400 text-sm mt-4">
        Questions? Call us:{' '}
        <a href="tel:4045207349" className="text-white hover:text-gray-200 font-medium">
          404-520-7349
        </a>
      </p>
    </div>
  )
}
