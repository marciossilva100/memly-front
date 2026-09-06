import { useEffect, useRef, useState } from "react";
import { Volume2, Mic, Square, RotateCcw, History, Send, BookOpenText, Ban, AlertCircle, Eye, EyeOff, Loader2, Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { playAudio, pararAudio } from "../utils/audioPlayer";
import useAudioRecorder from "../hooks/useAudioRecorder";
import AudioPreviewPlayer from "../components/AudioPreviewPlayer";
import PremiumModal from "../components/PremiumModal";
import TextoDestacado from "../components/TextoDestacado";
import VocabularioHintBalloon from "../components/VocabularioHintBalloon";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"

function corNota(nota) {
    if (nota >= 8) return "text-green-400 border-green-400/30 bg-green-400/10";
    if (nota >= 5) return "text-amber-400 border-amber-400/30 bg-amber-400/10";
    return "text-red-400 border-red-400/30 bg-red-400/10";
}

export default function TreinoIA() {
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    // Indicador visual pro "Ouvir" - sem preload, o clique podia parecer
    // travado (nada acontece por 1-2s até a voz natural terminar de gerar).
    const [buscandoAudio, setBuscandoAudio] = useState(false);
    const [error, setError] = useState(null);
    const [audioVazio, setAudioVazio] = useState(false);
    const [fraseEncerrada, setFraseEncerrada] = useState(false);
    const [premiumRequired, setPremiumRequired] = useState(false);
    const [limitReached, setLimitReached] = useState(false);
    const [insufficientContent, setInsufficientContent] = useState(false);
    // Mesmo campo/motivo de Perguntas.jsx - FraseDoDia hoje não manda esse
    // motivo (só tem 1 checagem de conteúdo insuficiente), mas mantém o
    // mesmo padrão pra não divergir se isso mudar.
    const [frasesCurtas, setFrasesCurtas] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);
    const [mensagemLimite, setMensagemLimite] = useState(null);

    const [fraseId, setFraseId] = useState(null);
    const [frase, setFrase] = useState('');
    const [fraseTraducao, setFraseTraducao] = useState('');
    const [fraseDestacada, setFraseDestacada] = useState(null);
    const [mostrarVocabulario, setMostrarVocabulario] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null);

    // Seletor de categoria (só aparece 1x por dia, antes de gerar a frase de
    // hoje - se já existe uma pendente ou o limite diário já foi atingido,
    // o backend nem chega a pedir escolha, ver verificarSeletorCategoria).
    const [mostrarSeletor, setMostrarSeletor] = useState(false);
    const [categorias, setCategorias] = useState([]);
    const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);

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
        verificarSeletorCategoria();
    }, []);

    // Checagem leve (sem gerar nada) - só pergunta a categoria quando ainda
    // não existe uma pendente de hoje nem o limite diário já foi atingido
    // (nesses casos a escolha não seria usada pra nada, pedido do usuário
    // pra essa tela aparecer só 1x por dia).
    function verificarSeletorCategoria() {
        setLoading(true);

        fetch(`${API_URL}/controller/fraseDoDia.php`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ action: 'precisa_escolher_categoria' })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.precisa_escolher) {
                    return fetch(`${API_URL}/controller/fraseDoDia.php`, {
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + localStorage.getItem("token")
                        },
                        body: JSON.stringify({ action: 'listar_categorias' })
                    })
                        .then(res => res.json())
                        .then(catData => {
                            const lista = catData.categorias || [];
                            if (lista.length === 0) {
                                // Sem categoria elegível nenhuma - mesma tela de
                                // conteúdo insuficiente de sempre, não faz
                                // sentido mostrar um seletor vazio.
                                setInsufficientContent(true);
                                setLoading(false);
                                return;
                            }
                            setCategorias(lista);
                            setMostrarSeletor(true);
                            setLoading(false);
                        });
                }

                buscarFraseDoDia();
            })
            .catch(() => buscarFraseDoDia());
    }

    function alternarCategoria(id) {
        setCategoriasSelecionadas((prev) => {
            if (prev.includes(id)) {
                return prev.filter((c) => c !== id);
            }
            // Máximo 2 categorias escolhidas à mão - mesma regra do backend
            // (MAX_CATEGORIAS_ESCOLHA_MANUAL), evita voltar a misturar
            // assuntos demais na mesma frase.
            if (prev.length >= 2) {
                return [prev[1], id];
            }
            return [...prev, id];
        });
    }

    function confirmarCategoria() {
        setMostrarSeletor(false);
        buscarFraseDoDia(categoriasSelecionadas);
    }

    function buscarFraseDoDia(categoriaIds) {
        setLoading(true);
        setError(null);
        setInsufficientContent(false);
        setFlipped(false);

        fetch(`${API_URL}/controller/fraseDoDia.php`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                action: 'obter',
                ...(categoriaIds?.length > 0 && { category_ids: categoriaIds })
            })
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
                        setMensagemLimite(data.message || null);
                        return;
                    }
                    if (data.conteudo_insuficiente) {
                        setInsufficientContent(true);
                        setFrasesCurtas(Boolean(data.frases_curtas));
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

    function tentarNovamente() {
        setResultado(null);
        setError(null);
        setAudioVazio(false);
        setFlipped(false);
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
                    {mensagemLimite || (limiteVitalicio ? t("free_sample_available_in_history_hint") : t("come_back_tomorrow"))}
                </p>

                {/* Uma tela só, sem modal separado por cima - o limitado via o
                    mesmo aviso duas vezes (um modal "Créditos esgotados" logo
                    de cara, e essa mesma tela por trás dele). Pro limitado, o
                    segundo botão já vira direto pra "assinar premium" (o
                    motivo de estar aqui); pro premium com cota diária normal,
                    continua "Voltar" - já é premium, não faz sentido oferecer
                    upsell. */}
                <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
                    <button
                        onClick={() => navigate('/treinoia/historico')}
                        className="px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <History className="w-4 h-4" />
                        {t("view_history")}
                    </button>
                    {limiteVitalicio ? (
                        <button
                            onClick={() => {
                                setMotivoPremium("frase_dia_ia");
                                setIsPremiumModalOpen(true);
                            }}
                            className="px-6 py-3 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white font-medium transition-colors"
                        >
                            {t("daily_limit_premium_cta")}
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white font-medium transition-colors"
                        >
                            {t("back")}
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/home')}
                        className="px-6 py-3 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        {t("back_to_home")}
                    </button>
                </div>

                <PremiumModal
                    isOpen={isPremiumModalOpen}
                    setIsPremiumModalOpen={setIsPremiumModalOpen}
                    onClose={() => setIsPremiumModalOpen(false)}
                    motivo={motivoPremium}
                />
            </div>
        );
    }

    if (mostrarSeletor) {
        return (
            <div className="h-dvh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
                <div className="flex-1 overflow-y-auto px-5 pt-8 pb-40">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-14 h-14 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 flex items-center justify-center mb-4">
                            <BookOpenText className="w-6 h-6 text-[#4cb8c4]" />
                        </div>
                        <h1 className="text-lg font-semibold text-white mb-1">{t("category_selector_title")}</h1>
                        <p className="text-gray-400 text-sm max-w-xs">{t("category_selector_subtitle")}</p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        {categorias.map((cat) => {
                            const selecionada = categoriasSelecionadas.includes(cat.categoria_id);
                            return (
                                <button
                                    key={cat.categoria_id}
                                    type="button"
                                    onClick={() => alternarCategoria(cat.categoria_id)}
                                    className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${selecionada
                                        ? "border-[#4cb8c4] bg-[#4cb8c4]/10"
                                        : "border-gray-700 bg-gray-800/50 hover:bg-gray-700/50"
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{cat.categoria || t("uncategorized")}</p>
                                        <p className="text-gray-400 text-xs">{cat.total} {t("phrases_count_label")}</p>
                                    </div>
                                    {selecionada && <Check className="w-5 h-5 text-[#4cb8c4] shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 w-full px-6 py-4 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent">
                    <button
                        onClick={confirmarCategoria}
                        disabled={categoriasSelecionadas.length === 0}
                        className="px-6 py-3.5 w-full rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] disabled:opacity-40 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        {t("category_selector_generate_chosen")}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
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

    if (error && !frase) {
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
                        onClick={() => buscarFraseDoDia(categoriasSelecionadas)}
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

    return (
        <div className="p-4 justify-center w-full px-6 h-screen flex flex-col h-dvh from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-40">
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
                        <div className="relative">
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
                            <VocabularioHintBalloon />
                        </div>
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
                                    disabled={buscandoAudio}
                                    onClick={() => {
                                        setBuscandoAudio(true);
                                        playAudio(frase, user, true, null, false, false, () => setBuscandoAudio(false))
                                            .finally(() => setBuscandoAudio(false));
                                    }}
                                    className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 text-[#4cb8c4] text-xs hover:bg-[#4cb8c4]/20 transition-colors disabled:opacity-70"
                                >
                                    {buscandoAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                                    {buscandoAudio ? t("generating_audio") : t("listen")}
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

                        {resultado.pode_tentar_novamente ? (
                            <div className="mt-2 flex flex-col gap-3">
                                <button
                                    onClick={tentarNovamente}
                                    className="px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    {t("try_again")}
                                </button>
                                {/* navigate(-1) (volta no histórico) trocado por
                                    destino explícito - reportado pelo usuário que
                                    não conseguia encerrar o treino, só "tentar
                                    novamente" funcionava. Sem isso, esse botão
                                    dependia do histórico de navegação do
                                    navegador ter pra onde voltar; sem histórico
                                    (ou um histórico que só levava de volta pra cá),
                                    o clique não tirava o aluno da tela de jeito
                                    nenhum. Mesma distinção "voltar" x "ir pra
                                    home" já usada na tela de limite diário desta
                                    página. */}
                                <button
                                    onClick={() => navigate('/home')}
                                    className="px-6 py-3 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white font-medium transition-colors"
                                >
                                    {t("back")}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/home')}
                                className="mt-2 px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
                            >
                                {t("back")}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {!resultado && !flipped && (
                <div className="fixed bottom-0 left-0 w-full px-6 py-4 flex flex-col items-center gap-4 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent">
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
