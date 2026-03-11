import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { makePerfectDiff } from "../utils/makePerfectDiff";
import '../digitartexto.css'
import { Check, MessageCircle } from "lucide-react";

export default function DigitarTexto() {
    const { id, mode } = useParams();

    const [diff, setDiff] = useState(null)
    const [frases, setFrases] = useState([]);
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showBackContent, setShowBackContent] = useState(false);
    const [resposta, setResposta] = useState('')
    const [finished, setFinished] = useState(false);
    const [progress, setProgress] = useState(0);
    const [listIdCorrectPhrase, setListIdCorrectPhrase] = useState([]);
    const [loading, setLoading] = useState(true);
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

    // 🔹 Pré-carrega vozes
    useEffect(() => {
        const loadVoices = () => window.speechSynthesis.getVoices();
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        const silentUtterance = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(silentUtterance);
        window.speechSynthesis.cancel();
    }, []);

    // 🔹 Busca frases
    useEffect(() => {
        let endpoint =
            mode === "traine" ? "controller/treino.php" : "controller/frases.php";
        setLoading(true);

        fetch(`https://zaldemy.com/${endpoint}`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: mode,
                category_id: id,
            })
        })
            .then(res => res.json())
            .then(data => {

                setFrases(data || []);

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

        // metade da duração do transition (0.4s = 400ms)
        setTimeout(() => {
            setShowBackContent(true);
            playAudio(frases[index].texto_traduzido);
        }, 200);
    }

    async function trainingUpdate(updatedList, updatedIncorrectList, actionToSend) {
        try {
            const res = await fetch("https://zaldemy.com/controller/treino.php", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: actionToSend,
                    updatedList: updatedList,
                    updatedIncorrectList: updatedIncorrectList,
                    category_id: id
                })
            });

            const data = await res.json();

            if (!data.success) {
                console.log(data.message);
            }

            return


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
        setDiff(null);
        setIsFlipped(false);
        setShowBackContent(false);
        setProgress(0);
        setResposta("");

        if (index + 1 < frases.length) {
            setIndex(prev => prev + 1);
        } else {
            setFinished(true);
        }

        if (index === frases.length - 1) {

            //await trainingUpdate();

            navigate(`/flashcards/${id}/learn`)
        }

        console.log('tamanho ', index)

    };

    const repeatCard = () => {
        window.speechSynthesis.cancel();
        setDiff(null);
        setIsFlipped(false);
        setShowBackContent(false);
        setProgress(0);
        setResposta("");
    };

    // useEffect(() => {
    //     if (mode) {
    //         setListIdCorrectPhrase(prev => [
    //             ...prev,
    //             frases[index].id
    //         ]);
    //     }

    // }, [diff]);

    function handleSubmit(e) {
        e.preventDefault();
        if (!resposta) return;

        const result = makePerfectDiff(frases[index].texto_traduzido, resposta);
        setDiff(result);

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
        return (
            <div className="h-screen flex items-center justify-center">
                Nenhuma frase encontrada
            </div>
        );
    }

    if (finished) {
        return (
            <div className="h-screen flex items-center justify-center text-xl font-semibold bg-slate-50">
                🎉 Treino finalizado
            </div>
        );
    }


    return (
        <div className="bg-slate-100 flex flex-col" style={{ height: "var(--app-height)" }}>

            <div className=" pt-5  digitar-texto p-6">

                <div className="relative text-left mb-4">
                    <div
                        className="cursor-pointer"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-xl"></i>
                    </div>
                </div>

                {!isFlipped && (
                    <div className="mb-4">
                        <h2 className="text-slate-700">
                            O que você quer dizer em inglês?
                        </h2>

                        <span className="text-slate-500 text-xs">
                            Digite como você falaria essa frase.
                        </span>
                    </div>
                )}

                {/* conteúdo normal da página */}
                <div>

                    <div className="perspective flashcard justify-center flex">
                        <div className={`card card-digitar-texto ${isFlipped ? "flip" : ""}`}>

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

                    {diff && !diff.isCorrect && (
                        <div className="mt-8">
                            <span className="flex justify-center mb-4 font-semibold text-slate-700">
                                Você digitou:
                            </span>

                            <div className="rounded-lg p-5 shadow-lg bg-white">
                                <div className="text-2xl text-center">
                                    {diff.diff.map((item, i) => (
                                        <span
                                            key={i}
                                            className={item.match ? "text-slate-700" : "text-red-700"}
                                        >
                                            {item.char}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* form empurrado para baixo */}
                {!isFlipped && (
                    <form
                        onSubmit={handleSubmit}
                        className="mt-auto pt-8"
                    >

                        <textarea
                            placeholder="Digite sua resposta aqui..."
                            ref={textareaRef}
                            value={resposta}
                            onChange={(e) => setResposta(e.target.value)}
                            className="focus:outline-none w-full h-32 pt-6 text-center rounded-lg border border-gray-300 resize-none transition focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                            type="submit"
                            className="mt-4 flex justify-center shadow-md w-full bg-[#4cb8c4] text-white font-medium py-3 rounded-full transition"
                        >
                            <i className="bi bi-chat-dots ps-2 me-2"></i>
                            Responder
                        </button>

                    </form>
                )}

            </div>
        </div>
    );
}
