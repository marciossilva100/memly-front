import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Volume2 } from "lucide-react";
import useAudioSpeedHintListener from "../hooks/useAudioSpeedHintListener";

const DURACAO_MS = 6000;

// Balão global: aparece uma única vez na vida do usuário (localStorage),
// na primeira reprodução de áudio real (treino, perguntas, frases por IA) -
// disparado por utils/audioPlayer.js via evento, já que playAudio é chamado
// de várias telas diferentes sem um balão local em cada uma.
export default function AudioSpeedHintBalloon() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [visivel, setVisivel] = useState(false);

    const onPrimeiroAudio = useCallback(() => {
        setVisivel(true);
        setTimeout(() => setVisivel(false), DURACAO_MS);
    }, []);

    useAudioSpeedHintListener(onPrimeiroAudio);

    if (!visivel) return null;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-64 max-w-[85vw] z-50">
            <div className="animate-gentle-bounce">
                <button
                    type="button"
                    onClick={() => { setVisivel(false); navigate("/configuracoes"); }}
                    className="w-full flex items-start gap-2 bg-[#4cb8c4] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg text-left"
                >
                    <Volume2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{t("audio_speed_hint")}</span>
                </button>
                <div className="w-3 h-3 bg-[#4cb8c4] rotate-45 mx-auto -mt-1.5" />
            </div>
        </div>
    );
}
