import { useEffect, useRef, useState } from "react";
import { Volume2, Mic, Square, RotateCcw, History, Send, BookOpenText, Ban, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { playAudio, pararAudio } from "../utils/audioPlayer";
import useAudioRecorder from "../hooks/useAudioRecorder";
import AudioPreviewPlayer from "../components/AudioPreviewPlayer";
import PremiumModal from "../components/PremiumModal";
import TextoDestacado from "../components/TextoDestacado";
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
    const [audioVazio, setAudioVazio] = useState(false);
    const [fraseEncerrada, setFraseEncerrada] = useState(false);
    const [premiumRequired, setPremiumRequired] = useState(false);
    const [limitReached, setLimitReached] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);

    const [fraseId, setFraseId] = useState(null);
    const [frase, setFrase] = useState('');
    const [fraseTraducao, setFraseTraducao] = useState('');
    const [fraseDestacada, setFraseDestacada] = useState(null);
    const [mostrarVocabulario, setMostrarVocabulario] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null);

    const navigate = useNavigate();
    const { user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL;
    const jaBuscou = useRef(false);

    const { gravando, audioBlob, audioUrl, erro: erroGravacao, iniciarGravacao, pararGravacao, limpar } = useAudioRecorder();

    // Para o áudio em reprodução ao sair da tela (troca de rota) - sem isso,
    // o áudio seguia tocando mesmo depois do usuário já ter navegado embora.
    useEffect(() => () => pararAudio(), []);

    useEffect(() => {
        if (jaBuscou.current) return;
        jaBuscou.current = true;
        buscarFraseDoDia();
    }, []);

    function buscarFraseDoDia() {
        setLoading(true);
        setError(null);
        setFlipped(false);

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
                        setMotivoPremium("frase_dia_ia");
                        setIsPremiumModalOpen(true);
                        return;
                    }
                    if (data.limite_atingido) {
                        setLimitReached(true);
                        if (user?.plano === 3) {
                            setMotivoPremium("frase_dia_ia");
                            setIsPremiumModalOpen(true);
                        }
                        return;
                    }
                    setError(data.message || t("unexpected_error"));
                    return;
                }

                setFraseId(data.id);
                setFrase(data.frase);
                setFraseTraducao(data.traducao || '');
                setFraseDestacada(data.frase_destacada || null);
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
                if (data.audio_vazio) {
                    setAudioVazio(true);
                }
                if (data.pode_tentar_novamente === false) {
                    setFraseEncerrada(true);
                }
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
            <div className="flex h-screen flex-col items-center justify-center gap-4 from-gray-900 to-gray-800 bg-gradient-to-br">
                <img
                    src={imgChapeuFormatura}
                    alt={t("loading")}
                    className="w-28 animate-pulse"
                />
                <p className="text-gray-400 text-sm">{t("ia_gerando_conteudo")}</p>
            </div>
        );
    }

    if (premiumRequired) {
        return (
            <div className="h-screen from-gray-900 to-gray-800 bg-gradient-to-br">
                <PremiumModal
                    isOpen={isPremiumModalOpen}
                    setIsPremiumModalOpen={setIsPremiumModalOpen}
                    onClose={() => navigate('/home')}
                    motivo={motivoPremium}
                />
            </div>
        );
    }

    if (limitReached) {
        const limiteVitalicio = user?.plano === 3;

        if (limiteVitalicio) {
            return (
                <div className="h-screen from-gray-900 to-gray-800 bg-gradient-to-br">
                    <PremiumModal
                        isOpen={isPremiumModalOpen}
                        setIsPremiumModalOpen={setIsPremiumModalOpen}
                        onClose={() => navigate('/home')}
                        motivo={motivoPremium}
                    />
                </div>
            );
        }

        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-6 from-gray-900 to-gray-800 bg-gradient-to-br">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
                    <Ban className="w-8 h-8 text-red-400" />
                </div>

                <h1 className="text-xl font-semibold text-white mb-2">
                    {t("daily_limit_reached")}
                </h1>
                <p className="text-gray-400 text-sm max-w-xs">
                    {t("come_back_tomorrow")}
                </p>

                <button
                    onClick={() => navigate(-1)}
                    className="mt-8 px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
                >
                    {t("back")}
                </button>
            </div>
        );
    }

    if (error && !frase) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-6 from-gray-900 to-gray-800 bg-gradient-to-br">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>

                <h1 className="text-xl font-semibold text-white mb-2">
                    {t("insufficient_content")}
                </h1>
                <p className="text-gray-400 text-sm max-w-xs">
                    {t("add_more_phrases_hint")}
                </p>

                <button
                    onClick={() => navigate(-1)}
                    className="mt-8 px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
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

                <h1 className="flex items-center justify-center gap-2 text-lg font-semibold text-white text-center mb-1">
                    <BookOpenText className="w-5 h-5 text-[#4cb8c4]" />
                    {t("daily_phrase_title")}
                </h1>
                <p className="text-gray-400 text-xs text-center mb-2 px-4">
                    {t("daily_phrase_subtitle")}
                </p>

                {fraseDestacada && !resultado && (
                    <div className="flex flex-col items-center mb-2 mt-4 gap-1.5">
                        <button
                            type="button"
                            onClick={() => setMostrarVocabulario(prev => !prev)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                                mostrarVocabulario
                                    ? "bg-[#4cb8c4]/10 border-[#4cb8c4]/30 text-[#4cb8c4]"
                                    : "bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700/50"
                            }`}
                        >
                            {mostrarVocabulario ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {t("toggle_vocabulary_hint")}
                        </button>
                        {mostrarVocabulario && !fraseDestacada.some(t => t.destaque) && (
                            <p className="text-gray-500 text-xs">{t("no_vocabulary_matched")}</p>
                        )}
                    </div>
                )}

                {!resultado && (
                    <>
                        {/* Altura/padding menores em telas baixas (ex: iPhone SE), mas SEM
                            diminuir a fonte - o espaço em volta do texto encolhe, e se mesmo
                            assim a frase for longa demais pro espaço, o texto rola dentro do
                            card em vez de disputar espaço com o ícone/botão e quebrar o layout. */}
                        <div className="perspective flex justify-center h-[220px] [@media(max-height:700px)]:h-[180px]">
                            <div className="flashcard w-full h-full">
                                <div
                                    className={`card w-full h-full ${flipped ? "flip" : ""}`}
                                    onClick={() => setFlipped(!flipped)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="card-front rounded-2xl border border-gray-700 bg-gradient-to-br from-[#233245] to-[#0d1425] px-6 py-2 [@media(max-height:800px)]:py-3 shadow-md flex flex-col items-center gap-2">
                                        <div className="flex-1 w-full min-h-0 overflow-y-auto scrollbar-hide flex items-center">
                                            <p className="text-base text-white leading-relaxed text-center w-full">
                                                <TextoDestacado tokens={mostrarVocabulario ? fraseDestacada : null} texto={frase} />
                                            </p>
                                        </div>
                                    </div>

                                    <div className="card-back rounded-2xl border border-gray-700 bg-gradient-to-br from-[#0d1425] to-[#233245] px-6  [@media(max-height:800px)]:py-3 shadow-md flex flex-col items-center gap-2">
                                        <div className="flex-1 w-full min-h-0 overflow-y-auto scrollbar-hide flex items-center">
                                            <p className="text-base text-white leading-relaxed text-center w-full">{fraseTraducao}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-gray-500 text-xs mt-2">{t("tap_card_to_flip")}</p>

                        {!flipped && (
                            <div className="flex justify-center mt-3">
                                <button
                                    onClick={() => playAudio(frase, user, true)}
                                    className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 text-[#4cb8c4] text-xs hover:bg-[#4cb8c4]/20 transition-colors"
                                >
                                    <Volume2 className="w-3.5 h-3.5" />
                                    {t("listen")}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {resultado && (
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col items-center py-2 gap-1">
                            <p className="text-gray-500 text-xs uppercase tracking-wide">{t("grade_label")}</p>
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

            {!resultado && !flipped && (
                <div className="sticky bottom-0 py-4 flex flex-col items-center gap-4 ">
                    {!audioUrl && !gravando && (
                        <button
                            onClick={() => { setError(null); setAudioVazio(false); iniciarGravacao(); }}
                            className="relative w-14 h-14 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] flex items-center justify-center shadow-lg shadow-[#4cb8c4]/20 transition"
                        >
                            <Mic className="w-5 h-5 text-white" />
                        </button>
                    )}

                    {gravando && (
                        <button
                            onClick={pararGravacao}
                            className="relative w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg"
                        >
                            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                            <Square className="w-5 h-5 text-white relative z-10" />
                        </button>
                    )}

                    {gravando && (
                        <p className="text-red-400 text-sm font-medium">{t("recording_in_progress")}</p>
                    )}

                    {!gravando && !audioUrl && (
                        <p className="text-gray-500 text-xs text-center max-w-[220px]">{t("tap_mic_to_read")}</p>
                    )}

                    {audioUrl && !gravando && !fraseEncerrada && (
                        <div className="w-full flex flex-col items-center gap-3">
                            <AudioPreviewPlayer src={audioUrl} />

                            <div className="flex flex-col gap-3 w-full">
                                {!audioVazio && (
                                    <button
                                        onClick={enviarResposta}
                                        disabled={enviando}
                                        className="w-full px-4 py-2.5 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] disabled:opacity-50 text-white text-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                        {enviando ? t("sending") : t("send")}
                                    </button>
                                )}

                                <button
                                    onClick={() => { setError(null); setAudioVazio(false); limpar(); }}
                                    className="w-full px-4 py-2.5 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white text-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    {t("re_record")}
                                </button>
                            </div>
                        </div>
                    )}

                    {fraseEncerrada && (
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full px-4 py-2.5 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white text-lg font-medium transition-colors"
                        >
                            {t("back")}
                        </button>
                    )}

                    {erroGravacao && (
                        <p className="text-red-400 text-xs text-center">{erroGravacao}</p>
                    )}

                    {error && (
                        <p className="text-red-400 text-xs text-center">{error}</p>
                    )}
                </div>
            )}

            <PremiumModal
                isOpen={isPremiumModalOpen}
                setIsPremiumModalOpen={setIsPremiumModalOpen}
                onClose={() => { setIsPremiumModalOpen(false); setMotivoPremium(null); }}
                motivo={motivoPremium}
            />
        </div>
    );
}
