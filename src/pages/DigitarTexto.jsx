import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { makePerfectDiff } from "../utils/makePerfectDiff";
import '../digitartexto.css'
import { Check } from "lucide-react";

export default function DigitarTexto() {

    const { id, mode } = useParams();

    const [diff, setDiff] = useState(null)
    const [frases, setFrases] = useState([]);
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showBackContent, setShowBackContent] = useState(false);
    const [resposta, setResposta] = useState('')
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(true);

    const [acertos, setAcertos] = useState(0);
    const [erros, setErros] = useState(0);

    const [idPhrases, setIdPhrases] = useState([])

    const navigate = useNavigate();
    const textareaRef = useRef(null);

    useEffect(() => {

        if (!isFlipped) {

            const timer = setTimeout(() => {
                textareaRef.current?.focus();
            }, 400);

            return () => clearTimeout(timer);

        }

    }, [isFlipped]);

    // preload voices
    useEffect(() => {

        const loadVoices = () => window.speechSynthesis.getVoices();
        loadVoices();

        window.speechSynthesis.onvoiceschanged = loadVoices;

        const silentUtterance = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(silentUtterance);
        window.speechSynthesis.cancel();

    }, []);

    // buscar frases
    useEffect(() => {

        let endpoint =
            mode === "traine"
                ? "controller/treino.php"
                : "controller/frases.php";

        setLoading(true);

        fetch(`https://zaldemy.com/${endpoint}`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                action: mode,
                category_id: id,
            })
        })
            .then(res => res.json())
            .then(data => {

                setFrases(data || []);

                const ids = data.map(item => item.id);
                setIdPhrases(ids);

            })
            .catch(() => {
                setFrases([]);
            })
            .finally(() => {
                setLoading(false);
            });

    }, [id, mode]);


    function virarFlashcard() {

        setIsFlipped(true);
        setShowBackContent(false);

        setTimeout(() => {

            setShowBackContent(true);
            playAudio(frases[index].texto_traduzido);

        }, 200);

    }

    async function trainingUpdate(updatedList, actionToSend) {

        try {

            const res = await fetch("https://zaldemy.com/controller/treino.php", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: actionToSend,
                    updatedList: updatedList,
                    category_id: id
                })
            });

            const data = await res.json();

            if (!data.success) {
                console.log(data.message);
            }

        } catch (error) {
            console.log(error);
        }

    }

    const playAudio = (text) => {

        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);

        const voices = window.speechSynthesis.getVoices();

        const voice =
            voices.find(v => v.lang === "en-US") ||
            voices.find(v => v.lang.startsWith("en"));

        if (voice) utterance.voice = voice;

        utterance.lang = "en-US";
        utterance.rate = 0.9;
        utterance.pitch = 1;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);

    };

    const nextCard = async () => {

        window.speechSynthesis.cancel();

        const isLast = index === frases.length - 1;

        setDiff(null);
        setIsFlipped(false);
        setShowBackContent(false);
        setResposta("");

        if (isLast) {

            if (mode === "traine") {

                await trainingUpdate(idPhrases, "trainee_finish");
                setFinished(true);
                return;

            }

            navigate(`/flashcards/${id}/learn`);
            return;

        }

        setIndex(prev => prev + 1);

    };

    const repeatCard = () => {

        window.speechSynthesis.cancel();

        setDiff(null);
        setIsFlipped(false);
        setShowBackContent(false);
        setResposta("");

    };

    function handleSubmit(e) {

        e.preventDefault();

        if (!resposta) return;

        const result = makePerfectDiff(
            frases[index].texto_traduzido,
            resposta
        );

        setDiff(result);

        if (result.isCorrect) {
            setAcertos(prev => prev + 1);
        } else {
            setErros(prev => prev + 1);
        }

        virarFlashcard();

    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                Carregando...
            </div>
        );
    }

    if (!frases.length) {
        navigate(`/home`);
        return

        return (
            <div className="h-screen flex items-center justify-center">
                Nenhuma frase encontrada
                { }
            </div>
        );
    }

    // RELATÓRIO FINAL (somente traine)

    if (finished && mode === "traine") {

        const totalPerguntas = acertos + erros;

        const porcentagem =
            totalPerguntas
                ? Math.round((acertos / totalPerguntas) * 100)
                : 0;

        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-r from-[#4cb8c4] to-[#085078] px-10">

                <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md">

                    <p className="text-xl mb-4">
                        🎉 Treino finalizado
                    </p>

                    <div className="text-5xl font-extrabold text-indigo-600 mb-2">
                        {porcentagem}%
                    </div>

                    <p className="text-gray-600 mb-6">
                        {acertos} acertos • {erros} erros
                    </p>

                    <button
                        onClick={() => navigate("/home")}
                        className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition rounded-full"
                    >
                        Voltar ao início
                    </button>

                </div>

            </div>
        );

    }

    return (

        <div className="h-dvh flex flex-col bg-slate-100 digitar-texto px-6 pb-5">

            <div className="flex-1 overflow-y-auto scrollbar-hide pt-2">

                <div className="relative text-left mb-4">

                    <div
                        className="cursor-pointer"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-xl"></i>
                    </div>

                </div>

                {!isFlipped && (
                    <div className="justify-start mb-4 w-full">

                        <h2 className="text-slate-700 text-lg">
                            O que você quer dizer em inglês?
                        </h2>

                        <span className="text-slate-500 text-sm">
                            Digite como você falaria essa frase.
                        </span>

                    </div>
                )}

                <div className="h-[40%] flex">
                    <div className="perspective flashcard justify-center flex">

                        <div
                            className={`card card-digitar-texto ${isFlipped ? "flip" : ""}`}
                        >

                            <div className="rounded-lg card-front bg-default-gradient shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-4 text-center">

                                <span className="text-md">
                                    {frases[index].texto_nativo}
                                </span>

                            </div>

                            <div className="rounded-lg card-back shadow-[0_10px_40px_rgba(0,0,0,0.09)] p-4 text-center">

                                <span className="text-md text-avocado-700">
                                    {showBackContent && frases[index].texto_traduzido}
                                </span>

                            </div>

                        </div>

                    </div>
                </div>


                {diff && !diff.isCorrect && (

                    <div className="mt-8 w-full">

                        <span className="w-full flex justify-center mb-4 font-semibold text-slate-700">
                            Você digitou:
                        </span>

                        <div className="rounded-lg w-full p-5 shadow-lg bg-white">

                            <div className="text-xl text-center">

                                {diff.diff.map((item, i) => (

                                    <span
                                        key={i}
                                        className={
                                            item.match
                                                ? "text-slate-700"
                                                : "text-red-700"
                                        }
                                    >
                                        {item.char}
                                    </span>

                                ))}

                            </div>

                        </div>

                    </div>

                )}

                <div className="w-full mt-8">

                    <form onSubmit={handleSubmit} id="respostaForm" className="h-40">

                        <div className="h-[100%] justify-center mb-8">

                            {!isFlipped && (

                                <textarea
                                    placeholder="Digite sua resposta aqui..."
                                    ref={textareaRef}
                                    value={resposta}
                                    onChange={(e) => setResposta(e.target.value)}
                                    className="outline-none w-full h-[100%] pt-6 text-center rounded-lg border border-gray-300 resize-none text-lg"
                                />

                            )}

                        </div>

                    </form>

                </div>

            </div>

            {diff && (

                !diff.isCorrect ? (

                    <div className="sticky bottom-6 w-full flex justify-center gap-3 px-10">

                        <button
                            onClick={repeatCard}
                            className="w-full bg-red-400 text-white text-lg px-5 py-3 rounded-full shadow-lg"
                        >
                            Tentar novamente
                        </button>

                    </div>

                ) : (

                    <div className="px-10 sticky bottom-6">

                        <div className="flex items-center justify-center mt-20">

                            <div className="rounded-full bg-green-600 p-4">
                                <Check className="text-white" />
                            </div>

                        </div>

                        <div className="left-0 w-full bottom-0 p-10">

                            <button
                                onClick={nextCard}
                                className="shadow-md w-full bg-avocado-500 text-white font-medium py-3 rounded-full transition"
                            >
                                Próximo
                            </button>

                        </div>

                    </div>

                )

            )}

            {!isFlipped && (

                <div className="sticky bottom-6 w-full px-6 bg-slate-100">

                    <button
                        type="submit"
                        form="respostaForm"
                        className="flex justify-center shadow-md w-full bg-[#4cb8c4] text-white font-medium py-3 rounded-full text-lg"
                    >
                        Responder
                    </button>

                </div>

            )}

        </div>

    );

}