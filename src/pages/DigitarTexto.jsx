import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { makePerfectDiff } from "../utils/makePerfectDiff";
import '../digitartexto.css'
import { Check } from "lucide-react";

export default function DigitarTexto() {
    const { id} = useParams();

    const [diff, setDiff] = useState(null)
    const [frases, setFrases] = useState([]);
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showBackContent, setShowBackContent] = useState(false);
    const [resposta, setResposta] = useState('')
    const [finished, setFinished] = useState(false);
    const [progress, setProgress] = useState(0);
    const [listIdCorrectPhrase, setListIdCorrectPhrase] = useState([]);
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
        fetch("http://localhost:8081/controller/frases.php", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "learn",
                category_id: id,

            })
        })
            .then(res => res.json())
            .then(data => {
                setFrases(data);
                setIndex(0);
                setIsFlipped(false);
                setFinished(false);
                setProgress(0);
                setShowBackContent(false);

            });

    }, [id]);

    function virarFlashcard() {
        setIsFlipped(true);
        setShowBackContent(false);

        // metade da duração do transition (0.4s = 400ms)
        setTimeout(() => {
            setShowBackContent(true);
            playAudio(frases[index].texto_traduzido);
        }, 200);
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


    if (!frases.length) {
        return (
            <div className="h-screen flex items-center justify-center">
                Carregando...
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
        <div className="h-screen pt-5 bg-slate-50 justify-items-center digitar-texto">

            <div className="perspective flashcard justify-center flex ">
                <div
                    className={`card card-digitar-texto ${isFlipped ? "flip" : ""}`}

                >
                    {/* FRENTE */}
                    <div className="card-front shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-4 text-center">
                        <span className="text-2xl">
                            {frases[index].texto_nativo}

                        </span>
                    </div>

                    {/* VERSO */}
                    <div className="card-back shadow-[0_10px_40px_rgba(0,0,0,0.09)] p-4 text-center">
                        <span className="text-2xl text-avocado-700">
                            {showBackContent && frases[index].texto_traduzido}
                        </span>
                    </div>
                </div>
            </div>

            {diff && !diff.isCorrect && (

                <div className="mt-8 w-full px-8">
                    <span className="w-full flex justify-center mb-4 font-semibold text-slate-700">
                        Você digitou:
                    </span>

                    <div className="rounded-lg w-full p-5 shadow-lg bg-white">
                        <div className="text-2xl  justify-center items-center text-center">
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

            <div className="w-full px-9 mt-8">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center mb-8">
                        {!isFlipped && (
                            <textarea
                                ref={textareaRef}
                                value={resposta}
                                onChange={(e) => setResposta(e.target.value)}
                                className="focus:outline-none w-full h-32 pt-6 text-center rounded-lg border border-gray-300 resize-none transition focus:ring-2 focus:ring-blue-500"
                            />
                        )}
                    </div>

                    {!isFlipped && (
                        <div className="left-0 fixed bottom-6 w-full px-10">
                            <button
                                type="submit"
                                className="shadow-md w-full bg-avocado-500 text-white font-medium py-3 rounded-2xl transition"
                            >
                                Responder
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {diff && (
                !diff.isCorrect ? (
                    <div className="w-full flex fixed bottom-6 justify-center gap-3 px-10">
                        <button
                            onClick={repeatCard}
                            className="w-full bg-red-400 text-white px-5 py-3 rounded-xl shadow-lg transition active:scale-95"
                        >
                            Tentar novamente
                        </button>

                        {/* <button
                            onClick={nextCard}
                            className="bg-blue-400 text-white px-5 py-3 rounded-xl shadow-lg transition active:scale-95"
                        >
                            Pular
                        </button> */}
                    </div>
                ) : (
                    <div className="px-10">
                        <div className="flex items-center justify-center mt-20">
                            <div className="rounded-full bg-green-600 p-4">
                                <Check className="text-white" />
                            </div>
                        </div>

                        <div className="fixed left-0 w-full bottom-0 p-10">
                            <button
                                onClick={nextCard}
                                className="shadow-md w-full bg-avocado-500 text-white font-medium py-3 rounded-2xl transition"
                            >
                                Próximo
                            </button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
