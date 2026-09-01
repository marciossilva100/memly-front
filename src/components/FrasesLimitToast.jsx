import { useCallback, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Crown, Clock } from "lucide-react";
import usePremiumLimitListener from "../hooks/usePremiumLimitListener";
import PremiumModal from "./PremiumModal";

const DURACAO_VISIVEL_MS = 5000;
const DURACAO_TRANSICAO_MS = 350;

// Aviso global de limite diário de frases criadas, mesmo padrão do
// AudioLimitToast (cartão lateral, não mais um erro dentro do próprio
// modal - o modal de cadastro fechava mostrando um texto vindo direto do
// backend ali dentro, sem seguir o estilo das outras mensagens de limite).
// Dois motivos possíveis:
// - "frases": free/limitado bateu o teto baixo - é upsell de verdade,
//   clicar abre o PremiumModal.
// - "frases_diario_premium": premium bateu o teto MAIOR (só controla
//   criação em massa, não é upsell nenhum) - clicar só fecha o aviso.
export default function FrasesLimitToast() {
    const { t } = useTranslation();
    const [estado, setEstado] = useState("escondido"); // escondido | entrando | visivel | saindo
    const [motivoAtivo, setMotivoAtivo] = useState(null);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const timeoutsRef = useRef([]);

    const onLimiteAtingido = useCallback((motivo) => {
        if (motivo !== "frases" && motivo !== "frases_diario_premium") return;

        timeoutsRef.current.forEach(clearTimeout);

        setMotivoAtivo(motivo);
        setEstado("entrando");

        requestAnimationFrame(() => {
            requestAnimationFrame(() => setEstado("visivel"));
        });

        timeoutsRef.current = [
            setTimeout(() => setEstado("saindo"), DURACAO_VISIVEL_MS),
            setTimeout(() => setEstado("escondido"), DURACAO_VISIVEL_MS + DURACAO_TRANSICAO_MS),
        ];
    }, []);

    usePremiumLimitListener(onLimiteAtingido);

    const dentro = estado === "visivel";
    const ehLimiteDiarioPremium = motivoAtivo === "frases_diario_premium";

    return (
        <>
            {estado !== "escondido" && (
                <div
                    className={`fixed z-50 bottom-28 right-4 w-72 max-w-[80vw] transition-transform ease-out ${dentro ? "translate-x-0" : "translate-x-[130%]"
                        }`}
                    style={{ transitionDuration: `${DURACAO_TRANSICAO_MS}ms` }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setEstado("escondido");
                            if (!ehLimiteDiarioPremium) setIsPremiumModalOpen(true);
                        }}
                        className="w-full flex items-start gap-2 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border border-white/15 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg text-left"
                    >
                        {ehLimiteDiarioPremium
                            ? <Clock className="w-4 h-4 shrink-0 mt-0.5 text-white" />
                            : <Crown className="w-4 h-4 shrink-0 mt-0.5 text-white" />}
                        <span>{t(ehLimiteDiarioPremium ? "premium_reason_frases_diario" : "premium_reason_frases")}</span>
                    </button>
                </div>
            )}

            <PremiumModal
                isOpen={isPremiumModalOpen}
                setIsPremiumModalOpen={setIsPremiumModalOpen}
                onClose={() => setIsPremiumModalOpen(false)}
                motivo="frases"
            />
        </>
    );
}
