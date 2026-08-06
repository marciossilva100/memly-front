import { useState, useEffect, useRef } from "react"
import { Volume2, Mic, Square, RotateCcw, History, SkipForward, Send, MessageCircleQuestion, Ban, AlertCircle, Eye, EyeOff, Keyboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { playAudio } from "../utils/audioPlayer";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import useAudioRecorder from "../hooks/useAudioRecorder";
import AudioPreviewPlayer from "../components/AudioPreviewPlayer";
import PremiumModal from "../components/PremiumModal";
import usePremiumLimitListener from "../hooks/usePremiumLimitListener";
import TextoDestacado from "../components/TextoDestacado";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"

function corNota(nota) {
    if (nota >= 8) return "text-green-400 border-green-400/30 bg-green-400/10";
    if (nota >= 5) return "text-amber-400 border-amber-400/30 bg-amber-400/10";
    return "text-red-400 border-red-400/30 bg-red-400/10";
}

export default function Perguntas() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null)
    const [audioVazio, setAudioVazio] = useState(false)
    const [perguntaEncerrada, setPerguntaEncerrada] = useState(false)
    const [questionId, setQuestionId] = useState(null)
    const [question, setQuestion] = useState('')
    const [questionTraducao, setQuestionTraducao] = useState('')
    const [questionDestacada, setQuestionDestacada] = useState(null)
    const [mostrarVocabulario, setMostrarVocabulario] = useState(false)
    const [flipped, setFlipped] = useState(false)
    const [numeroPergunta, setNumeroPergunta] = useState(null)
    const [totalPerguntas, setTotalPerguntas] = useState(null)
    const [resultado, setResultado] = useState(null)
    const [enviando, setEnviando] = useState(false)
    const [modoTexto, setModoTexto] = useState(false)
    const [respostaTexto, setRespostaTexto] = useState("")
    const jaBuscou = useRef(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const [premiumRequired, setPremiumRequired] = useState(false);
    const [limitReached, setLimitReached] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;

    const { gravando, audioBlob, audioUrl, erro: erroGravacao, iniciarGravacao, pararGravacao, limpar } = useAudioRecorder();

    usePremiumLimitListener((motivo) => {
        setMotivoPremium(motivo);
        setIsPremiumModalOpen(true);
    });

    const fetchQuestion = () => {
        setLoading(true);
        setError(null);
        setAudioVazio(false);
        setPerguntaEncerrada(false);
        setFlipped(false);
        setModoTexto(false);
        setRespostaTexto("");
        limpar();

        fetch(`${API_URL}/controller/DailyQuestionController.php`, {
            method: 'GET',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (!data.success) {
                    if (data.premium_necessario) {
                        setPremiumRequired(true);
                        setQuestion('');
                        setMotivoPremium("limite_gratuito");
                        setIsPremiumModalOpen(true);
                        return;
                    }
                    if (data.limite_atingido) {
                        setLimitReached(true);
                        setQuestion('');
                        if (user?.plano === 3) {
                            setMotivoPremium("limite_gratuito");
                            setIsPremiumModalOpen(true);
                        }
                        return;
                    }
                    setError(data.message || t("unexpected_error"));
                    setQuestion('');
                    return;
                }

                setQuestionId(data.id);
                setQuestion(data.question);
                setQuestionTraducao(data.traducao || '');
                setQuestionDestacada(data.question_destacada || null);
                setNumeroPergunta(data.numero ?? null);
                setTotalPerguntas(data.total ?? null);
            })
            .catch(err => {
                console.error(err);
                setError(t("could_not_generate_training"));
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (jaBuscou.current) return;
        jaBuscou.current = true;
        fetchQuestion();
    }, []);

    const handleSkip = async () => {
        try {
            const formData = new FormData();
            formData.append('action', 'skip');

            await fetch(`${API_URL}/controller/DailyQuestionController.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: formData
            });

            setResultado(null);
            fetchQuestion();
        } catch (err) {
            console.error(err);
        }
    };

    async function enviarResposta() {
        if (!audioBlob) return;

        setEnviando(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('question_id', questionId);
            formData.append('audio', audioBlob, 'audio.webm');

            const res = await fetch(`${API_URL}/controller/DailyQuestionController.php`, {
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
                    setPerguntaEncerrada(true);
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

    async function enviarRespostaTexto() {
        if (!respostaTexto.trim()) return;

        setEnviando(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('action', 'responder_texto');
            formData.append('question_id', questionId);
            formData.append('resposta', respostaTexto);

            const res = await fetch(`${API_URL}/controller/DailyQuestionController.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: formData
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.message || t("unexpected_error"));
                if (data.pode_tentar_novamente === false) {
                    setPerguntaEncerrada(true);
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

    function proximaPergunta() {
        setResultado(null);
        fetchQuestion();
    }

    function tentarNovamente() {
        setResultado(null);
        setRespostaTexto("");
        limpar();
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

    if (error && !question) {
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

    // LIMITE ATINGIDO
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

    return (
        <div className="p-4 justify-center w-full px-6 h-screen flex flex-col h-dvh from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide ">
                <div className="relative mb-6 flex items-center justify-between">
                    <div
                        className="cursor-pointer"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-2xl text-white"></i>
                    </div>

                    <button
                        onClick={() => navigate('/perguntasia/historico')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 text-xs hover:bg-gray-700/50 transition-colors"
                    >
                        <History className="w-3.5 h-3.5" />
                        {t("view_history")}
                    </button>
                </div>

                {questionDestacada && !resultado && (
                    <div className="flex flex-col items-center mb-4 gap-1.5">
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
                        {mostrarVocabulario && !questionDestacada.some(t => t.destaque) && (
                            <p className="text-gray-500 text-xs">{t("no_vocabulary_matched")}</p>
                        )}
                    </div>
                )}

                {!resultado &&
                    <div>
                        <div className="perspective flex justify-center h-[260px]">
                            <div className="flashcard w-full h-full">
                                <div
                                    className={`card w-full h-full ${flipped ? "flip" : ""}`}
                                    onClick={() => setFlipped(!flipped)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="card-front rounded-2xl border border-gray-700 bg-gradient-to-br from-[#233245] to-[#0d1425] px-6 py-5 shadow-md flex flex-col items-center gap-2">
                                        <div className="flex items-center justify-between w-full shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 flex items-center justify-center">
                                                <MessageCircleQuestion className="w-5 h-5 text-[#4cb8c4]" />
                                            </div>
                                            {numeroPergunta && totalPerguntas && (
                                                <span className="text-xs text-gray-400 font-medium px-2.5 py-1 rounded-full bg-gray-800/60 border border-gray-700">
                                                    {t("question_counter", { numero: numeroPergunta, total: totalPerguntas })}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 flex items-center min-h-0">
                                            <p className="text-lg [@media(max-height:700px)]:text-base text-white leading-relaxed text-center">
                                                <TextoDestacado tokens={mostrarVocabulario ? questionDestacada : null} texto={question} />
                                            </p>
                                        </div>

                                        <button
                                            data-audio-hint-target
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                playAudio(question, user, true);
                                            }}
                                            className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 text-[#4cb8c4] text-xs hover:bg-[#4cb8c4]/20 transition-colors"
                                        >
                                            <Volume2 className="w-3.5 h-3.5" />
                                            {t("listen")}
                                        </button>
                                    </div>

                                    <div className="card-back rounded-2xl border border-gray-700 bg-gradient-to-br from-[#0d1425] to-[#233245] px-6 py-5 shadow-md flex flex-col items-center gap-2">
                                        <div className="flex-1 flex items-center min-h-0">
                                            <p className="text-lg [@media(max-height:700px)]:text-base text-white leading-relaxed text-center">{questionTraducao}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-gray-500 text-xs mt-2">{t("tap_card_to_flip")}</p>

                        <div className={`mt-10 flex flex-col items-center gap-4 ${flipped ? "hidden" : ""}`}>
                            {!modoTexto && !audioUrl && !gravando && (
                                <button
                                    onClick={() => { setError(null); setAudioVazio(false); iniciarGravacao(); }}
                                    className="relative w-20 h-20 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] flex items-center justify-center shadow-lg shadow-[#4cb8c4]/20 transition"
                                >
                                    <Mic className="w-7 h-7 text-white" />
                                </button>
                            )}

                            {!modoTexto && gravando && (
                                <button
                                    onClick={pararGravacao}
                                    className="relative w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-lg"
                                >
                                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                                    <Square className="w-6 h-6 text-white relative z-10" />
                                </button>
                            )}

                            {!modoTexto && gravando && (
                                <p className="text-red-400 text-sm font-medium">{t("recording_in_progress")}</p>
                            )}

                            {!modoTexto && !gravando && !audioUrl && (
                                <p className="text-gray-500 text-xs text-center max-w-[220px]">{t("tap_mic_to_answer")}</p>
                            )}

                            {!modoTexto && !gravando && !audioUrl && (
                                <button
                                    type="button"
                                    onClick={() => { setError(null); setModoTexto(true); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 text-xs hover:bg-gray-700/50 transition-colors"
                                >
                                    <Keyboard className="w-3.5 h-3.5" />
                                    {t("type_answer")}
                                </button>
                            )}

                            {!modoTexto && audioUrl && !gravando && !perguntaEncerrada && (
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

                            {modoTexto && !perguntaEncerrada && (
                                <div className="w-full flex flex-col items-center gap-3">
                                    <textarea
                                        value={respostaTexto}
                                        onChange={(e) => setRespostaTexto(e.target.value)}
                                        placeholder={t("type_answer_placeholder")}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white text-base placeholder:text-gray-500 focus:outline-none focus:border-[#4cb8c4] resize-none"
                                    />

                                    <div className="flex flex-col gap-3 w-full">
                                        <button
                                            onClick={enviarRespostaTexto}
                                            disabled={enviando || !respostaTexto.trim()}
                                            className="w-full px-4 py-2.5 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] disabled:opacity-50 text-white text-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                            {enviando ? t("sending") : t("send")}
                                        </button>

                                        <button
                                            onClick={() => { setError(null); setModoTexto(false); setRespostaTexto(""); }}
                                            className="w-full px-4 py-2.5 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white text-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors"
                                        >
                                            <Mic className="w-4 h-4" />
                                            {t("answer_by_voice")}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {perguntaEncerrada && (
                                <p className="text-gray-400 text-xs text-center max-w-[220px]">{t("next_question")} ↓</p>
                            )}

                            {erroGravacao && (
                                <p className="text-red-400 text-xs text-center">{erroGravacao}</p>
                            )}

                            {error && (
                                <p className="text-red-400 text-xs text-center">{error}</p>
                            )}
                        </div>
                    </div>
                }

                {resultado &&
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

                        <div className="rounded-xl border border-gray-700 bg-gradient-to-br from-[#233245] to-[#0d1425] p-4">
                            <p className="text-[#4cb8c4] text-xs mb-1 uppercase tracking-wide font-semibold">{t("feedback_label")}</p>
                            <p className="text-white leading-relaxed">{resultado.feedback}</p>
                        </div>
                    </div>
                }
            </div>

            {!resultado &&
                <div className="sticky bottom-0 py-4 text-center">
                    <button
                        onClick={handleSkip}
                        className="px-6 py-3 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white w-full flex items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
                        <SkipForward className="w-4 h-4" />
                        {t("next_question")}
                    </button>
                </div>
            }

            {resultado && resultado.pode_tentar_novamente &&
                <div className="sticky bottom-0 py-4 text-center">
                    <button
                        onClick={tentarNovamente}
                        className="px-6 py-3 w-full rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium flex items-center justify-center gap-2 transition-colors">
                        <RotateCcw className="w-4 h-4" />
                        {t("try_again")}
                    </button>
                </div>
            }

            {resultado && !resultado.pode_tentar_novamente &&
                <div className="sticky bottom-0 py-4 text-center">
                    <button
                        onClick={proximaPergunta}
                        className="px-6 py-3 w-full rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors">
                        {t("next_question")}
                    </button>
                </div>
            }

            <PremiumModal
                isOpen={isPremiumModalOpen}
                setIsPremiumModalOpen={setIsPremiumModalOpen}
                onClose={() => { setIsPremiumModalOpen(false); setMotivoPremium(null); }}
                motivo={motivoPremium}
            />
        </div>
    )
}
