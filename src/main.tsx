import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { demoStoreAdapter } from './corporate/store.ts'
import { startDemoSync } from './corporate/sync.ts'

// Development only: mirrors the demo state with the other local session (node scripts/demo.mjs).
if (import.meta.env.DEV) startDemoSync(demoStoreAdapter)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
