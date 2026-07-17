import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
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
      const res = await fetch(`${API_URL}/controller/me.php`, {
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
    logout
  }), [user, isLoading, isAuthenticating, checkAuth, syncAuth]);

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