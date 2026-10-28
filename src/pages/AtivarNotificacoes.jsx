import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import imgZaldemy from "../assets/img/zaldemy.png";
import useEnableBodyScroll from "../hooks/useEnableBodyScroll";
import { ativarNotificacoes } from "../utils/pushNotifications";

// Mesmo pedido de permissão do slide de notificação do OnboardingTutorial,
// mas como tela isolada pra quem já tem conta (login, não cadastro) - ver
// Login.jsx, que só manda pra cá quando statusNotificacoes() volta "nunca
// decidido" (nem concedido nem negado), o que acontece ao reinstalar o app:
// onboarding-tutorial só é alcançado pelo fluxo de CADASTRO (user.step <= 2),
// então um usuário que desinstala e reinstala e faz LOGIN de novo (step já
// > 2) nunca passava por nenhuma tela pedindo a permissão - ficava sem
// notificação pra sempre, a não ser que soubesse ativar manualmente em
// Configurações (bug real reportado pelo usuário).
export default function AtivarNotificacoes() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    useEnableBodyScroll();
    const [enviando, setEnviando] = useState(false);

    function continuar() {
        navigate("/home", { replace: true });
    }

    // Pedir a permissão nunca pode travar quem recusa (ou dá erro) - segue
    // pro app do mesmo jeito, só sem notificação ativada (dá pra ativar
    // depois em Configurações). Mesmo comportamento de
    // OnboardingTutorial::ativarNotificacoesEContinuar.
    async function ativarEContinuar() {
        if (enviando) return;
        setEnviando(true);

        try {
            await ativarNotificacoes();
        } catch {
            // permissão negada ou erro - segue mesmo assim
        }

        continuar();
    }

    return (
        <div className="min-h-screen flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br px-8">
            <div className="flex justify-between items-center pt-6">
                <img src={imgZaldemy} alt="Zaldemy" className="h-8" />
                <button
                    type="button"
                    onClick={continuar}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                    {t("notifications_onboarding_skip")}
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
                <div className="text-7xl mb-8">🔔</div>

                <h2 className="text-2xl font-bold text-white mb-3">
                    {t("onboarding_slide_notifications_title")}
                </h2>

                <p className="text-gray-300 text-base">
                    {t("onboarding_slide_notifications_subtitle")}
                </p>
            </div>

            <button
                type="button"
                onClick={ativarEContinuar}
                disabled={enviando}
                className="mb-10 w-full bg-[#4cb8c4] text-white py-3 rounded-full text-lg font-semibold hover:brightness-110 transition disabled:opacity-60"
            >
                {t("notifications_onboarding_activate")}
            </button>
        </div>
    );
}
