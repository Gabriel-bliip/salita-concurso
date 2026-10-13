import { Link } from 'react-router'

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Salita · Coworks en Santiago de Chile</p>
        <div className="flex gap-6">
          <Link to="/coworks" className="hover:text-slate-900">
            Coworks
          </Link>
          <Link to="/#como-funciona" className="hover:text-slate-900">
            Cómo funciona
          </Link>
          <Link to="/mapa" className="hover:text-slate-900">
            Mapa
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
