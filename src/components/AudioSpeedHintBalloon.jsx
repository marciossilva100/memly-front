import { useCallback, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Volume2 } from "lucide-react";
import useAudioSpeedHintListener from "../hooks/useAudioSpeedHintListener";

const DURACAO_VISIVEL_MS = 4500;
const DURACAO_TRANSICAO_MS = 350;

// Aviso global: aparece uma única vez na vida do usuário (localStorage), na
// primeira reprodução de áudio real (treino, perguntas, frases por IA) -
// disparado por utils/audioPlayer.js via evento, já que playAudio é chamado
// de várias telas diferentes. Um cartãozinho fixo no canto inferior direito
// que desliza entrando pela lateral, fica visível um tempo e desliza de
// volta saindo - posição fixa (não relativa a nenhum botão) pra nunca ficar
// por cima do card da frase, que muda de tamanho/posição em cada tela.
export default function AudioSpeedHintBalloon() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [estado, setEstado] = useState("escondido"); // escondido | entrando | visivel | saindo
    const timeoutsRef = useRef([]);

    const onPrimeiroAudio = useCallback(() => {
        timeoutsRef.current.forEach(clearTimeout);

        setEstado("entrando");

        // monta fora da tela primeiro, só no frame seguinte anima pra dentro -
        // senão o navegador funde os dois estados e não roda a transição.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setEstado("visivel"));
        });

        timeoutsRef.current = [
            setTimeout(() => setEstado("saindo"), DURACAO_VISIVEL_MS),
            setTimeout(() => setEstado("escondido"), DURACAO_VISIVEL_MS + DURACAO_TRANSICAO_MS),
        ];
    }, []);

    useAudioSpeedHintListener(onPrimeiroAudio);

    if (estado === "escondido") return null;

    const dentro = estado === "visivel";

    return (
        <div
            className={`fixed z-50 bottom-28 right-4 w-64 max-w-[75vw] transition-transform ease-out ${dentro ? "translate-x-0" : "translate-x-[130%]"
                }`}
            style={{ transitionDuration: `${DURACAO_TRANSICAO_MS}ms` }}
        >
            <button
                type="button"
                onClick={() => { setEstado("saindo"); navigate("/configuracoes"); }}
                className="w-full flex items-start gap-2 bg-orange-400 border border-white/15 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg text-left"
            >
                <Volume2 className="w-4 h-4 shrink-0 mt-0.5 text-white" />
                <span>{t("audio_speed_hint")}</span>
            </button>
        </div>
    );
}
