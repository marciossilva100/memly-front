import { createContext, useContext, useEffect, useState, useMemo } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function checkAuth() {
    try {

      const res = await fetch("https://zaldemy.com/controller/me.php", {
        method: "GET",
        credentials: "include"
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
  }

  useEffect(() => {
    checkAuth();
  }, []);

  // function logout() {
  //   setUser(null);
  // }

  async function logout() {
    try {
      await fetch("http://localhost:8081/controller/logout.php", {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.log("Erro ao deslogar:", err);
    } finally {
      setUser(null);
    }
  }

  const value = useMemo(() => ({
    user,
    setUser,
    loading,
    checkAuth,
    logout
  }), [user, loading]);

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