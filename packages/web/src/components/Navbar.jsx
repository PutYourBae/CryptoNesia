import { NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/encrypt', label: 'Enkripsi' },
  { to: '/decrypt', label: 'Dekripsi' },
]

export default function Navbar() {
  return (
    <nav className="bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <NavLink
          to="/"
          className="text-headline-md font-headline-md font-bold tracking-tight text-primary"
        >
          CryptoNesia
        </NavLink>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-label-caps font-label-caps uppercase tracking-widest transition-all duration-200 hover:bg-surface-container-high/50 px-2 py-1 ${
                  isActive
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant font-medium hover:text-primary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button
          className="text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-high/50 duration-200 p-2 rounded active:scale-95 ease-in-out"
          aria-label="Security settings"
        >
          <span className="material-symbols-outlined">security</span>
        </button>
      </div>
    </nav>
  )
}
