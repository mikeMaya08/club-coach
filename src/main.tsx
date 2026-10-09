import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { initClub } from 'club-store'
import App from './App'
import { ToastProvider } from './components/Toast'
import './components/rating-element'
import { applyTheme } from './lib/theme'
import './index.css'

applyTheme()

// Apply ?reset / ?as / ?now / ?bug ... before anything renders.
initClub('coach')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/coach">
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
