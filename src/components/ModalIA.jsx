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
    const [motivoPremium, setMotivoPremium] = useState(null);
    // null = ainda não sabe (só importa pro limitado - free/premium são
    // sempre bloqueado/liberado, sem precisar checar o servidor)
    const [acessoFrase, setAcessoFrase] = useState(null);
    // Só pra mostrar a bolinha de "disponível hoje" (ver "opcoes" abaixo) -
    // diferente de acessoFrase, nunca bloqueia nem abre o modal de premium
    // pra Perguntas (cota esgotada é tratado dentro da própria
    // Perguntas.jsx, com o modal enxuto específico pra esse caso).
    const [acessoPerguntas, setAcessoPerguntas] = useState(null);

    // Limitado tem amostra vitalícia da frase do dia, mas ela expira se não
    // for usada no mesmo dia em que foi gerada - só o servidor sabe se
    // ainda está disponível, então consulta ao abrir o modal pra já mostrar
    // a coroa antes do usuário clicar (em vez de deixar ele navegar e só
    // descobrir na tela seguinte). Busca pros dois recursos, em premium e
    // limitado (ambos têm cota diária real) - mesma fonte usada pra bolinha
    // de notificação do ícone de Treino com IA na Home.
    useEffect(() => {
        if (!openTreinoIA || (user?.plano !== 3 && user?.plano !== 1)) return;

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

    // Bolinha de "disponível hoje" - só pra quem realmente tem acesso ao
    // recurso (premium/limitado), nunca junto com a coroa (planos free
    // nunca calculam isso, e quando falta acesso o crown já cobre o aviso).
    const podeVerDisponibilidade = user?.plano === 1 || user?.plano === 3;

    const opcoes = [
        {
            icon: BookOpenText,
            cor: "text-blue-400",
            fundo: "bg-blue-400/10 border-blue-400/30",
            titulo: t("daily_pronunciation_training_title"),
            descricao: t("daily_phrase_modal_desc"),
            rota: "/treinoia",
            temAcesso: temAcesso(acessoFrase),
            disponivel: podeVerDisponibilidade && Boolean(acessoFrase),
            motivo: "frase_dia_ia"
        },
        {
            icon: MessageCircleQuestion,
            cor: "text-emerald-400",
            fundo: "bg-emerald-400/10 border-emerald-400/30",
            titulo: t("questions_training"),
            descricao: t("questions_training_desc"),
            rota: "/perguntasia",
            // Limitado sempre "tem acesso" aqui, mesmo com a cota diária
            // zerada - sem coroa, sem modal completo de premium. Deixa
            // navegar pra Perguntas.jsx, que já trata cota esgotada com sua
            // própria tela + modal enxuto específico pra esse caso.
            temAcesso: user?.plano === 3 ? true : temAcesso(),
            disponivel: podeVerDisponibilidade && Boolean(acessoPerguntas),
            motivo: "perguntas_ia"
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
                                        setMotivoPremium(opcao.motivo);
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
                                {opcao.temAcesso && opcao.disponivel && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border border-gray-900" />
                                    </span>
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
                motivo={motivoPremium}
            />
        </Dialog>
    )
}
