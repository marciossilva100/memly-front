import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './i18n'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))

if (import.meta.env.DEV) {
  root.render(<App />)
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}