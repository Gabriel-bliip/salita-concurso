import { Link } from 'react-router'

function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Salita · Espacios en Santiago de Chile</p>
        <div className="flex gap-6">
          <Link to="/espacios" className="hover:text-primary">
            Espacios
          </Link>
          <Link to="/espacios/cowork/mapa" className="hover:text-primary">
            Mapa
          </Link>
          <Link to="/#como-funciona" className="hover:text-primary">
            Cómo funciona
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
