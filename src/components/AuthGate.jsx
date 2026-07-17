import imgChapeuFormatura from "../assets/img/chapeu_formatura.png";
import imgChapeuFormaturaWhite from "../assets/img/chapeu_formatura-white.png";
import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

function AuthGate({ children }) {
    const { t } = useTranslation();
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center from-gray-800 to-gray-700 bg-gradient-to-br">
                <img
                    src={imgChapeuFormaturaWhite}
                    alt={t("loading")}
                    className="w-28 animate-pulse"
                />
            </div>
        );
    }

    // 🔐 Se estiver logado e tentar acessar login/cadastro
    if (user && (location.pathname === "/login" || location.pathname === "/" || location.pathname === "/cadastrar")) {

        if (user.step > 2) {
            return <Navigate to="/home" replace />;
        } else {
            return <Navigate to="/escolheridioma" replace />;
        }
    }

    return children;
}

export default AuthGate;