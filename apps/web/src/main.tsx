import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import { AppShell } from './app/AppShell'
import './i18n'
import './index.css'

registerSW({ immediate: true, onRegisterError: (error) => console.error('SW register error', error) })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </StrictMode>,
)
