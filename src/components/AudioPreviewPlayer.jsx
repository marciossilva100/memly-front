import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useTranslation } from "react-i18next";

// Player customizado pra prévia de gravação - os controles nativos do
// <audio> não seguem o tema escuro do app e têm suporte muito limitado a
// CSS entre navegadores, então tocamos o áudio via ref escondida e
// desenhamos nosso próprio botão.
export default function AudioPreviewPlayer({ src }) {
    const { t } = useTranslation();
    const audioRef = useRef(null);
    const [tocando, setTocando] = useState(false);

    function alternar() {
        const audio = audioRef.current;
        if (!audio) return;

        if (tocando) {
            audio.pause();
        } else {
            audio.play();
        }
    }

    return (
        <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700">
            <button
                type="button"
                onClick={alternar}
                className="w-9 h-9 shrink-0 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] flex items-center justify-center transition-colors"
            >
                {tocando
                    ? <Pause className="w-4 h-4 text-white" />
                    : <Play className="w-4 h-4 text-white ml-0.5" />}
            </button>
            <span className="text-gray-300 text-lg">
                {tocando ? t("playing_audio") : t("listen_recording")}
            </span>
            <audio
                ref={audioRef}
                src={src}
                onPlay={() => setTocando(true)}
                onPause={() => setTocando(false)}
                onEnded={() => setTocando(false)}
                className="hidden"
            />
        </div>
    );
}
