import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {

    try {

      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await fetch("https://zaldemy.com/controller/me.php", {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + token
        }
      });

      if (!res.ok) {
        throw new Error("Erro na requisição");
      }

      const data = await res.json();

      setUser(data.authenticated ? data.user : null);

    } catch (error) {

      console.log("Erro auth:", error);
      setUser(null);

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function logout() {

    try {

      const token = localStorage.getItem("token");

      if (token) {
        await fetch("https://zaldemy.com/controller/logout.php", {
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

    }

  }

  const value = useMemo(() => ({
    user,
    setUser,
    loading,
    checkAuth,
    logout
  }), [user, loading, checkAuth]);

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