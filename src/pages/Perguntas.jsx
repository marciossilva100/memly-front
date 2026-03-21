import { useState, useEffect, useRef } from "react"
import { Volume, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { playAudio } from "../utils/audioPlayer";
import { useAuth } from "../context/AuthContext";

export default function () {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null)
    const [question, setQuestion] = useState('')
    const [response, setResponse] = useState('')
    const [answer, setAnswer] = useState('')
    const jaBuscou = useRef(false);
    const [textLoading, setTextLoading] = useState('')
    const navigate = useNavigate();
    const { user } = useAuth();

    // ✅ NOVOS STATES
    const [limitReached, setLimitReached] = useState(false);
    const [totalToday, setTotalToday] = useState(0);
    const [isCorrect, setIsCorrect] = useState(false);

    // 🔁 FUNÇÃO PARA BUSCAR PERGUNTA
    const fetchQuestion = () => {
        setTextLoading('Gerando treino...')
        setLoading(true);
        setError(null);

        fetch('/api/controller/DailyQuestionController.php', {
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
                    setError(data.error || 'Erro desconhecido');
                    setQuestion('');
                    return;
                }

                setTotalToday(data.total_today || 0);
                setLimitReached(data.limit_reached || false);

                if (data.limit_reached) {
                    setQuestion('');
                    return;
                }

                setQuestion(data.question);
            })
            .catch(err => {
                console.error(err);
                setError('Não foi possível gerar o treino.');
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
            await fetch('/api/controller/DailyQuestionController.php', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    question: question, // ✅ corrigido
                    action: 'skip'
                }),
            });

            // limpa estado
            setAnswer('');
            setResponse(''); // ✅ corrigido
            setIsCorrect(false);

            // carrega próxima pergunta
            fetchQuestion();

        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        setTextLoading('Processando resposta...')
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/controller/DailyQuestionController.php', {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ question, answer })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            if (!data.success) throw new Error(data.error);

            setResponse(data.feedback);
            setIsCorrect(data.is_correct);

            // ✅ SE ACERTOU → PRÓXIMA PERGUNTA
            if (data.is_correct) {
                setTimeout(() => {
                    setResponse('');
                    setAnswer('');
                    fetchQuestion();
                }, 1200);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    function tryAgain(e) {
        e.preventDefault()
        setResponse('')
        setIsCorrect(false)
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-70px)] flex items-center justify-center">
                <Loader2 className="animate-spin mr-2 w-8 h-8 text-indigo-600" />
                <span className="text-slate-600 text-lg">{textLoading}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center p-6">
                <h1 className="text-2xl font-semibold text-yellow-600 mb-4">
                    ⚠️ Conteúdo insuficiente
                </h1>

                <p className="text-slate-600 mb-2">
                    {error}
                </p>

                <p className="text-slate-500">
                    Adicione mais frases com mais detalhes para liberar o treino.
                </p>

                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 px-6 py-3 rounded-full bg-[#4cb8c4] text-white"
                >
                    Voltar
                </button>
            </div>
        );
    }

    // 🚫 LIMITE ATINGIDO
    if (limitReached) {
        return (
            <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center p-6">
                <h1 className="text-2xl font-semibold text-red-500 mb-4">
                    Limite diário atingido 🚫
                </h1>
                <p className="text-slate-600">
                    Você já fez {totalToday} perguntas hoje.
                </p>
                <p className="text-slate-500 mt-2">
                    Volte amanhã para continuar praticando 💪
                </p>

                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 px-6 py-3 rounded-full bg-[#4cb8c4] text-white"
                >
                    Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 justify-center w-full px-6 h-dvh flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="relative mb-6">
                    <div
                        className="cursor-pointer"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-2xl"></i>
                    </div>
                </div>

                {/* PROGRESSO */}
                <p className="text-sm text-gray-500 text-center mb-2">
                    {totalToday}/4 perguntas hoje
                </p>

                {response && !isCorrect &&
                    <form onSubmit={handleSubmit} className="w-full" id="responderForm">
                        <div>
                            <div className="flex border p-4 text-center shadow-md overflow-y-auto rounded-lg min-h-80 items-center">
                                <p className="text-lg">{response}</p>
                            </div>
                        </div>
                    </form>
                }

                {!response &&
                    <form onSubmit={handleSubmit} className="w-full" id="respostaForm">
                        <div>
                            <div className="flex border p-6 text-center shadow-md bg-gradient-to-r from-[#4cb8c4] to-[#085078] text-white rounded-lg min-h-80 items-center justify-center">
                                <p className="text-2xl">{question}</p>
                            </div>

                            <div className="text-center flex justify-center mt-5">
                                <button onClick={(e) => {
                                    e.preventDefault();
                                    playAudio(question, user,true);
                                }} className="px-4 py-2 rounded-md bg-slate-400 text-white text-sm hover:bg-blue-600 transition flex">
                                    <Volume className="w-5 h-5" />
                                    Ouvir
                                </button>
                            </div>
                        </div>

                        <div className="bg-white py-4 text-center">
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Deixe sua resposta em inglês"
                                className="w-full mb-6 text-lg h-32 pt-6 text-center rounded-lg border border-gray-300 resize-none"
                            />
                        </div>
                    </form>
                }
            </div>

            {!response &&
                <div className="bg-white sticky bottom-0 py-4 text-center">
                    <button form="respostaForm" className="px-6 py-3 rounded-full bg-[#4cb8c4] text-white w-full">
                        Enviar
                    </button>
                </div>
            }

            {response && !isCorrect &&
                <div className="bg-white sticky bottom-0 py-4 text-center flex gap-3">
                    <button
                        onClick={tryAgain}
                        className="px-6 py-3 w-full rounded-full bg-[#4cb8c4] text-white">
                        Tentar novamente
                    </button>

                    <button
                        onClick={handleSkip}
                        className="px-8 py-3 rounded-full bg-red-400 text-white">
                        Pular
                    </button>
                </div>
            }
        </div>
    )
}