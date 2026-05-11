import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/encrypt', label: 'Enkripsi', icon: 'enhanced_encryption' },
  { to: '/decrypt', label: 'Dekripsi', icon: 'lock_open' },
]

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-250 min-w-[72px] ${
                isActive
                  ? 'text-primary bg-primary/10 scale-105'
                  : 'text-on-surface-variant hover:text-primary active:scale-95'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[22px] transition-all duration-250"
                  style={{
                    fontVariationSettings: isActive
                      ? "'FILL' 1, 'wght' 500"
                      : "'FILL' 0, 'wght' 400",
                  }}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-[10px] tracking-wider uppercase font-semibold transition-all duration-250 ${
                    isActive ? 'text-primary' : ''
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Safe area for phones with gesture bars */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-surface/90" />
    </nav>
  )
}
