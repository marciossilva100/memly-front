import imgChapeuFormatura from "../assets/img/chapeu_formatura.png";
import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

function AuthGate({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <img
                    src={imgChapeuFormatura}
                    alt="Carregando"
                    className="w-28 animate-pulse"
                />
            </div>
        );
    }

    // 🔐 Se estiver logado e tentar acessar login
    if (user && (location.pathname === "/login" || location.pathname === "/")) {

        if (user.step > 2) {
            return <Navigate to="/home" replace />;
        } else {
            return <Navigate to="/escolheridioma" replace />;
        }
    }

    return children;
}

export default AuthGate;