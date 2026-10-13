import Button from '../components/Button.tsx'

interface NotFoundPageProps {
  message?: string
}

function NotFoundPage({ message = 'La página que buscas no existe o fue movida.' }: NotFoundPageProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center sm:px-6">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
        No encontramos lo que buscas
      </h1>
      <p className="mt-4 text-ink-muted">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button to="/">Volver al inicio</Button>
        <Button to="/coworks" variant="secondary">
          Ver coworks
        </Button>
      </div>
    </div>
  )
}

export default NotFoundPage
