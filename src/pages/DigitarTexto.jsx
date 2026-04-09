import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { makePerfectDiff } from "../utils/makePerfectDiff";
import { playAudio } from "../utils/audioPlayer";
import '../digitartexto.css'
import { Volume, Play, Check, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";


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
    const API_URL = import.meta.env.VITE_API_URL;
    const [acertos, setAcertos] = useState(0);
    const [erros, setErros] = useState(0);
    const [correctIds, setCorrectIds] = useState([]);
    const [idPhrases, setIdPhrases] = useState([])
    const [vh, setVh] = useState(window.innerHeight);
    const navigate = useNavigate();
    const textareaRef = useRef(null);
    const [pular, setPular] = useState(false)
    const { user, setUser } = useAuth();

    useEffect(() => {

        if (!isFlipped) {

            const timer = setTimeout(() => {
                textareaRef.current?.focus();
            }, 400);

            return () => clearTimeout(timer);

        }

    }, [isFlipped]);

    useEffect(() => {
        const handleResize = () => {
            setVh(window.visualViewport?.height || window.innerHeight);
        };

        window.visualViewport?.addEventListener("resize", handleResize);

        return () => {
            window.visualViewport?.removeEventListener("resize", handleResize);
        };
    }, []);
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

        fetch(`${API_URL}/${endpoint}`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token"),
                "Content-Type": "application/json"
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
            playAudio(frases[index].texto_traduzido, user);

        }, 200);

    }

    async function trainingUpdate(actionToSend, frase_id, statusCorrectPhrase) {

        try {

            const res = await fetch(`${API_URL}/controller/treino.php`, {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: actionToSend,
                    frase_id: [frase_id],
                    category_id: id,
                    statusCorrectPhrase: statusCorrectPhrase
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


    const nextCard = async () => {

        setPular(false)

        window.speechSynthesis.cancel();

        const isLast = index === frases.length - 1;

        // 👉 só conta se ainda não respondeu


        setDiff(null);
        setIsFlipped(false);
        setShowBackContent(false);
        setResposta("");

        if (isLast) {
            if (mode === "traine") {
                setFinished(true);
                return;
            }

            // navigate(`/flashcards/${id}/learn`, {
            //     state: { correctIds }
            // });
            // return;

            navigate(`/emparelhar/${id}/learn`, {
                state: { correctIds }
            });
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

    function toggleCard() {

        // só permite virar se acertou
        if (!diff || !diff.isCorrect) return;

        const newFlipState = !isFlipped;

        setIsFlipped(newFlipState);

        if (newFlipState) {
            setTimeout(() => {
                setShowBackContent(true);
                playAudio(frases[index].texto_traduzido, user);
            }, 200);
        } else {
            setShowBackContent(false);
        }
    }

    function respostaShow() {


        const newFlipState = !isFlipped;

        setIsFlipped(newFlipState);

        if (newFlipState) {
            setTimeout(() => {
                setShowBackContent(true);
                playAudio(frases[index].texto_traduzido, user);
            }, 200);
        } else {
            setShowBackContent(false);
        }
    }


    async function handleSubmit(e, pular = false) {
        e?.preventDefault();

        // 👉 fluxo "não lembro"
        if (pular) {
            setErros(prev => prev + 1);

            // 👇 aqui é o segredo
            setDiff({ isCorrect: true });

            virarFlashcard();
            return;
        }

        if (!resposta) return;

        const result = makePerfectDiff(
            frases[index].texto_traduzido,
            resposta
        );

        setDiff(result);

        const statusCorrectPhrase = result.isCorrect ? 1 : 0;

        if (mode === "traine")
            await trainingUpdate('trainee_finish', frases[index].id, statusCorrectPhrase);

        if (result.isCorrect) {
            setAcertos(prev => prev + 1);
            setCorrectIds(prev => [...prev, frases[index].id]);
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

    const answeredCount = index;

    const progressBar = frases.length
        ? (index / frases.length) * 100
        : 0;

    const progressBarVisible = progressBar;



    return (

        <div style={{ height: vh }} className=" flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br digitar-texto px-6 pb-5">

            <div className="flex-1 overflow-y-auto scrollbar-hide pt-3">

                <div className="relative text-left mb-4 text-white">

                    <div
                        className="cursor-pointer"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-2xl"></i>
                    </div>

                </div>

                <div className="top-0 left-0 w-full h-2 bg-slate-200 overflow-hidden mb-4">

                    <div
                        className="h-full bg-[#4cb8c4] transition-all duration-300"
                        style={{ width: `${progressBarVisible}%` }}
                    />

                </div>

                {!isFlipped && (!diff || !diff.isCorrect) && (
                    <div className="justify-start mb-4 w-full">

                        <h2 className="text-white text-lg">
                            O que você quer dizer em inglês?
                        </h2>

                        <span className="text-white text-sm">
                            Digite como você falaria essa frase.
                        </span>

                    </div>
                )}

                <div className="flex h-[40%]">
                    <div className="perspective flashcard justify-center flex">

                        <div
                            onClick={toggleCard}
                            className={`card card-digitar-texto ${isFlipped ? "flip" : ""} `}
                        >

                            <div className="rounded-lg card-front bg-[linear-gradient(to_right,#233245,#0d1425)] shadow-[0_10px_40px_rgba(0,0,0,0.08)] px-5 py-4 text-center">

                                <span className="text-2xl">
                                    {frases[index].texto_nativo}
                                </span>
                                {!diff || diff.isCorrect && (
                                    <div className="absolute right-0 top-0 mt-3 me-3">
                                        <RefreshCw className="text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg card-back bg-[linear-gradient(to_right,#0d1425,#233245)] shadow-[0_10px_40px_rgba(0,0,0,0.09)] px-5 py-4 text-center">

                                <span className="text-2xl text-white">
                                    {showBackContent && frases[index].texto_traduzido}
                                </span>
                                {!diff || diff.isCorrect && (
                                    <div className="absolute right-0 top-0 mt-3 me-3">
                                        <RefreshCw className="text-white" />
                                    </div>
                                )}
                            </div>

                        </div>

                    </div>
                </div>


                {diff && !diff.isCorrect && (

                    <div className="mt-6 w-full ">
                        <div className="text-center flex justify-center">
                            <button onClick={(e) => {
                                e.preventDefault();
                                playAudio(frases[index].texto_traduzido, user);
                            }} className="px-4 py-2 rounded-md bg-slate-600 text-white text-sm transition flex">
                                <Volume className="w-5 h-5" />
                                Ouvir
                            </button>
                        </div>

                        <span className="w-full flex justify-center mb-4 font-semibold text-white mt-8">
                            Você digitou:
                        </span>

                        <div className="rounded-lg w-full p-5 shadow-lg bg-gray-700/60 backdrop-blur-sm">

                            <div className="text-xl text-center">

                                {diff.diff.map((item, i) => (

                                    <span
                                        key={i}
                                        className={
                                            item.match
                                                ? "text-white"
                                                : "text-red-400"
                                        }
                                    >
                                        {item.char}
                                    </span>

                                ))}

                            </div>

                        </div>

                    </div>

                )}
                {!isFlipped && !diff && (
                    <div className="w-full mt-8">

                        <form onSubmit={handleSubmit} id="respostaForm" className="h-40">

                            <div className="h-[100%] justify-center mb-8">



                                <textarea
                                    placeholder="Digite sua resposta aqui..."
                                    ref={textareaRef}
                                    value={resposta}
                                    onChange={(e) => setResposta(e.target.value)}
                                    className="text-xl text-white toutline-none w-full h-[100%] pt-6 text-center rounded-lg  resize-none bg-gray-800/50 backdrop-blur-sm  border border-gray-700 px-3"
                                />


                            </div>

                        </form>

                    </div>
                )}

                {diff && diff.isCorrect && (
                    <div>
                        <div className="text-center flex justify-center mt-4">
                            <button onClick={(e) => {
                                e.preventDefault();
                                playAudio(frases[index].texto_traduzido, user);
                            }} className="px-4 py-2 rounded-md bg-slate-600 text-white text-sm transition flex">
                                <Volume className="w-5 h-5" />
                                Ouvir
                            </button>
                        </div>
                        {pular && (
                            <div className="items-center justify-center mb-20 text-center mt-10">
                                <div className="mb-4 flex justify-center">
                                    <div className="rounded-full bg-green-600 w-16 h-16 flex items-center justify-center">
                                        <Check className="text-white" height={38} width={38} />
                                    </div>
                                </div>

                                <span className="text-2xl font-semibold text-green-500">
                                    Correto
                                </span>
                            </div>
                        )}
                    </div>

                )}

            </div>

            {diff && (

                !diff.isCorrect ? (
                    <div>


                        <div className=" flex sticky bottom-6 w-full flex justify-center gap-3 ">

                            <button
                                onClick={nextCard}
                                className="w-full  text-white text-lg  py-3 rounded-full shadow-lg  bg-gray-700/60 backdrop-blur-sm  border border-gray-700"
                            >
                                Não lembro
                            </button>
                            <button
                                onClick={repeatCard}
                                className="w-full  text-white text-lg  py-3 rounded-full shadow-lg bg-gray-800/50 backdrop-blur-sm  border border-gray-700"
                            >
                                Tentar novamente
                            </button>


                        </div>
                    </div>



                ) : (
                    <div>


                        <div className=" sticky ">

                            <div className="left-0 w-full bottom-0">

                                <button
                                    onClick={nextCard}
                                    className="shadow-md w-full bg-gray-800/50 backdrop-blur-sm  border border-gray-700 text-white font-medium py-3 rounded-full transition text-lg"
                                >
                                    Próximo
                                </button>

                            </div>

                        </div>
                    </div>

                )

            )}

            {!isFlipped && (!diff || !diff.isCorrect) && (

                <div className="sticky bottom-6 w-full  pt-4 flex gap-3">


                    <button
                        onClick={(e) => {
                            handleSubmit(e, true);
                        }}

                        className="w-full  text-white text-lg  py-3 rounded-full shadow-lg  bg-gray-700/60 backdrop-blur-sm  border border-gray-700"
                    >
                        Não lembro
                    </button>
                    <button
                        type="submit"
                        form="respostaForm"
                        className="flex justify-center shadow-md w-full  text-white font-medium py-3 rounded-full text-lg bg-green-500/50 backdrop-blur-sm  border border-gray-700"
                    >
                        Responder
                    </button>

                </div>

            )}

        </div>

    );

}