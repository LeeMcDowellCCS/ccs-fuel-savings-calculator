import { useState, useEffect } from 'react'

const HCP_LEAD_URL = 'https://book.housecallpro.com/lead-form/Car-Charger-Specialists-LLC/fcb749cd2e9748849f539ba8c3937347'

export default function CTA() {
  const [showModal, setShowModal] = useState(false)

  // Lazy-load HCP booking script only when modal first opens
  useEffect(() => {
    if (!showModal) return
    if (document.getElementById('hcp-booking-script')) return
    const s = document.createElement('script')
    s.id = 'hcp-booking-script'
    s.src = 'https://book.housecallpro.com/js/embed.js'
    s.async = true
    document.body.appendChild(s)
  }, [showModal])

  return (
    <div className="rounded-2xl p-8 text-center text-white" style={{ backgroundColor: '#1A1A1A' }}>
      <h2 className="text-2xl font-bold mb-2">Ready to start saving?</h2>
      <p className="text-gray-300 mb-6 max-w-md mx-auto">
        Car Charger Specialists installs Level 2 EV chargers across the Atlanta metro area.
        Tesla Certified. Fast. Reliable.
      </p>
      <button
        onClick={() => setShowModal(true)}
        className="inline-block bg-ccs-red hover:bg-ccs-red-dark text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg"
      >
        Get Your Charger Installed
      </button>
      <p className="text-gray-400 text-sm mt-4">
        Questions? Call us:{' '}
        <a href="tel:4045207349" className="text-white hover:text-gray-200 font-medium">
          404-520-7349
        </a>
      </p>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            className="relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
            style={{ height: '90vh' }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-3xl font-bold leading-none z-10 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-800"
              aria-label="Close"
            >
              &times;
            </button>
            <iframe
              id="hcp-lead-iframe"
              src={HCP_LEAD_URL}
              style={{ border: 'none', flex: 1, minHeight: 0 }}
              className="w-full rounded-2xl"
              title="Get Your Charger Installed"
            />
          </div>
        </div>
      )}
    </div>
  )
}
