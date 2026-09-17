import { X, Volume2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { playAudio } from "../utils/audioPlayer";

// Modal chamado a partir de Perguntas.jsx (botão "Vocabulário" ao lado do
// "Ouvir") - mostra todas as frases já cadastradas nas categorias que o
// aluno escolheu pra esse treino, só o lado do idioma que ele está
// aprendendo (texto_traduzido), pra servir de referência/consulta durante
// o treino sem precisar sair da tela.
export default function VocabularioCategoriaModal({ isOpen, onClose, frases, loading, erro, onTentarNovamente, user }) {
    const { t } = useTranslation();
    const [tocandoAudioId, setTocandoAudioId] = useState(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-sm max-h-[80vh] bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-gray-700 flex flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                    <h2 className="text-lg font-semibold text-white">{t("vocabulary_modal_title")}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-5 space-y-2">
                    {loading && (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 text-[#4cb8c4] animate-spin" />
                        </div>
                    )}

                    {!loading && erro && (
                        <div className="text-center py-10">
                            <p className="text-gray-400 text-sm mb-3">{erro}</p>
                            <button
                                onClick={onTentarNovamente}
                                className="text-[#4cb8c4] text-sm underline"
                            >
                                {t("try_again")}
                            </button>
                        </div>
                    )}

                    {!loading && !erro && frases.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            {t("no_phrase_found")}
                        </div>
                    )}

                    {!loading && !erro && frases.map((item) => (
                        <div
                            key={item.id}
                            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                            <p className="text-white text-sm min-w-0 flex-1">{item.texto_traduzido}</p>
                            {tocandoAudioId === item.id ? (
                                <Loader2 className="w-4 h-4 text-[#4cb8c4] shrink-0 animate-spin" />
                            ) : (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setTocandoAudioId(item.id);
                                        try {
                                            await playAudio(item.texto_traduzido, user);
                                        } finally {
                                            setTocandoAudioId(null);
                                        }
                                    }}
                                    className="shrink-0 text-[#4cb8c4]"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
