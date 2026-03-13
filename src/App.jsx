import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import EsqueciSenha from './pages/EsqueciSenha'
import EscolherIdiomaNativo from './pages/EscolherIdiomaNativo'
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
import EnglishVideos from './pages/EnglishVideos'

import imgMemly from "./assets/img/mascote-memly.png"
import imgChapeuFormatura from "./assets/img/chapeu_formatura.png"


/* function setRealViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setRealViewportHeight();

window.addEventListener('resize', setRealViewportHeight); */




function PrivateRoute({ children }) {

  const { user, loading, checkAuth } = useAuth()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  //console.log("PrivateRoute - user:", user, "loading:", loading)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white-100">
        <img
          src={imgChapeuFormatura}
          alt="Carregando"
          className="w-28 animate-pulse"
        />
      </div>
    )
  }

  if (!user) {
    console.log("Redirecionando para login - sem usuário")
    return <Navigate to="/login" replace />
  }

  return children
}



function Layout({ titulo, setTitulo }) {

  const location = useLocation()
  const { user, loading } = useAuth()

  const rotasSemHeader = new Set([
    //'/login',
    //'/escolheridioma',
    //'/emparelhar',
    '/home'
  ])

  const esconderHeader = rotasSemHeader.has(location.pathname)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white-100">
        <img
          src={imgChapeuFormatura}
          alt="Carregando"
          className="w-28 animate-pulse"
        />
      </div>
    )
  }

  return (
    <>
      {esconderHeader && <Header titulo={titulo} />}

      <Routes>

        <Route path="/" element={<Login setTitulo={setTitulo} />} />
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

        <Route path="/verificaremail" element={<VerificarEmail />} />
        <Route path="/emailverificado" element={<EmailVerificado />} />
        <Route path="/videos" element={<EnglishVideos query="english listening practice" />} />
      </Routes>
    </>
  )
}



function App() {

  const containerRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Saber a altura da tela
  // useEffect(() => {
  //   const checkOverflow = () => {
  //     const el = containerRef.current;
  //     if (!el) return;

  //     const rect = el.getBoundingClientRect();
  //     const viewportHeight = window.visualViewport?.height || window.innerHeight;

  //     setHasOverflow(rect.height > viewportHeight);
  //   };

  //   const timeout = setTimeout(checkOverflow, 100);

  //   window.addEventListener("resize", checkOverflow);
  //   window.visualViewport?.addEventListener("resize", checkOverflow);

  //   return () => {
  //     clearTimeout(timeout);
  //     window.removeEventListener("resize", checkOverflow);
  //     window.visualViewport?.removeEventListener("resize", checkOverflow);
  //   };

  // }, [frases, index, diff, isFlipped]);

  // useEffect(() => {
  //   const observer = new ResizeObserver(() => {
  //     const el = containerRef.current;
  //     if (el) setHasOverflow(el.scrollHeight > el.clientHeight);
  //   });

  //   if (containerRef.current) {
  //     observer.observe(containerRef.current);
  //   }

  //   return () => observer.disconnect();
  // }, []);

  const [titulo, setTitulo] = useState('')

  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout titulo={titulo} setTitulo={setTitulo} />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App