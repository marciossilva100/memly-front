import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SplashScreen } from '@capacitor/splash-screen'
import './utils/pwaInstallPrompt'
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

// A splash nativa agora é escondida por AuthGate.jsx, só quando o app já
// sabe se o usuário está logado ou não (não só quando o React terminou de
// montar) - bug real reportado: escondendo cedo demais aqui (só 2 frames),
// sobrava a tela de loading do próprio AuthGate (mesmo ícone chapéu) visível
// por cima enquanto a checagem de login (chamada de rede) ainda rodava,
// virando duas telas de "chapéu" em sequência em vez de uma transição só.
//
// Mantido aqui só como rede de segurança - se por algum motivo AuthGate
// nunca montar/rodar esse efeito (erro antes disso), a splash não fica
// presa pra sempre.
setTimeout(() => SplashScreen.hide(), 8000)