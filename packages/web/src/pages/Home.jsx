import Hero from '../components/Hero'
import FeatureCard from '../components/FeatureCard'

const features = [
  {
    icon: 'text_snippet',
    title: 'Teks',
    description: 'Dokumen, log, dan catatan terstruktur.',
    formats: ['.txt', '.md'],
  },
  {
    icon: 'image',
    title: 'Gambar',
    description: 'Aset visual, foto, dan grafis resolusi tinggi.',
    formats: ['.jpg', '.png'],
  },
  {
    icon: 'audio_file',
    title: 'Audio',
    description: 'Rekaman suara dan file media audio.',
    formats: ['.mp3', '.wav'],
  },
  {
    icon: 'video_file',
    title: 'Video',
    description: 'Rekaman video dan klip multimedia.',
    formats: ['.mp4', '.mkv'],
  },
]

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Features Grid */}
      <section className="w-full">
        {/* Section Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-outline-variant flex-grow"></div>
          <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-widest">
            [ SUPPORTED FORMATS ]
          </span>
          <div className="h-px bg-outline-variant flex-grow"></div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>
    </>
  )
}
