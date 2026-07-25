import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext'
import { registerSW } from "virtual:pwa-register";
import { useTranslation } from "react-i18next";

import AuthGate from "./components/AuthGate";
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import FrasesGeral from './pages/FrasesGeral'
import EsqueciSenha from './pages/EsqueciSenha'
import EscolherIdiomaNativo from './pages/EscolherIdiomaNativo'
import ListCategoria from './pages/listCategorias';
import EscolherIdiomaAprender from './pages/EscolherIdiomaAprender'
import Header from './includes/Header'
import ReferenciaUsuario from './pages/ReferenciaUsuário'
import Home from './pages/Home'
import Frases from './pages/Frases'
import Flashcards from './pages/Flashcards'
import Emparelhar from './pages/Emparelhar'
import TreinoIA from './pages/treinoIA'
import Perguntas from './pages/Perguntas'
import DigitarTexto from './pages/DigitarTexto'
import LeituraDigital from './pages/LeituraDigital'
import BookDetails from "./pages/BookDetails";
import VerificarEmail from './pages/VerificarEmail'
import EmailVerificado from './pages/EmailVerificado'
import RedefinirSenha from './pages/RedefinirSenha'
import EnglishVideos from './pages/EnglishVideos'
import MusicFlashcardFinder from './pages/MusicFlashcardFInder';
import ConnectionStatus from './components/ConnectionStatus'; // Novo componente

import imgChapeuFormatura from "./assets/img/chapeu_formatura.png"
import PremiumPlan from './components/PremiumModal';
import Metricas from './pages/Metricas';
import DashboardAdmin from './pages/DashboardAdmin';
import Configuracoes from './pages/Configuracoes';
import TermosDeUso from './pages/TermosDeUso';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
import Contato from './pages/Contato';
import Faq from './pages/Faq';
import LandingPage from './pages/LandingPage';
import { isNativePlatform } from './utils/googleNativeAuth';

// Contexto de conexão
import { ConnectionProvider, useConnection } from './context/ConnectionContext';
import { initAnalytics, trackPageView } from './utils/analytics';

function PrivateRoute({ children }) {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { isOnline } = useConnection();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br">
        <img
          src={imgChapeuFormatura}
          alt={t("loading")}
          className="w-28 animate-pulse"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verifica conexão para rotas que precisam de internet
  const offlineRoutes = ['/home', '/flashcards', '/emparelhar']; // Rotas que funcionam offline
  if (!isOnline && !offlineRoutes.some(route => window.location.pathname.startsWith(route))) {
    return <ConnectionStatus />;
  }

  return children;
}

function Layout({ titulo, setTitulo }) {
  const location = useLocation()
  const { user, loading } = useAuth()
  const { isOnline } = useConnection()

  const rotasComHeader = new Set([
    '/home',
    '/metricas',
    '/dashboard-admin',
    '/listcategorias'
  ])

  const mostrarHeader = rotasComHeader.has(location.pathname)

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  return (
    <>
      {/* Indicador de status de conexão */}
      <ConnectionStatus />

      {mostrarHeader && <Header titulo={titulo} />}

      <Routes>
        <Route path="/" element={isNativePlatform() ? <Login setTitulo={setTitulo} /> : <LandingPage />} />
        <Route path="/login" element={<Login setTitulo={setTitulo} />} />

        <Route path="/cadastrar" element={<Cadastro setTitulo={setTitulo} />} />
        <Route path="/esquecisenha" element={<EsqueciSenha setTitulo={setTitulo} />} />

        <Route
          path="/escolheridioma"
          element={
            <PrivateRoute>
              <EscolherIdiomaNativo user={user} />
            </PrivateRoute>
          }
        />

        <Route
          path="/escolheridiomaaprender"
          element={
            <PrivateRoute>
              <EscolherIdiomaAprender user={user} />
            </PrivateRoute>
          }
        />

        <Route
          path="/referenciausuario"
          element={
            <PrivateRoute>
              <ReferenciaUsuario setTitulo={setTitulo} />
            </PrivateRoute>
          }
        />

        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home setTitulo={setTitulo} />
            </PrivateRoute>
          }
        />

        <Route
          path="/frases/:id"
          element={
            <PrivateRoute>
              <Frases />
            </PrivateRoute>
          }
        />

        <Route
          path="/flashcards/:id/:mode"
          element={
            <PrivateRoute>
              <Flashcards />
            </PrivateRoute>
          }
        />

        <Route
          path="/emparelhar/:id/:mode"
          element={
            <PrivateRoute>
              <Emparelhar />
            </PrivateRoute>
          }
        />

        <Route
          path="/treinoia"
          element={
            <PrivateRoute>
              <TreinoIA />
            </PrivateRoute>
          }
        />

        <Route
          path="/perguntasia"
          element={
            <PrivateRoute>
              <Perguntas />
            </PrivateRoute>
          }
        />

        <Route
          path="/digitartexto/:id/:mode"
          element={
            <PrivateRoute>
              <DigitarTexto />
            </PrivateRoute>
          }
        />

        <Route
          path="/leituradigital"
          element={
            <PrivateRoute>
              <LeituraDigital />
            </PrivateRoute>
          }
        />

        <Route
          path="/book/:id"
          element={
            <PrivateRoute>
              <BookDetails />
            </PrivateRoute>
          }
        />

        <Route
          path="/listcategorias"
          element={
            <PrivateRoute>
              <ListCategoria />
            </PrivateRoute>
          }
        />

        <Route
          path="/frasesgeral/:id"
          element={
            <PrivateRoute>
              <FrasesGeral />
            </PrivateRoute>
          }
        />

        <Route
          path="/metricas"
          element={
            <PrivateRoute>
              <Metricas />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard-admin"
          element={
            <PrivateRoute>
              <DashboardAdmin />
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracoes"
          element={
            <PrivateRoute>
              <Configuracoes />
            </PrivateRoute>
          }
        />

        <Route
          path="/musicflashcardfInder"
          element={
            <PrivateRoute>
              <MusicFlashcardFinder />
            </PrivateRoute>
          }
        />

        <Route path="/verificaremail" element={<VerificarEmail />} />
        <Route path="/premiumplan" element={<PremiumPlan />} />
        <Route path="/emailverificado" element={<EmailVerificado />} />
        <Route path="/redefinirsenha" element={<RedefinirSenha />} />
        <Route path="/termosdeuso" element={<TermosDeUso />} />
        <Route path="/politicaprivacidade" element={<PoliticaPrivacidade />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/videos" element={<EnglishVideos query="english listening practice" />} />
      </Routes>
    </>
  )
}

function App() {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [titulo, setTitulo] = useState('')

  useEffect(() => {
    registerSW({
      onNeedRefresh() {
        console.log("Nova versão disponível");
        // Adiciona confirmação antes de recarregar
        if (window.confirm(t("new_version_available_confirm"))) {
          window.location.reload();
        }
      },
      onOfflineReady() {
        console.log("App pronto para offline");
        // Notifica o usuário que o app está disponível offline
        alert(t("app_ready_offline"));
      }
    });
  }, []);

  return (
    <GoogleOAuthProvider clientId="1055075063152-tkobce7c2j9eq1t4doi0419votjlemis.apps.googleusercontent.com">
      <ConnectionProvider>
        <AuthProvider>
          <BrowserRouter>
            <AuthGate>
              <Layout titulo={titulo} setTitulo={setTitulo} />
            </AuthGate>
          </BrowserRouter>
        </AuthProvider>
      </ConnectionProvider>
    </GoogleOAuthProvider>
  )
}

export default App