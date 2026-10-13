import { Link, NavLink } from 'react-router'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
  }`

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-8" />
          <span className="text-lg font-bold tracking-tight text-slate-900">salita</span>
        </Link>
        <nav className="flex items-center gap-5 sm:gap-8">
          <NavLink to="/coworks" className={navLinkClass}>
            Coworks
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
