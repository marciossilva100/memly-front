import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SplashScreen } from '@capacitor/splash-screen'
import './utils/pwaInstallPrompt'
import './utils/setAppVh'
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

// O app fica coberto pela splash nativa ate o React montar, evitando
// mostrar o loader do index.html (mesmo icone "piscando" duas vezes).
// Espera dois frames para garantir que o navegador ja pintou algo antes
// de esconder a splash nativa (senao sobra um vao escuro sem nada).
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    SplashScreen.hide()
  })
})