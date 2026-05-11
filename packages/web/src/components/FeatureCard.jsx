export default function FeatureCard({ icon, title, description, formats }) {
  return (
    <div className="bg-surface-container/40 backdrop-blur-md border border-outline-variant/50 rounded-lg p-6 hover:bg-surface-container/70 hover:border-primary/50 transition-all duration-300 group flex flex-col">
      {/* Icon Container */}
      <div className="w-10 h-10 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center mb-6 group-hover:border-primary/50 transition-colors">
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>

      {/* Title */}
      <h3 className="text-headline-md font-headline-md text-on-surface text-lg mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-code-sm font-code-sm text-outline mb-4 flex-grow">
        {description}
      </p>

      {/* Format Badges */}
      <div className="flex gap-2">
        {formats.map((format) => (
          <span
            key={format}
            className="px-2 py-1 bg-surface-container-lowest border border-outline-variant/50 rounded text-code-sm font-code-sm text-on-surface-variant"
          >
            {format}
          </span>
        ))}
      </div>
    </div>
  )
}
