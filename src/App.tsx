import { createBrowserRouter, RouterProvider } from 'react-router'
import Layout from './components/layout/Layout.tsx'
import BookingPage from './pages/BookingPage.tsx'
import CoworkDetailPage from './pages/CoworkDetailPage.tsx'
import CoworksPage from './pages/CoworksPage.tsx'
import HomePage from './pages/HomePage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/coworks', element: <CoworksPage /> },
      { path: '/mapa', lazy: async () => ({ Component: (await import('./pages/MapPage.tsx')).default }) },
      { path: '/coworks/:slug', element: <CoworkDetailPage /> },
      { path: '/reservar/:slug', element: <BookingPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
