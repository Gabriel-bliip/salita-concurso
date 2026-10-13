import { Link, NavLink } from 'react-router'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-primary' : 'text-ink-muted hover:text-primary'
  }`

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-8" />
          <span className="text-lg font-bold tracking-tight text-ink">salita</span>
        </Link>
        <nav className="flex items-center gap-5 sm:gap-8">
          <NavLink to="/coworks" className={navLinkClass}>
            Coworks
          </NavLink>
          <NavLink to="/mapa" className={navLinkClass}>
            Mapa
          </NavLink>
          <Link to="/#como-funciona" className={navLinkClass({ isActive: false })}>
            Cómo funciona
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
