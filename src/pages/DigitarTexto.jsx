import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { makePerfectDiff } from "../utils/makePerfectDiff";
import { playAudio, pararAudio, preloadAudio } from "../utils/audioPlayer";
import '../digitartexto.css'
import { Volume, Play, Check, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"


export default function DigitarTexto() {
    const { t } = useTranslation();

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
    const [viewportTop, setViewportTop] = useState(0);
    const navigate = useNavigate();
    const textareaRef = useRef(null);
    const contentRef = useRef(null);
    const [pular, setPular] = useState(false)
    const { user, setUser } = useAuth();
    const flipTimeoutRef = useRef(null);

    // Para o áudio em reprodução ao sair da tela (troca de rota) - sem isso,
    // o áudio seguia tocando mesmo depois do usuário já ter navegado embora.
    useEffect(() => () => pararAudio(), []);

    useEffect(() => {

        if (!isFlipped) {

            const timer = setTimeout(() => {
                textareaRef.current?.focus();
                textareaRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
            }, 400);

            return () => clearTimeout(timer);

        }

    }, [isFlipped]);

    useEffect(() => {

        const el = textareaRef.current;
        if (!el) return;

        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;

    }, [resposta]);

    function handleRespostaChange(e) {
        setResposta(e.target.value);
    }

    useEffect(() => {
        const vv = window.visualViewport;

        const handleResize = () => {
            setVh(vv?.height || window.innerHeight);
            setViewportTop(vv?.offsetTop || 0);

            if (document.activeElement === textareaRef.current) {
                textareaRef.current.scrollIntoView({ block: "end", behavior: "smooth" });
            }
        };

        handleResize();

        vv?.addEventListener("resize", handleResize);
        vv?.addEventListener("scroll", handleResize);

        // trava a página no lugar: o div raiz é fixed e segue vv.offsetTop/height
        // por conta própria, então nada pode sobrar em branco quando o teclado
        // abre/fecha, mesmo que o navegador tente rolar o body
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        const originalTop = document.body.style.top;
        const originalWidth = document.body.style.width;
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = "0";
        document.body.style.width = "100%";

        return () => {
            vv?.removeEventListener("resize", handleResize);
            vv?.removeEventListener("scroll", handleResize);
            document.body.style.overflow = originalOverflow;
            document.body.style.position = originalPosition;
            document.body.style.top = originalTop;
            document.body.style.width = originalWidth;
        };
    }, []);
    // preload voices (Web Speech API nao existe na WebView nativa do Android/Capacitor)
    useEffect(() => {

        if (!window.speechSynthesis) return;

        const loadVoices = () => window.speechSynthesis.getVoices();
        loadVoices();

        window.speechSynthesis.onvoiceschanged = loadVoices;

        const silentUtterance = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(silentUtterance);
        window.speechSynthesis?.cancel();

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

    // O áudio do texto nativo não tem mais autoplay - só toca quando o
    // usuário clica no botão "Ouvir", em qualquer modo.

    // Pré-carrega os dois áudios do card assim que ele aparece - sem isso, a
    // voz natural (OpenAI TTS) só começa a ser buscada no momento em que o
    // usuário vira o card, e essa busca demora o suficiente pra ser sentida.
    // Se o limite da voz natural tiver acabado, preloadAudio já busca a voz
    // padrão como fallback, então mesmo nesse caso a reprodução fica pronta.
    //
    // Vale pra premium e limitado (decisão explícita do usuário - prioriza
    // reprodução instantânea sobre economizar a amostra vitalícia navegando
    // sem ouvir, mesma decisão já aplicada em Flashcards.jsx) - a própria
    // preloadAudio() já para de tentar voz natural sozinha assim que a cota
    // do limitado (10 reproduções, ver limiteReproducoesLimitadoAtingido em
    // audioPlayer.js) ou o limite diário/vitalício do backend acabar.
    useEffect(() => {
        const frase = frases[index];
        if (!frase || !user) return;

        const forcarPadraoNativo = mode === "learn";
        preloadAudio(frase.texto_nativo, user, user?.native_language || user?.learning_language, forcarPadraoNativo);
        preloadAudio(frase.texto_traduzido, user);
    }, [index, frases, user, mode]);


    function virarFlashcard() {

        setIsFlipped(true);
        setShowBackContent(false);

        if (flipTimeoutRef.current) {
            clearTimeout(flipTimeoutRef.current);
        }

        const currentIndex = index;
        flipTimeoutRef.current = setTimeout(() => {

            setShowBackContent(true);
            playAudio(frases[currentIndex].texto_traduzido, user);
            flipTimeoutRef.current = null;

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

        pararAudio();
        window.speechSynthesis?.cancel();

        if (flipTimeoutRef.current) {
            clearTimeout(flipTimeoutRef.current);
            flipTimeoutRef.current = null;
        }

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

        window.speechSynthesis?.cancel();

        if (flipTimeoutRef.current) {
            clearTimeout(flipTimeoutRef.current);
            flipTimeoutRef.current = null;
        }

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

        if (flipTimeoutRef.current) {
            clearTimeout(flipTimeoutRef.current);
            flipTimeoutRef.current = null;
        }

        if (newFlipState) {
            const currentIndex = index;
            flipTimeoutRef.current = setTimeout(() => {
                setShowBackContent(true);
                playAudio(frases[currentIndex].texto_traduzido, user);
                flipTimeoutRef.current = null;
            }, 200);
        } else {
            setShowBackContent(false);
        }
    }

    function respostaShow() {


        const newFlipState = !isFlipped;

        setIsFlipped(newFlipState);

        if (flipTimeoutRef.current) {
            clearTimeout(flipTimeoutRef.current);
            flipTimeoutRef.current = null;
        }

        if (newFlipState) {
            const currentIndex = index;
            flipTimeoutRef.current = setTimeout(() => {
                setShowBackContent(true);
                playAudio(frases[currentIndex].texto_traduzido, user);
                flipTimeoutRef.current = null;
            }, 200);
        } else {
            setShowBackContent(false);
        }
    }


    async function handleSubmit(e, pular = false) {
        e?.preventDefault();

        setPular(pular)

        // 👉 fluxo "não lembro"
        if (pular) {
            setErros(prev => prev + 1);

            // ✅ Adiciona o ID mesmo quando pula
            setCorrectIds(prev => [...prev, frases[index].id]);

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

        // ✅ Adiciona o ID sempre, independente do resultado
        setCorrectIds(prev => [...prev, frases[index].id]);

        if (result.isCorrect) {
            setAcertos(prev => prev + 1);
        } else {
            setErros(prev => prev + 1);
        }

        virarFlashcard();
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

    if (!frases.length) {
        navigate(`/home`);
        return

        return (
            <div className="h-screen flex items-center justify-center">
                {t("no_phrase_found")}
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
            <div className="h-screen flex items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br px-8">

                <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-8 text-center">

                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 flex items-center justify-center text-3xl">
                        {porcentagem >= 80 ? "🏆" : porcentagem >= 60 ? "👏" : "💪"}
                    </div>

                    <p className="text-lg text-white mb-2">
                        {t("training_finished")}
                    </p>

                    <div className="text-5xl font-extrabold text-[#4cb8c4] mb-2">
                        {porcentagem}%
                    </div>

                    <p className="text-gray-300 mb-6">
                        {t("results_summary", { acertos, erros })}
                    </p>

                    <button
                        onClick={() => navigate("/home")}
                        className="w-full px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
                    >
                        {t("back_to_home")}
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

        <div style={{ height: vh, top: viewportTop }} className="fixed inset-x-0 flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br digitar-texto px-6 pb-5 overscroll-none">

            <div ref={contentRef} className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide pt-3 pb-24">

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
                    <div className="justify-start mb-4 [@media(max-height:700px)]:mb-2 w-full">

                        <h2 className="text-white text-lg [@media(max-height:700px)]:text-base">
                            {t("what_do_you_want_to_say")}
                        </h2>

                        <span className="text-white text-sm">
                            {t("type_how_you_would_say")}
                        </span>

                    </div>
                )}

                {/* altura/fonte menores em telas baixas (ex: iPhone SE) - senão
                    o card + os campos abaixo somados ficavam maiores que a
                    tela, empurrando os botões pra cima/fora do lugar. Mesmo
                    padrão de breakpoint já usado em treinoIA/Perguntas/Flashcards. */}
                <div className="flex h-[40%] [@media(max-height:700px)]:h-[30%]">
                    <div className="perspective flashcard justify-center flex w-full h-full">

                        <div
                            onClick={toggleCard}
                            className={`card card-digitar-texto h-full ${isFlipped ? "flip" : ""} `}
                        >

                            <div className="rounded-lg card-front bg-[linear-gradient(to_right,#233245,#0d1425)] shadow-[0_10px_40px_rgba(0,0,0,0.08)] px-5 py-4 [@media(max-height:700px)]:py-2 text-center">

                                <span className="text-2xl [@media(max-height:700px)]:text-lg">
                                    {frases[index].texto_nativo}
                                </span>
                                {!diff || diff.isCorrect && (
                                    <div className="absolute right-0 top-0 mt-3 me-3">
                                        <RefreshCw className="text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg card-back bg-[linear-gradient(to_right,#0d1425,#233245)] shadow-[0_10px_40px_rgba(0,0,0,0.09)] px-5 py-4 [@media(max-height:700px)]:py-2 text-center">

                                <span className="text-2xl [@media(max-height:700px)]:text-lg text-white">
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

                {!isFlipped && !diff && (
                    <div className="text-center flex justify-center mt-5 [@media(max-height:700px)]:mt-2">
                        <button onClick={(e) => {
                            e.preventDefault();
                            playAudio(frases[index].texto_nativo, user, false, user?.native_language || user?.learning_language, mode === "learn");
                        }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 text-[#4cb8c4] text-xs hover:bg-[#4cb8c4]/20 transition-colors">
                            <Volume className="w-4 h-4" />
                            {t("listen")}
                        </button>
                    </div>
                )}

                {diff && !diff.isCorrect && (

                    <div className="mt-6 w-full ">
                        <div className="text-center flex justify-center">
                            <button onClick={(e) => {
                                e.preventDefault();
                                playAudio(frases[index].texto_traduzido, user);
                            }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-700/50 border border-gray-600 text-gray-300 text-xs hover:bg-gray-700 transition-colors">
                                <Volume className="w-4 h-4" />
                                {t("listen")}
                            </button>
                        </div>

                        <span className="w-full flex justify-center mb-4 font-semibold text-white mt-8">
                            {t("you_typed")}
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
                    <div className="w-full mt-8 [@media(max-height:700px)]:mt-4">

                        <form onSubmit={handleSubmit} id="respostaForm">

                            <div className="justify-center mb-8 [@media(max-height:700px)]:mb-3">



                                <textarea
                                    placeholder={t("type_your_answer_placeholder")}
                                    ref={textareaRef}
                                    value={resposta}
                                    onChange={handleRespostaChange}
                                    onFocus={() => {
                                        setTimeout(() => {
                                            textareaRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
                                        }, 300);
                                    }}
                                    rows={1}
                                    className="text-xl [@media(max-height:700px)]:text-lg text-white toutline-none w-full min-h-[56px] max-h-[35vh] py-3 text-center rounded-lg  resize-none overflow-y-auto overscroll-contain bg-gray-800/50 backdrop-blur-sm  border border-gray-700 px-3 scroll-mb-28"
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
                            }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-700/50 border border-gray-600 text-gray-300 text-xs hover:bg-gray-700 transition-colors">
                                <Volume className="w-4 h-4" />
                                {t("listen")}
                            </button>
                        </div>
                        {!pular && (
                            <div className="items-center justify-center mb-20 text-center mt-10">
                                <div className="mb-4 flex justify-center">
                                    <div className="rounded-full bg-green-600 w-16 h-16 flex items-center justify-center">
                                        <Check className="text-white" height={38} width={38} />
                                    </div>
                                </div>

                                <span className="text-2xl font-semibold text-green-500">
                                    {t("correct_label")}
                                </span>
                            </div>
                        )}
                    </div>

                )}

            </div>

            {diff && (

                !diff.isCorrect ? (
                    <div>


                        <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-3">

                            <button
                                onClick={(e) => {
                                    handleSubmit(e, true);
                                }}
                                className="w-full px-4 py-3 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white font-medium text-[13px] hover:bg-gray-700/50 transition-colors"
                            >
                                {t("dont_remember")}
                            </button>
                            <button
                                onClick={repeatCard}
                                className="w-full px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium text-[13px] transition-colors"
                            >
                                {t("try_again")}
                            </button>


                        </div>
                    </div>



                ) : (
                    <div>

                        <div className="absolute bottom-6 left-6 right-6">

                            <button
                                onClick={nextCard}
                                className="w-full px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium text-[16px] transition-colors"
                            >
                                {t("next")}
                            </button>

                        </div>
                    </div>

                )

            )}

            {!isFlipped && (!diff || !diff.isCorrect) && (

                <div className="absolute bottom-6 left-6 right-6 flex gap-3">


                    <button
                        onClick={(e) => {
                            handleSubmit(e, true);
                        }}

                        className="w-full px-6 py-3 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white font-medium text-[13px] hover:bg-gray-700/50 transition-colors"
                    >
                        {t("dont_remember")}
                    </button>
                    <button
                        type="submit"
                        form="respostaForm"
                        className="w-full px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium text-[13px] flex items-center justify-center transition-colors"
                    >
                        {t("answer_button")}
                    </button>

                </div>

            )}

        </div>

    );

}