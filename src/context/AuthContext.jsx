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

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        setLoading(false);
        setIsAuthenticating(false);
        return;
      }

      const res = await fetch(`${API_URL}/controller/me.php`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + token
        }
      });

      if (!res.ok) {
        throw new Error("Erro na requisição");
      }

      const data = await res.json();

      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
        // Token inválido, remove do localStorage
        localStorage.removeItem("token");
      }

    } catch (error) {
      console.log("Erro auth:", error);
      setUser(null);
      // Em caso de erro, remove token inválido
      if (error.message !== "Erro na requisição") {
        localStorage.removeItem("token");
      }
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
    await checkAuth(true);
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