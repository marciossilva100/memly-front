import { useState, useEffect, useRef } from "react"
import { Mic, Square, RotateCcw, History, SkipForward, Send, Languages, Ban, AlertCircle, Keyboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pararAudio } from "../utils/audioPlayer";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import useAudioRecorder from "../hooks/useAudioRecorder";
import AudioPreviewPlayer from "../components/AudioPreviewPlayer";
import PremiumModal from "../components/PremiumModal";
import LimiteDiarioModal from "../components/LimiteDiarioModal";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"

function corNota(nota) {
    if (nota >= 8) return "text-green-400 border-green-400/30 bg-green-400/10";
    if (nota >= 5) return "text-amber-400 border-amber-400/30 bg-amber-400/10";
    return "text-red-400 border-red-400/30 bg-red-400/10";
}

// Mesma estrutura de Perguntas.jsx (loading/premium/limite/conteúdo
// insuficiente/erro/tela principal), com duas diferenças deliberadas: (1)
// sem flip de card - o gabarito só aparece DEPOIS de responder, senão o
// exercício vira cópia; (2) sem botão "Ouvir" - o texto já está no idioma
// nativo do usuário, ele já entende lendo, não há ganho em sintetizar áudio.
export default function TraducaoReversa() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null)
    const [audioVazio, setAudioVazio] = useState(false)
    const [textoEncerrado, setTextoEncerrado] = useState(false)
    const [id, setId] = useState(null)
    const [textoNativo, setTextoNativo] = useState('')
    const [idiomaAlvo, setIdiomaAlvo] = useState('')
    const [numero, setNumero] = useState(null)
    const [total, setTotal] = useState(null)
    const [resultado, setResultado] = useState(null)
    const [enviando, setEnviando] = useState(false)
    const [modoTexto, setModoTexto] = useState(false)
    const [respostaTexto, setRespostaTexto] = useState("")
    const jaBuscou = useRef(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const [premiumRequired, setPremiumRequired] = useState(false);
    const [limitReached, setLimitReached] = useState(false);
    const [mensagemLimite, setMensagemLimite] = useState(null);
    const [insufficientContent, setInsufficientContent] = useState(false);
    const [frasesCurtas, setFrasesCurtas] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [limiteModalOpen, setLimiteModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;

    const { gravando, audioBlob, audioUrl, erro: erroGravacao, iniciarGravacao, pararGravacao, limpar } = useAudioRecorder();

    useEffect(() => () => pararAudio(), []);

    const fetchTexto = () => {
        setLoading(true);
        setError(null);
        setInsufficientContent(false);
        setAudioVazio(false);
        setTextoEncerrado(false);
        setModoTexto(false);
        setRespostaTexto("");
        limpar();

        fetch(`${API_URL}/controller/TraducaoReversaController.php`, {
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
                        setTextoNativo('');
                        setMotivoPremium("traducao_reversa_ia");
                        setIsPremiumModalOpen(true);
                        return;
                    }
                    if (data.limite_atingido) {
                        setLimitReached(true);
                        setTextoNativo('');
                        setMensagemLimite(data.message || null);
                        if (user?.plano === 3) {
                            setLimiteModalOpen(true);
                        }
                        return;
                    }
                    if (data.conteudo_insuficiente) {
                        setInsufficientContent(true);
                        setFrasesCurtas(Boolean(data.frases_curtas));
                        setTextoNativo('');
                        return;
                    }
                    setError(data.message || t("unexpected_error"));
                    setTextoNativo('');
                    return;
                }

                setId(data.id);
                setTextoNativo(data.texto);
                setIdiomaAlvo(data.idioma_alvo || '');
                setNumero(data.numero ?? null);
                setTotal(data.total ?? null);
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
        fetchTexto();
    }, []);

    const handleSkip = async () => {
        try {
            const formData = new FormData();
            formData.append('action', 'skip');

            await fetch(`${API_URL}/controller/TraducaoReversaController.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: formData
            });

            setResultado(null);
            fetchTexto();
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
            formData.append('id', id);
            formData.append('audio', audioBlob, 'audio.webm');

            const res = await fetch(`${API_URL}/controller/TraducaoReversaController.php`, {
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
                    setTextoEncerrado(true);
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
            formData.append('id', id);
            formData.append('resposta', respostaTexto);

            const res = await fetch(`${API_URL}/controller/TraducaoReversaController.php`, {
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
                    setTextoEncerrado(true);
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

    function proximoTexto() {
        setResultado(null);
        fetchTexto();
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

    if (insufficientContent) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-6 from-gray-900 to-gray-800 bg-gradient-to-br">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>

                <h1 className="text-xl font-semibold text-white mb-2">
                    {t("insufficient_content")}
                </h1>
                <p className="text-gray-400 text-sm max-w-xs">
                    {frasesCurtas ? t("add_longer_phrases_hint") : t("add_more_phrases_hint")}
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

    if (error && !textoNativo) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-6 from-gray-900 to-gray-800 bg-gradient-to-br">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>

                <h1 className="text-xl font-semibold text-white mb-2">
                    {t("unexpected_error")}
                </h1>
                <p className="text-gray-400 text-sm max-w-xs">
                    {error}
                </p>

                <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
                    <button
                        onClick={fetchTexto}
                        className="px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
                    >
                        {t("try_again")}
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white font-medium transition-colors"
                    >
                        {t("back")}
                    </button>
                </div>
            </div>
        );
    }

    if (limitReached) {
        const limiteVitalicio = user?.plano === 3;

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

                <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
                    <button
                        onClick={() => navigate('/traducaoreversa/historico')}
                        className="px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <History className="w-4 h-4" />
                        {t("view_history")}
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white font-medium transition-colors"
                    >
                        {t("back")}
                    </button>
                </div>

                {limiteVitalicio && (
                    <>
                        <LimiteDiarioModal
                            isOpen={limiteModalOpen}
                            mensagem={mensagemLimite || t("come_back_tomorrow")}
                            onClose={() => setLimiteModalOpen(false)}
                            onAssinarPremium={() => {
                                setLimiteModalOpen(false);
                                setMotivoPremium("traducao_reversa_ia");
                                setIsPremiumModalOpen(true);
                            }}
                        />
                        <PremiumModal
                            isOpen={isPremiumModalOpen}
                            setIsPremiumModalOpen={setIsPremiumModalOpen}
                            onClose={() => setIsPremiumModalOpen(false)}
                            motivo={motivoPremium}
                        />
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 justify-center w-full px-6 h-screen flex flex-col h-dvh from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
                <div className="relative mb-6 flex items-center justify-between">
                    <div
                        className="cursor-pointer"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-2xl text-white"></i>
                    </div>

                    <button
                        onClick={() => navigate('/traducaoreversa/historico')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 text-xs hover:bg-gray-700/50 transition-colors"
                    >
                        <History className="w-3.5 h-3.5" />
                        {t("view_history")}
                    </button>
                </div>

                <h1 className="flex items-center justify-center gap-2 text-lg font-semibold text-white text-center mb-1">
                    <Languages className="w-5 h-5 text-purple-400" />
                    {t("traducao_reversa_training")}
                </h1>
                <p className="text-gray-400 text-xs text-center mb-2 px-4">
                    {t("traducao_reversa_training_desc")}
                </p>

                {!resultado &&
                    <div>
                        {idiomaAlvo && (
                            <p className="text-center text-gray-400 text-xs mt-4 mb-2">
                                {t("translate_prompt_instruction", { idioma: idiomaAlvo })}
                            </p>
                        )}

                        <div className="flex justify-center">
                            <div className="w-full rounded-2xl border border-gray-700 bg-gradient-to-br from-[#233245] to-[#0d1425] px-6 py-5 shadow-md flex flex-col items-center gap-2 min-h-[180px]">
                                <div className="flex items-center justify-between w-full shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-purple-400/10 border border-purple-400/30 flex items-center justify-center">
                                        <Languages className="w-5 h-5 text-purple-400" />
                                    </div>
                                    {numero && total && (
                                        <span className="text-xs text-gray-400 font-medium px-2.5 py-1 rounded-full bg-gray-800/60 border border-gray-700">
                                            {t("text_counter", { numero, total })}
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 flex items-center min-h-0">
                                    <p className="text-lg [@media(max-height:700px)]:text-base text-white leading-relaxed text-center">
                                        {textoNativo}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col items-center gap-4">
                            {!modoTexto && !audioUrl && !gravando && (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => { setError(null); setAudioVazio(false); iniciarGravacao(); }}
                                        className="relative w-14 h-14 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] flex items-center justify-center shadow-lg shadow-[#4cb8c4]/20 transition"
                                    >
                                        <Mic className="w-5 h-5 text-white" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setError(null); setModoTexto(true); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 text-xs hover:bg-gray-700/50 transition-colors"
                                    >
                                        <Keyboard className="w-3.5 h-3.5" />
                                        {t("type_answer")}
                                    </button>
                                </div>
                            )}

                            {!modoTexto && gravando && (
                                <button
                                    onClick={pararGravacao}
                                    className="relative w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg"
                                >
                                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                                    <Square className="w-5 h-5 text-white relative z-10" />
                                </button>
                            )}

                            {!modoTexto && gravando && (
                                <p className="text-red-400 text-sm font-medium">{t("recording_in_progress")}</p>
                            )}

                            {!modoTexto && !gravando && !audioUrl && (
                                <p className="text-gray-500 text-xs text-center max-w-[220px]">{t("tap_mic_to_answer")}</p>
                            )}

                            {!modoTexto && audioUrl && !gravando && !textoEncerrado && (
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

                            {modoTexto && !textoEncerrado && (
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

                            {textoEncerrado && (
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
                            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wide">{t("your_translation_label")}</p>
                            <p className="text-white italic">"{resultado.resposta}"</p>
                        </div>

                        <div className="rounded-xl border border-gray-700 bg-gradient-to-br from-[#233245] to-[#0d1425] p-4">
                            <p className="text-[#4cb8c4] text-xs mb-1 uppercase tracking-wide font-semibold">{t("feedback_label")}</p>
                            <p className="text-white leading-relaxed">{resultado.feedback}</p>
                        </div>

                        <div className="rounded-xl border border-purple-400/30 bg-purple-400/10 p-4">
                            <p className="text-purple-400 text-xs mb-1 uppercase tracking-wide font-semibold">{t("suggested_translation_label")}</p>
                            <p className="text-white leading-relaxed">{resultado.traducao_gabarito}</p>
                        </div>
                    </div>
                }
            </div>

            {!resultado &&
                <div className="fixed bottom-0 left-0 w-full px-6 py-4 text-center bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent">
                    <button
                        onClick={handleSkip}
                        className="px-6 py-3 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white w-full flex items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
                        <SkipForward className="w-4 h-4" />
                        {t("next_question")}
                    </button>
                </div>
            }

            {resultado && resultado.pode_tentar_novamente &&
                <div className="fixed bottom-0 left-0 w-full px-6 py-4 text-center bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent">
                    <button
                        onClick={tentarNovamente}
                        className="px-6 py-3 w-full rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium flex items-center justify-center gap-2 transition-colors">
                        <RotateCcw className="w-4 h-4" />
                        {t("try_again")}
                    </button>
                </div>
            }

            {resultado && !resultado.pode_tentar_novamente &&
                <div className="fixed bottom-0 left-0 w-full px-6 py-4 text-center bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent">
                    <button
                        onClick={proximoTexto}
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
