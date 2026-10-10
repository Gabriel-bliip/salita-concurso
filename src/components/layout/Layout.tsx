import { Outlet, ScrollRestoration } from 'react-router'
import Footer from './Footer.tsx'
import Header from './Header.tsx'

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}

export default Layout
