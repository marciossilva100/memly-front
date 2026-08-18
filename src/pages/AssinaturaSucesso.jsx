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

    // window.opener só existe quando essa aba foi aberta via window.open()
    // (o caso do checkout: PremiumModal abre uma aba nova pro Stripe, essa
    // página é o success_url pra onde o Stripe redireciona DENTRO dessa
    // mesma aba nova). No Android essa aba aparece com a barra de endereço
    // do navegador por cima (título + checkout.stripe.com + menu), fora do
    // layout padrão do PWA - some sozinha fechando a aba, sem precisar o
    // usuário voltar manualmente. Se não tiver opener (raro: usuário abriu
    // esse link direto, sem popup), não faz nada além do fluxo normal.
    useEffect(() => {
        // O webhook do Stripe costuma chegar quase na hora, mas não é
        // instantâneo - espera um instante antes de buscar o usuário
        // atualizado, pra já mostrar o plano premium refletido.
        const timeout = setTimeout(async () => {
            await checkAuth(true);
            setConfirmando(false);

            if (window.opener) {
                // Dá tempo do usuário ver a confirmação antes de fechar -
                // fechar na hora pareceria que nada aconteceu.
                setTimeout(() => window.close(), 2000);
            }
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
