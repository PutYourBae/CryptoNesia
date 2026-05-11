import { useNavigate } from 'react-router-dom'

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="flex flex-col items-center text-center w-full max-w-3xl mb-24">
      {/* Status Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high border border-outline-variant rounded mb-8 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-secondary pulse-glow"></div>
        <span className="text-code-sm font-code-sm text-secondary uppercase tracking-widest">
          System Secure
        </span>
      </div>

      {/* Lock Icon with Glow */}
      <div className="relative mb-6 icon-float">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
        <span
          className="material-symbols-outlined text-primary relative z-10"
          style={{
            fontSize: '64px',
            fontVariationSettings: "'FILL' 1",
          }}
        >
          lock
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-6 leading-tight">
        Amankan File Anda dengan
        <br />
        <span className="text-primary">Enkripsi AES-256</span>
      </h1>

      {/* Subtitle */}
      <p className="text-body-lg font-body-lg text-on-surface-variant mb-10 max-w-2xl">
        Protokol keamanan tingkat tinggi untuk melindungi privasi data digital
        Anda. Cepat, aman, dan tanpa jejak.
      </p>

      {/* CTA Button */}
      <button
        onClick={() => navigate('/encrypt')}
        className="bg-primary text-on-primary text-body-md font-body-md font-semibold px-8 py-4 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_12px_rgba(164,230,255,0.2)] hover:bg-primary-fixed-dim transition-all duration-300 active:scale-95 flex items-center gap-2"
      >
        Mulai Sekarang
        <span className="material-symbols-outlined text-[20px]">
          arrow_forward
        </span>
      </button>
    </section>
  )
}
