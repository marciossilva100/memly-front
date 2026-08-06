import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Volume2 } from "lucide-react";
import useAudioSpeedHintListener from "../hooks/useAudioSpeedHintListener";

const DURACAO_MS = 6000;
const LARGURA_BALAO = 256; // w-64
const MARGEM_TELA = 12;

// Balão global: aparece uma única vez na vida do usuário (localStorage), na
// primeira reprodução de áudio real (treino, perguntas, frases por IA) -
// disparado por utils/audioPlayer.js via evento, já que playAudio é chamado
// de várias telas diferentes sem um balão local em cada uma. Posiciona-se
// em cima do botão "Ouvir" que disparou o áudio (marcado com o atributo
// data-audio-hint-target nas telas relevantes), com a ponta apontando pra
// ele - se nenhum botão marcado estiver visível na tela, não mostra nada
// (evita um balão solto sem apontar pra lugar nenhum).
export default function AudioSpeedHintBalloon() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [pos, setPos] = useState(null); // { top, left, pontaEsquerda } ou null

    const onPrimeiroAudio = useCallback(() => {
        const alvo = document.querySelector('[data-audio-hint-target]');
        const rect = alvo?.getBoundingClientRect();

        if (!rect || (rect.width === 0 && rect.height === 0)) return;

        const centroAlvo = rect.left + rect.width / 2;
        const metadeBalao = LARGURA_BALAO / 2;
        const left = Math.min(
            Math.max(centroAlvo, MARGEM_TELA + metadeBalao),
            window.innerWidth - MARGEM_TELA - metadeBalao
        );

        setPos({
            top: rect.top,
            left,
            // desloca a ponta do balão pra continuar apontando pro botão mesmo
            // quando o balão foi empurrado pra não estourar a borda da tela
            pontaOffset: centroAlvo - left,
        });

        setTimeout(() => setPos(null), DURACAO_MS);
    }, []);

    useAudioSpeedHintListener(onPrimeiroAudio);

    if (!pos) return null;

    return (
        <div
            className="fixed z-50 w-64 max-w-[85vw] -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{ top: pos.top - 10, left: pos.left }}
        >
            <button
                type="button"
                onClick={() => { setPos(null); navigate("/configuracoes"); }}
                className="pointer-events-auto w-full flex items-start gap-2 bg-[#4cb8c4] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg text-left animate-gentle-bounce"
            >
                <Volume2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{t("audio_speed_hint")}</span>
            </button>
            <div
                className="w-3 h-3 bg-[#4cb8c4] rotate-45 -mt-1.5"
                style={{ marginLeft: pos.pontaOffset - 6 }}
            />
        </div>
    );
}
