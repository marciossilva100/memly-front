import { useEffect, useRef, useState } from "react";
import { Volume2, Mic, Square, RotateCcw, History, Send, BookOpenText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { playAudio } from "../utils/audioPlayer";
import useAudioRecorder from "../hooks/useAudioRecorder";
import AudioPreviewPlayer from "../components/AudioPreviewPlayer";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"

function corNota(nota) {
    if (nota >= 8) return "text-green-400 border-green-400/30 bg-green-400/10";
    if (nota >= 5) return "text-amber-400 border-amber-400/30 bg-amber-400/10";
    return "text-red-400 border-red-400/30 bg-red-400/10";
}

export default function TreinoIA() {
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [premiumRequired, setPremiumRequired] = useState(false);
    const [limitReached, setLimitReached] = useState(false);

    const [fraseId, setFraseId] = useState(null);
    const [frase, setFrase] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null);

    const navigate = useNavigate();
    const { user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL;
    const jaBuscou = useRef(false);

    const { gravando, audioBlob, audioUrl, erro: erroGravacao, iniciarGravacao, pararGravacao, limpar } = useAudioRecorder();

    useEffect(() => {
        if (jaBuscou.current) return;
        jaBuscou.current = true;
        buscarFraseDoDia();
    }, []);

    function buscarFraseDoDia() {
        setLoading(true);
        setError(null);

        fetch(`${API_URL}/controller/fraseDoDia.php`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ action: 'obter' })
        })
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    if (data.premium_necessario) {
                        setPremiumRequired(true);
                        return;
                    }
                    if (data.limite_atingido) {
                        setLimitReached(true);
                        return;
                    }
                    setError(data.message || t("unexpected_error"));
                    return;
                }

                setFraseId(data.id);
                setFrase(data.frase);
            })
            .catch(err => {
                console.error(err);
                setError(t("could_not_generate_training"));
            })
            .finally(() => setLoading(false));
    }

    async function enviarResposta() {
        if (!audioBlob) return;

        setEnviando(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('action', 'responder');
            formData.append('frase_id', fraseId);
            formData.append('audio', audioBlob, 'audio.webm');

            const res = await fetch(`${API_URL}/controller/fraseDoDia.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: formData
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.message || t("unexpected_error"));
                return;
            }

            setResultado(data);
        } catch (err) {
            console.error(err);
            setError(t("server_connection_error"));
        } finally {
            setEnviando(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br">
                <img
                    src={imgChapeuFormatura}
                    alt={t("loading")}
                    className="w-28 animate-pulse"
                />
            </div>
        );
    }

    if (premiumRequired) {
        return (
            <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center p-6 from-gray-900 to-gray-800 bg-gradient-to-br">
                <h1 className="text-2xl font-semibold text-[#4cb8c4] mb-4">
                    {t("premium_feature_required")}
                </h1>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 px-6 py-3 rounded-full bg-[#4cb8c4] text-white"
                >
                    {t("back")}
                </button>
            </div>
        );
    }

    if (limitReached) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-6 from-gray-900 to-gray-800 bg-gradient-to-br">
                <h1 className="text-2xl font-semibold text-red-400 mb-4">
                    {t("daily_limit_reached")}
                </h1>
                <p className="text-white mt-2">
                    {t("come_back_tomorrow")}
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 px-6 py-3 rounded-full bg-[#4cb8c4] text-white"
                >
                    {t("back")}
                </button>
            </div>
        );
    }

    if (error && !frase) {
        return (
            <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center p-6 from-gray-900 to-gray-800 bg-gradient-to-br">
                <h1 className="text-xl font-semibold text-yellow-400 mb-4">
                    {error}
                </h1>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 px-6 py-3 rounded-full bg-[#4cb8c4] text-white"
                >
                    {t("back")}
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 justify-center w-full px-6 h-screen flex flex-col h-dvh from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="relative mb-6 flex items-center justify-between">
                    <div className="cursor-pointer" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left text-2xl text-white"></i>
                    </div>

                    <button
                        onClick={() => navigate('/treinoia/historico')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 text-xs hover:bg-gray-700/50 transition-colors"
                    >
                        <History className="w-3.5 h-3.5" />
                        {t("view_history")}
                    </button>
                </div>

                <h1 className="text-lg font-semibold text-white text-center mb-4">
                    {t("daily_phrase_title")}
                </h1>

                {!resultado && (
                    <div className="relative rounded-2xl border border-gray-700 bg-gradient-to-br from-[#233245] to-[#0d1425] p-6 shadow-md">
                        <div className="w-10 h-10 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 flex items-center justify-center mb-4">
                            <BookOpenText className="w-5 h-5 text-[#4cb8c4]" />
                        </div>
                        <p className="text-xl text-white leading-relaxed">{frase}</p>

                        <button
                            onClick={() => playAudio(frase, user, true)}
                            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 text-[#4cb8c4] text-xs hover:bg-[#4cb8c4]/20 transition-colors"
                        >
                            <Volume2 className="w-3.5 h-3.5" />
                            {t("listen")}
                        </button>
                    </div>
                )}

                {resultado && (
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col items-center py-2">
                            <span className={`text-4xl font-bold px-5 py-2 rounded-2xl border ${corNota(resultado.nota)}`}>
                                {resultado.nota}<span className="text-lg opacity-70">/10</span>
                            </span>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wide">{t("transcription_label")}</p>
                            <p className="text-white italic">"{resultado.transcricao}"</p>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                            <p className="text-[#4cb8c4] text-xs font-semibold mb-1">{t("grammar_label")}</p>
                            <p className="text-white text-sm">{resultado.feedback_gramatica}</p>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                            <p className="text-[#4cb8c4] text-xs font-semibold mb-1">{t("pronunciation_label")}</p>
                            <p className="text-white text-sm">{resultado.feedback_pronuncia}</p>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                            <p className="text-[#4cb8c4] text-xs font-semibold mb-1">{t("fluency_label")}</p>
                            <p className="text-white text-sm">{resultado.feedback_fluencia}</p>
                        </div>

                        <button
                            onClick={() => navigate(-1)}
                            className="mt-2 px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
                        >
                            {t("back")}
                        </button>
                    </div>
                )}
            </div>

            {!resultado && (
                <div className="sticky bottom-0 py-4 flex flex-col items-center gap-4 ">
                    {!audioUrl && !gravando && (
                        <button
                            onClick={iniciarGravacao}
                            className="relative w-24 h-24 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] flex items-center justify-center shadow-lg shadow-[#4cb8c4]/20 transition"
                        >
                            <Mic className="w-9 h-9 text-white" />
                        </button>
                    )}

                    {gravando && (
                        <button
                            onClick={pararGravacao}
                            className="relative w-24 h-24 rounded-full bg-red-600 flex items-center justify-center shadow-lg"
                        >
                            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                            <Square className="w-8 h-8 text-white relative z-10" />
                        </button>
                    )}

                    {gravando && (
                        <p className="text-red-400 text-sm font-medium">{t("recording_in_progress")}</p>
                    )}

                    {!gravando && !audioUrl && (
                        <p className="text-gray-500 text-xs text-center max-w-[220px]">{t("tap_mic_to_read")}</p>
                    )}

                    {audioUrl && !gravando && (
                        <div className="w-full flex flex-col items-center gap-3">
                            <AudioPreviewPlayer src={audioUrl} />

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={limpar}
                                    className="flex-1 px-4 py-2.5 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white text-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    {t("re_record")}
                                </button>

                                <button
                                    onClick={enviarResposta}
                                    disabled={enviando}
                                    className="flex-1 px-4 py-2.5 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] disabled:opacity-50 text-white text-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                    {enviando ? t("sending") : t("send")}
                                </button>
                            </div>
                        </div>
                    )}

                    {erroGravacao && (
                        <p className="text-red-400 text-xs text-center">{erroGravacao}</p>
                    )}

                    {error && (
                        <p className="text-red-400 text-xs text-center">{error}</p>
                    )}
                </div>
            )}
        </div>
    );
}
