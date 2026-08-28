import { Trophy, X } from "lucide-react";
import { useTranslation } from "react-i18next";

// Modal enxuto pro caso específico de "cota diária esgotada" nos jogos -
// diferente do bloqueio de plano free (PremiumModal, com toda a vitrine de
// funcionalidades), aqui o usuário já está no plano limitado ou premium e
// só precisa de um aviso claro, sem repetir a venda completa toda vez que
// a cota do dia acaba.
//
// mostrarCtaPremium=false esconde o botão "Assinar Premium" - usado quando
// quem bateu na cota já É premium (ex: categoria por IA, que tem teto
// diário pros dois planos). Virar premium de novo não faz sentido nenhum
// nesse caso; antes esse botão aparecia incondicionalmente, reportado como
// bug por um usuário premium vendo oferta de assinatura pra ele mesmo.
export default function LimiteDiarioModal({ isOpen, onClose, mensagem, onAssinarPremium, mostrarCtaPremium = true }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-gray-700 p-6 text-center">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                </div>

                <h2 className="text-lg font-semibold text-white mb-2">{t("daily_limit_reached_title")}</h2>
                <p className="text-gray-300 text-sm mb-6">{mensagem}</p>

                <div className="flex flex-col gap-3">
                    {mostrarCtaPremium && (
                        <button
                            onClick={onAssinarPremium}
                            className="w-full bg-gradient-to-r from-[#4cb8c4] to-[#085078] hover:from-[#3da5b0] hover:to-[#064060] text-white font-semibold py-3 rounded-xl transition-all"
                        >
                            {t("daily_limit_premium_cta")}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={mostrarCtaPremium
                            ? "w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
                            : "w-full bg-gradient-to-r from-[#4cb8c4] to-[#085078] hover:from-[#3da5b0] hover:to-[#064060] text-white font-semibold py-3 rounded-xl transition-all"}
                    >
                        {t("understood")}
                    </button>
                </div>
            </div>
        </div>
    );
}
