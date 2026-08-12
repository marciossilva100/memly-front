import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DURACAO_VISIVEL_MS = 8000;
const DURACAO_TRANSICAO_MS = 350;

const NOME_NIVEL_KEY = {
    1: "level_iniciante_title",
    2: "level_intermediario_title",
    3: "level_avancado_title",
};

// Sugestão de evolução de nível: o backend (Nivel::sugestaoPromocao, ver
// controller/me.php) só preenche user.nivel_sugerido quando as últimas 5
// tentativas avaliadas (Frase do Dia + Perguntas por IA) tiveram nota 8+ -
// aqui só cuida de mostrar o cartão e chamar a ação escolhida. Reaparece a
// cada novo carregamento do app enquanto o usuário não aceitar nem recusar
// (dispensar persiste no backend, ver Nivel::dispensarSugestao).
export default function NivelUpToast() {
    const { t } = useTranslation();
    const { user, setUser } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL;
    const [estado, setEstado] = useState("escondido"); // escondido | entrando | visivel | saindo
    const [enviando, setEnviando] = useState(false);
    const timeoutsRef = useRef([]);
    const jaMostradoRef = useRef(false);

    useEffect(() => {
        if (!user?.nivel_sugerido || jaMostradoRef.current) return;
        jaMostradoRef.current = true;

        setEstado("entrando");
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setEstado("visivel"));
        });

        timeoutsRef.current = [
            setTimeout(() => setEstado("saindo"), DURACAO_VISIVEL_MS),
            setTimeout(() => setEstado("escondido"), DURACAO_VISIVEL_MS + DURACAO_TRANSICAO_MS),
        ];

        return () => timeoutsRef.current.forEach(clearTimeout);
    }, [user?.nivel_sugerido]);

    function esconder() {
        timeoutsRef.current.forEach(clearTimeout);
        setEstado("saindo");
        setTimeout(() => setEstado("escondido"), DURACAO_TRANSICAO_MS);
    }

    async function aceitar() {
        if (enviando || !user?.nivel_sugerido) return;
        setEnviando(true);

        try {
            await fetch(`${API_URL}/controller/nivel.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                },
                body: JSON.stringify({ action: "set_level", nivel: user.nivel_sugerido }),
            });

            setUser((prev) => prev && { ...prev, nivel: user.nivel_sugerido, nivel_sugerido: null });
        } finally {
            setEnviando(false);
            esconder();
        }
    }

    async function recusar() {
        if (enviando || !user?.nivel_sugerido) return;
        setEnviando(true);

        try {
            await fetch(`${API_URL}/controller/nivel.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                },
                body: JSON.stringify({ action: "dispensar_sugestao", nivel: user.nivel_sugerido }),
            });

            setUser((prev) => prev && { ...prev, nivel_sugerido: null });
        } finally {
            setEnviando(false);
            esconder();
        }
    }

    if (estado === "escondido" || !user?.nivel_sugerido) return null;

    const nomeNivelKey = NOME_NIVEL_KEY[user.nivel_sugerido];
    const dentro = estado === "visivel";

    return (
        <div
            className={`fixed z-50 bottom-28 right-4 w-72 max-w-[80vw] transition-transform ease-out ${dentro ? "translate-x-0" : "translate-x-[130%]"
                }`}
            style={{ transitionDuration: `${DURACAO_TRANSICAO_MS}ms` }}
        >
            <div className="bg-orange-400 border border-white/15 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
                <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-white" />
                    <div className="flex-1">
                        <p className="font-bold">
                            {t("level_up_suggestion_title", { nivel: t(nomeNivelKey) })}
                        </p>
                        <p className="text-white/90 text-xs mt-1">{t("level_up_suggestion_body")}</p>
                    </div>
                    <button type="button" onClick={recusar} className="text-white/70 hover:text-white shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex gap-2 mt-3">
                    <button
                        type="button"
                        onClick={aceitar}
                        disabled={enviando}
                        className="flex-1 px-3 py-1.5 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white text-xs font-medium transition-colors disabled:opacity-60"
                    >
                        {t("level_up_accept")}
                    </button>
                    <button
                        type="button"
                        onClick={recusar}
                        disabled={enviando}
                        className="flex-1 px-3 py-1.5 rounded-full bg-gray-700/60 hover:bg-gray-700 text-white text-xs font-medium transition-colors disabled:opacity-60"
                    >
                        {t("level_up_dismiss")}
                    </button>
                </div>
            </div>
        </div>
    );
}
