import { useState, useEffect, useRef } from "react"
import { Volume, Mic, Square, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { playAudio } from "../utils/audioPlayer";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import useAudioRecorder from "../hooks/useAudioRecorder";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"

export default function Perguntas() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null)
    const [questionId, setQuestionId] = useState(null)
    const [question, setQuestion] = useState('')
    const [resultado, setResultado] = useState(null)
    const [enviando, setEnviando] = useState(false)
    const jaBuscou = useRef(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const [premiumRequired, setPremiumRequired] = useState(false);
    const [limitReached, setLimitReached] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;

    const { gravando, audioBlob, audioUrl, erro: erroGravacao, iniciarGravacao, pararGravacao, limpar } = useAudioRecorder();

    const fetchQuestion = () => {
        setLoading(true);
        setError(null);
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
                        return;
                    }
                    if (data.limite_atingido) {
                        setLimitReached(true);
                        setQuestion('');
                        return;
                    }
                    setError(data.message || t("unexpected_error"));
                    setQuestion('');
                    return;
                }

                setQuestionId(data.id);
                setQuestion(data.question);
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
                return;
            }

            setResultado(data);
            playAudio(data.feedback, user, true);
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
            <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center p-6 ">
                <h1 className="text-2xl font-semibold text-[#085078] mb-4">
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

    if (error && !question) {
        return (
            <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center p-6 ">
                <h1 className="text-2xl font-semibold text-yellow-600 mb-4">
                    {t("insufficient_content")}
                </h1>

                <p className="text-slate-600 mb-2">
                    {error}
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

    // 🚫 LIMITE ATINGIDO
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
                    className="mt-6 px-6 py-3 rounded-full  text-white"
                >
                    {t("back")}
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 justify-center w-full px-6 h-screen flex flex-col h-dvh from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide ">
                <div className="relative mb-6">
                    <div
                        className="cursor-pointer"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-2xl text-white"></i>
                    </div>
                </div>

                {!resultado &&
                    <div>
                        <div className="flex border border-gray-700 p-6 text-center shadow-md bg-[linear-gradient(to_right,#233245,#0d1425)] text-white rounded-lg  items-center justify-center min-h-40">
                            <p className="text-2xl">{question}</p>
                        </div>

                        <div className="text-center flex justify-center mt-5">
                            <button onClick={(e) => {
                                e.preventDefault();
                                playAudio(question, user, true);
                            }} className="px-4 py-2 rounded-md bg-slate-400 text-white text-sm hover:bg-blue-600 transition flex items-center gap-2">
                                <Volume className="w-5 h-5" />
                                {t("listen")}
                            </button>
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-4">
                            {!audioUrl && !gravando && (
                                <button
                                    onClick={iniciarGravacao}
                                    className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition"
                                >
                                    <Mic className="w-8 h-8 text-white" />
                                </button>
                            )}

                            {gravando && (
                                <button
                                    onClick={pararGravacao}
                                    className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-lg animate-pulse"
                                >
                                    <Square className="w-8 h-8 text-white" />
                                </button>
                            )}

                            {gravando && (
                                <p className="text-white text-sm">{t("recording_in_progress")}</p>
                            )}

                            {audioUrl && !gravando && (
                                <div className="w-full flex flex-col items-center gap-3">
                                    <audio controls src={audioUrl} className="w-full" />

                                    <div className="flex gap-3 w-full">
                                        <button
                                            onClick={limpar}
                                            className="flex-1 px-4 py-2 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white text-sm flex items-center justify-center gap-2"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            {t("re_record")}
                                        </button>

                                        <button
                                            onClick={enviarResposta}
                                            disabled={enviando}
                                            className="flex-1 px-4 py-2 rounded-full bg-[#4cb8c4] disabled:opacity-50 text-white text-sm"
                                        >
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
                    </div>
                }

                {resultado &&
                    <div className="flex flex-col gap-4">
                        <div className="text-center">
                            <span className="text-5xl font-bold text-[#4cb8c4]">{resultado.nota}</span>
                            <span className="text-gray-400 text-xl">/10</span>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                            <p className="text-gray-400 text-xs mb-1">{t("transcription_label")}</p>
                            <p className="text-white italic">"{resultado.transcricao}"</p>
                        </div>

                        <div className="flex border p-4 text-center shadow-md overflow-y-auto rounded-lg min-h-32 items-center bg-[linear-gradient(to_right,#0d1425,#233245)]">
                            <p className="text-lg text-white">{resultado.feedback}</p>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    playAudio(resultado.feedback, user, true);
                                }}
                                className="px-4 py-2 rounded-md bg-slate-400 text-white text-sm hover:bg-blue-600 transition inline-flex items-center gap-2"
                            >
                                <Volume className="w-5 h-5" />
                                {t("listen")}
                            </button>
                        </div>
                    </div>
                }
            </div>

            {!resultado &&
                <div className="sticky bottom-0 py-4 text-center">
                    <button
                        onClick={handleSkip}
                        className="px-6 py-3 rounded-full bg-gray-800/50 backdrop-blur-sm  border border-gray-700 text-white w-full">
                        {t("next_question")}
                    </button>
                </div>
            }

            {resultado &&
                <div className="sticky bottom-0 py-4 text-center">
                    <button
                        onClick={proximaPergunta}
                        className="px-6 py-3 w-full rounded-full bg-[#4cb8c4] text-white">
                        {t("next_question")}
                    </button>
                </div>
            }
        </div>
    )
}
