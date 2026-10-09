import { useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png";
import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

function AuthGate({ children }) {
    const { t } = useTranslation();
    const { user, loading } = useAuth();
    const location = useLocation();

    // Esconde a splash nativa só quando já sabemos se o usuário está logado
    // ou não (não antes) - bug real reportado: a splash nativa (main.jsx)
    // escondia cedo demais (só esperava o React montar, ~2 frames), e essa
    // tela de loading aqui embaixo (mesmo chapéu) ficava visível por cima
    // até a checagem de login terminar de verdade (chamada de rede, bem
    // mais lenta que 2 frames) - duas telas de "chapéu" em sequência em vez
    // de uma transição única.
    useEffect(() => {
        if (!loading) {
            SplashScreen.hide();
        }
    }, [loading]);

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