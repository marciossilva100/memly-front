import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { hasGoogleRedirectToken } from "../utils/googleRedirectAuth";
import { sincronizarCotaNatural } from "../utils/audioPlayer";
import { fetchComTimeout } from "../utils/fetchComTimeout";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  // Indica que a lista de categorias esta sendo (re)carregada (ex: apos trocar idioma),
  // para o Header poder manter a tela de loading ate os dados estarem prontos.
  const [categoriasLoading, setCategoriasLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const checkAuth = useCallback(async (silent = false) => {
    // Se não for silencioso, marca como autenticando
    if (!silent) {
      setIsAuthenticating(true);
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      setIsAuthenticating(false);
      return null;
    }

    try {
      const res = await fetchComTimeout(`${API_URL}/controller/me.php`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + token
        }
      });

      // Servidor confirmou explicitamente que o token não é válido
      if (res.status === 401 || res.status === 403) {
        setUser(null);
        localStorage.removeItem("token");
        return null;
      }

      if (!res.ok) {
        throw new Error("Erro na requisição");
      }

      const data = await res.json();

      if (data.authenticated) {
        setUser(data.user);
        // AWAIT de propósito - loading só vira false depois disso (ver
        // finally abaixo), então nenhuma tela consegue montar e disparar
        // preloadAudio/playAudio antes da cota estar sincronizada. Sem
        // esperar, a primeira tentativa de áudio da sessão podia vencer a
        // corrida contra esse fetch e tocar em cache sem nunca descobrir
        // que a cota já tinha acabado (ver comentário em
        // sincronizarCotaNatural, em audioPlayer.js).
        await sincronizarCotaNatural(data.user);
        return data.user;
      }

      // Token inválido, remove do localStorage
      setUser(null);
      localStorage.removeItem("token");
      return null;

    } catch (error) {
      // Falha de rede/servidor: mantém o token e o usuário atuais,
      // não desloga o usuário por causa de uma instabilidade de conexão
      console.log("Erro auth:", error);
      return null;
    } finally {
      setLoading(false);
      setIsAuthenticating(false);
    }
  }, [API_URL]);

  // Força uma reautenticação imediata (usado após login)
  const syncAuth = useCallback(async (newToken = null) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
    }

    setLoading(true);
    setIsAuthenticating(true);
    return await checkAuth(true);
  }, [checkAuth]);

  useEffect(() => {
    // Se a URL tem um token de retorno do redirecionamento do Google (fluxo
    // usado no PWA instalado, ver googleRedirectAuth.js), a checagem padrão
    // aqui rodava em paralelo com o processamento desse token em Login.jsx -
    // como essa checagem usa o token ANTIGO/ausente do localStorage, ela
    // podia terminar depois e sobrescrever o usuário recém-autenticado de
    // volta pra null, chutando o usuário pra tela de login sem erro nenhum
    // (o login tinha funcionado, só foi sobrescrito). Cede a autenticação
    // pro fluxo de redirecionamento nesse caso, em vez de rodar em paralelo.
    if (hasGoogleRedirectToken()) {
      setLoading(false);
      return;
    }

    checkAuth();
  }, [checkAuth]);

  async function logout() {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        await fetch(`${API_URL}/controller/logout.php`, {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token
          }
        });
      }

    } catch (err) {
      console.log("Erro ao deslogar:", err);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      setLoading(false);
      setIsAuthenticating(false);
    }
  }

  // Combine loading states
  const isLoading = loading || isAuthenticating;

  const value = useMemo(() => ({
    user,
    setUser,
    loading: isLoading,
    isAuthenticating,
    checkAuth,
    syncAuth,
    logout,
    categoriasLoading,
    setCategoriasLoading
  }), [user, isLoading, isAuthenticating, checkAuth, syncAuth, categoriasLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}