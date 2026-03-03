import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'

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

import imgMemly from "./assets/img/mascote-memly.png"


function PrivateRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}


function Layout({ titulo, setTitulo }) {

  const location = useLocation()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  const rotasSemHeader = [
    '/escolheridioma',
    '/login',
    '/'
  ]

  const esconderHeader = rotasSemHeader.includes(location.pathname)

  async function checkAuth() {
    try {
      setLoading(true)

      const res = await fetch("http://localhost:8081/controller/me.php", {
        credentials: "include"
      })

      const data = await res.json()

      if (data.authenticated) {
        setUser(data.user)
      } else {
        setUser(null)
      }

      console.log(user)

    } catch {
      setUser(null)
    }

    setLoading(false)
  }

  useEffect(() => {
    checkAuth()
  }, [location.pathname])


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white-100">
        <img
          src={imgMemly}
          alt="Carregando"
          className="w-28 animate-pulse"
        />
      </div>
    )
  }


  return (
    <>
      {!esconderHeader && <Header titulo={titulo} />}

      <Routes>

        <Route path="/" element={<Login setTitulo={setTitulo} />} />
        <Route path="/login" element={<Login setTitulo={setTitulo} />} />

        <Route
          path="/cadastrar"
          element={<Cadastro setTitulo={setTitulo} />}
        />

        <Route
          path="/esquecisenha"
          element={<EsqueciSenha setTitulo={setTitulo} />}
        />

        <Route
          path="/escolheridioma"
          element={
            <PrivateRoute user={user}>
              <EscolherIdiomaNativo user={user} />
            </PrivateRoute>
          }
        />

        <Route
          path="/escolheridiomaaprender"
          element={
            <PrivateRoute user={user}>
              <EscolherIdiomaAprender user={user} />
            </PrivateRoute>
          }
        />

        <Route
          path="/referenciausuario"
          element={
            <PrivateRoute user={user}>
              <ReferenciaUsuario setTitulo={setTitulo} />
            </PrivateRoute>
          }
        />

        <Route
          path="/home"
          element={
            <PrivateRoute user={user}>
              <Home setTitulo={setTitulo} />
            </PrivateRoute>
          }
        />

        <Route
          path="/frases/:id"
          element={
            <PrivateRoute user={user}>
              <Frases />
            </PrivateRoute>
          }
        />

        <Route
          path="/flashcards/:id"
          element={
            <PrivateRoute user={user}>
              <Flashcards />
            </PrivateRoute>
          }
        />

        <Route
          path="/emparelhar/:id"
          element={
            <PrivateRoute user={user}>
              <Emparelhar />
            </PrivateRoute>
          }
        />

        <Route
          path="/treinoia"
          element={
            <PrivateRoute user={user}>
              <TreinoIA setLoading={setLoading} loading={loading} />
            </PrivateRoute>
          }
        />

        <Route
          path="/perguntasia"
          element={
            <PrivateRoute user={user}>
              <Perguntas setLoading={setLoading} loading={loading} />
            </PrivateRoute>
          }
        />

        <Route
          path="/digitartexto/:id"
          element={
            <PrivateRoute user={user}>
              <DigitarTexto setLoading={setLoading} loading={loading} />
            </PrivateRoute>
          }
        />

        <Route
          path="/leituradigital"
          element={
            <PrivateRoute user={user}>
              <LeituraDigital setLoading={setLoading} loading={loading} />
            </PrivateRoute>
          }
        />

        <Route
          path="/book/:id"
          element={
            <PrivateRoute user={user}>
              <BookDetails setLoading={setLoading} loading={loading} />
            </PrivateRoute>
          }
        />

        <Route path="/verificaremail" element={<VerificarEmail />} />
        <Route path="/emailverificado" element={<EmailVerificado />} />

      </Routes>
    </>
  )
}


function App() {

  const [titulo, setTitulo] = useState('')

  return (
    <BrowserRouter>
      <Layout titulo={titulo} setTitulo={setTitulo} />
    </BrowserRouter>
  )
}

export default App