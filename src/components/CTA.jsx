import { useState, useEffect } from 'react'

export default function CTA() {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!showModal) return
    if (document.querySelector('script[src*="housecallpro.com/script.js"]')) return
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://online-booking.housecallpro.com/script.js?token=fcb749cd2e9748849f539ba8c3937347&orgName=Car-Charger-Specialists-LLC'
    document.head.appendChild(script)
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none z-10"
              aria-label="Close"
            >
              &times;
            </button>
            <iframe
              id="hcp-lead-iframe"
              src="https://book.housecallpro.com/lead-form/Car-Charger-Specialists-LLC/fcb749cd2e9748849f539ba8c3937347"
              style={{ border: 'none' }}
              className="w-full flex-1 rounded-2xl"
              title="Get Your Charger Installed"
            />
          </div>
        </div>
      )}
    </div>
  )
}
