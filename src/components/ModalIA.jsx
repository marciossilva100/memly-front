import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import PremiumModal from "./PremiumModal";

import {
    BookOpenText,
    MessageCircleQuestion,
    ChevronRight,
    Sparkles,
    Crown,
    X
} from "lucide-react";

export default function ModalIA({ setOpenTreinoIA, openTreinoIA }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL;

    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    // null = ainda não sabe (só importa pro limitado - free/premium são
    // sempre bloqueado/liberado, sem precisar checar o servidor)
    const [acessoFrase, setAcessoFrase] = useState(null);
    const [acessoPerguntas, setAcessoPerguntas] = useState(null);

    // Limitado tem amostra vitalícia de cada recurso, mas ela expira se não
    // for usada no mesmo dia em que a frase/pergunta foi gerada - só o
    // servidor sabe se ainda está disponível, então consulta ao abrir o
    // modal pra já mostrar a coroa antes do usuário clicar (em vez de deixar
    // ele navegar e só descobrir na tela seguinte).
    useEffect(() => {
        if (!openTreinoIA || user?.plano !== 3) return;

        const headers = { "Authorization": "Bearer " + localStorage.getItem("token") };

        fetch(`${API_URL}/controller/fraseDoDia.php`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ action: "verificar_acesso" }),
        })
            .then(res => res.json())
            .then(data => setAcessoFrase(!!data.acesso))
            .catch(() => setAcessoFrase(true));

        fetch(`${API_URL}/controller/DailyQuestionController.php?action=verificar_acesso`, { headers })
            .then(res => res.json())
            .then(data => setAcessoPerguntas(!!data.acesso))
            .catch(() => setAcessoPerguntas(true));

    }, [openTreinoIA, user?.plano, API_URL]);

    function temAcesso(acessoLimitado) {
        if (user?.plano === 1) return true;
        if (user?.plano === 3) return acessoLimitado !== false;
        return false;
    }

    const opcoes = [
        {
            icon: BookOpenText,
            cor: "text-blue-400",
            fundo: "bg-blue-400/10 border-blue-400/30",
            titulo: t("daily_pronunciation_training_title"),
            descricao: t("daily_phrase_modal_desc"),
            rota: "/treinoia",
            temAcesso: temAcesso(acessoFrase)
        },
        {
            icon: MessageCircleQuestion,
            cor: "text-emerald-400",
            fundo: "bg-emerald-400/10 border-emerald-400/30",
            titulo: t("questions_training"),
            descricao: t("questions_training_desc"),
            rota: "/perguntasia",
            temAcesso: temAcesso(acessoPerguntas)
        }
    ];

    return (
        <Dialog
            open={openTreinoIA}
            onClose={setOpenTreinoIA}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 p-5 shadow-2xl">

                    <button
                        onClick={() => setOpenTreinoIA(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2 mb-5">
                        <Sparkles className="w-5 h-5 text-[#4cb8c4]" />
                        <h2 className="text-lg font-semibold text-white">{t("ai_training")}</h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        {opcoes.map((opcao) => (
                            <button
                                key={opcao.rota}
                                type="button"
                                onClick={() => {
                                    if (!opcao.temAcesso) {
                                        setIsPremiumModalOpen(true);
                                        return;
                                    }
                                    setOpenTreinoIA(false);
                                    navigate(opcao.rota);
                                }}
                                className="relative flex items-center gap-3 p-3 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 hover:border-gray-600 transition-colors text-left"
                            >
                                {!opcao.temAcesso && (
                                    <Crown className="absolute -top-1.5 -right-1.5 w-4 h-4 text-yellow-400" />
                                )}
                                <div className={`flex items-center justify-center w-11 h-11 shrink-0 rounded-full border ${opcao.fundo}`}>
                                    <opcao.icon className={`w-5 h-5 ${opcao.cor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium leading-tight">{opcao.titulo}</p>
                                    <p className="text-gray-400 text-xs mt-0.5 leading-snug">{opcao.descricao}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                            </button>
                        ))}
                    </div>

                </Dialog.Panel>
            </div>

            <PremiumModal
                isOpen={isPremiumModalOpen}
                setIsPremiumModalOpen={setIsPremiumModalOpen}
                onClose={() => setIsPremiumModalOpen(false)}
                motivo="limite_gratuito"
            />
        </Dialog>
    )
}
