import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router'
import Layout from './components/layout/Layout.tsx'
import BookingConfirmationPage from './pages/BookingConfirmationPage.tsx'
import BookingPage from './pages/BookingPage.tsx'
import CoworkDetailPage from './pages/CoworkDetailPage.tsx'
import CoworksPage from './pages/CoworksPage.tsx'
import HomePage from './pages/HomePage.tsx'
import JoinPage from './pages/JoinPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import SpacesPage from './pages/SpacesPage.tsx'

// Keep bookmarks, query filters and selected markers from the former URLs.
function LegacyExplorationRedirect({ map = false }: { map?: boolean }) {
  const { search, hash } = useLocation()
  return <Navigate replace to={`/espacios/cowork${map ? '/mapa' : ''}${search}${hash}`} />
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/espacios', element: <SpacesPage /> },
      { path: '/espacios/:categoryId', element: <CoworksPage /> },
      { path: '/espacios/:categoryId/mapa', lazy: async () => ({ Component: (await import('./pages/MapPage.tsx')).default }) },
      { path: '/coworks', element: <LegacyExplorationRedirect /> },
      { path: '/mapa', element: <LegacyExplorationRedirect map /> },
      { path: '/ubicaciones/:slug', element: <CoworkDetailPage /> },
      { path: '/coworks/:slug', element: <CoworkDetailPage /> },
      { path: '/reservar/:slug', element: <BookingPage /> },
      { path: '/reservar/:slug/confirmacion', element: <BookingConfirmationPage /> },
      { path: '/unete', element: <JoinPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
