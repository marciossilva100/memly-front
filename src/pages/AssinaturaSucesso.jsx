import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { CheckCircle } from "lucide-react";

export default function AssinaturaSucesso() {
    const { t } = useTranslation();
    const { checkAuth } = useAuth();
    const navigate = useNavigate();
    const [confirmando, setConfirmando] = useState(true);

    useEffect(() => {
        // O webhook do Stripe costuma chegar quase na hora, mas não é
        // instantâneo - espera um instante antes de buscar o usuário
        // atualizado, pra já mostrar o plano premium refletido.
        const timeout = setTimeout(async () => {
            await checkAuth(true);
            setConfirmando(false);
        }, 2000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="h-dvh flex flex-col items-center justify-center text-center p-6 from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-5">
                <CheckCircle className="w-8 h-8 text-green-400" />
            </div>

            <h1 className="text-xl font-semibold text-white mb-2">
                {t("subscription_success_title")}
            </h1>
            <p className="text-gray-400 text-sm max-w-xs">
                {confirmando ? t("subscription_confirming") : t("subscription_success_desc")}
            </p>

            <button
                onClick={() => navigate("/home")}
                disabled={confirmando}
                className="mt-8 px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] disabled:opacity-50 text-white font-medium transition-colors"
            >
                {t("back_to_home")}
            </button>
        </div>
    );
}
