import { useState, useEffect } from 'react'
import { brand } from '../utils/brandConfig'

export default function CTA() {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!showModal || !brand.ctaUseModal) return
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
      <p className="text-gray-300 mb-6 max-w-md mx-auto">{brand.ctaDescription}</p>

      {brand.ctaUseModal ? (
        <button
          onClick={() => setShowModal(true)}
          className="inline-block bg-ccs-red hover:bg-ccs-red-dark text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg"
        >
          {brand.ctaLabel}
        </button>
      ) : (
        <a
          href={brand.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-ccs-red hover:bg-ccs-red-dark text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg"
        >
          {brand.ctaLabel} →
        </a>
      )}

      {brand.phone && (
        <p className="text-gray-400 text-sm mt-4">
          Questions? Call us:{' '}
          <a href={`tel:${brand.phoneTel}`} className="text-white hover:text-gray-200 font-medium">
            {brand.phone}
          </a>
        </p>
      )}

      {showModal && brand.ctaUseModal && (
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
              src={brand.ctaUrl}
              style={{ border: 'none', flex: 1, minHeight: 0 }}
              className="w-full rounded-2xl"
              title={brand.ctaLabel}
            />
          </div>
        </div>
      )}
    </div>
  )
}
