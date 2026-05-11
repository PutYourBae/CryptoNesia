export default function Footer() {
  const footerLinks = [
    { label: 'Security Audit', href: '#' },
    { label: 'API Documentation', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ]

  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/20 w-full py-8 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 relative z-10 mt-auto">
      {/* Version Info */}
      <div className="text-label-caps font-label-caps text-on-surface-variant">
        v1.0.0 | PROTOCOL: AES-256 CBC | CRYPTONESIA SECURE CORE
      </div>

      {/* Footer Links */}
      <div className="flex flex-wrap justify-center gap-6">
        {footerLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-secondary text-code-sm font-code-sm hover:text-tertiary transition-colors opacity-80 hover:opacity-100 duration-300"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  )
}
