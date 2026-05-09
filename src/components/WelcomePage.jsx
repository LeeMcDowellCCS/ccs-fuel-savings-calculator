import { brand } from '../utils/brandConfig'

export default function WelcomePage({ onGetStarted }) {
  const [line1, line2] = brand.tagline.split('\n')

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-between px-5 py-10">

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-lg">

        {/* Logo */}
        <a href={brand.logoHref} target="_blank" rel="noopener noreferrer" className="mb-8 block">
          {brand.logoSrc ? (
            <img src={brand.logoSrc} alt={brand.logoAlt} className={`${brand.logoClass ?? 'h-24 sm:h-32'} w-auto mx-auto`} />
          ) : (
            <span className="text-4xl sm:text-5xl font-bold text-white tracking-tight">{brand.name}</span>
          )}
        </a>

        {/* Powered-by badge — shown for white-label brands */}
        {brand.poweredBy && (
          <a
            href={brand.poweredBy.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 -mt-4 mb-6 opacity-60 hover:opacity-90 transition-opacity"
          >
            <span className="text-xs text-gray-400">{brand.poweredBy.text}</span>
            <img src={brand.poweredBy.logoSrc} alt="Car Charger Specialists" className="h-4 w-auto" />
          </a>
        )}

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
          {line1}{line2 && <><br />{line2}</>}
        </h1>

        <p className="text-gray-400 text-base sm:text-lg mb-6 leading-relaxed max-w-md">
          {brand.description}
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-1 gap-2 mb-8 w-full max-w-xs text-left">
          {brand.benefits.map(item => (
            <div key={item} className="flex items-start gap-2 text-sm text-gray-400">
              <span className="flex-shrink-0">{item.split(' ')[0]}</span>
              <span>{item.split(' ').slice(1).join(' ')}</span>
            </div>
          ))}
        </div>

        {/* Reviews — CCS only */}
        {brand.reviews && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-yellow-400 text-lg tracking-tight">★★★★★</span>
            <a
              href={brand.reviews.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 text-sm hover:text-white transition-colors"
            >
              {brand.reviews.label}
            </a>
          </div>
        )}

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
          {brand.footerTagline}
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          {brand.phone && (
            <>
              <a href={`tel:${brand.phoneTel}`} className="text-gray-400 hover:text-white transition-colors">
                📞 {brand.phone}
              </a>
              <span className="text-gray-700">·</span>
            </>
          )}
          <a
            href={brand.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            {brand.websiteDisplay}
          </a>
        </div>
      </div>

    </div>
  )
}
