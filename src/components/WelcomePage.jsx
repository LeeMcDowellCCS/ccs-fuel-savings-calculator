export default function WelcomePage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-between px-5 py-10">

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-lg">

        {/* Logo */}
        <a
          href="https://www.carchargerspecialists.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 block"
        >
          <img
            src="/ccs-logo.png"
            alt="Car Charger Specialists"
            className="h-24 sm:h-32 w-auto mx-auto"
          />
        </a>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
          How Much Could You Save<br />Going Electric?
        </h1>

        <p className="text-gray-400 text-base sm:text-lg mb-6 leading-relaxed max-w-md">
          Answer a few quick questions about your current vehicle and driving habits.
          We'll calculate your exact fuel savings — down to the penny.
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-1 gap-2 mb-8 w-full max-w-xs text-left">
          {[
            '⚡ Personalized to your exact vehicle & utility',
            '📊 Full cost breakdown — fuel, payments, insurance',
            '🌱 See your environmental impact too',
          ].map(item => (
            <div key={item} className="flex items-start gap-2 text-sm text-gray-400">
              <span className="flex-shrink-0">{item.split(' ')[0]}</span>
              <span>{item.split(' ').slice(1).join(' ')}</span>
            </div>
          ))}
        </div>

        {/* Star rating */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-yellow-400 text-lg tracking-tight">★★★★★</span>
          <a
            href="https://share.google/IqHZXHVdPeyNVS3k2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 text-sm hover:text-white transition-colors"
          >
            5.0 · 715 Google Reviews
          </a>
        </div>

        {/* CTA button */}
        <button
          onClick={onGetStarted}
          className="w-full max-w-xs py-5 bg-ccs-red hover:bg-ccs-red-dark text-white rounded-2xl font-bold text-xl transition-all shadow-lg active:scale-[0.98]"
        >
          Get Started →
        </button>

        <p className="text-gray-600 text-xs mt-3">
          Takes about 2 minutes · No personal info required
        </p>
      </div>

      {/* Footer contact */}
      <div className="text-center pt-8">
        <p className="text-gray-600 text-xs mb-2 uppercase tracking-wider font-medium">
          Atlanta's #1 EV Charger Installer
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <a
            href="tel:4045207349"
            className="text-gray-400 hover:text-white transition-colors"
          >
            📞 404-520-7349
          </a>
          <span className="text-gray-700">·</span>
          <a
            href="https://www.carchargerspecialists.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            carchargerspecialists.com
          </a>
        </div>
      </div>

    </div>
  )
}
