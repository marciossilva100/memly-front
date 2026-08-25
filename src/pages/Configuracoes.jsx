import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { FileText, Shield, ShieldCheck, LogOut, ChevronRight, Settings, BookOpen, Home, BarChart3, Trash2, Volume2, Check, Gauge, Bot, Crown, Play, CreditCard, RotateCcw, User, Bell } from "lucide-react";
import { notificacoesDisponiveis, statusNotificacoes, ativarNotificacoes, desativarNotificacoes } from "../utils/pushNotifications";
import { limparCacheVozNatural } from "../utils/audioPlayer";
import ModalConfirm from "../components/ModalConfirm";
import ModalIA from "../components/ModalIA";
import PremiumModal from "../components/PremiumModal";

const QUANTIDADE_FRASES_MIN = 1;
const QUANTIDADE_FRASES_MAX = 8;

const VOZES_TTS = [
    { valor: "coral", emoji: "👩", nome: "Emma" },
    { valor: "nova", emoji: "👩", nome: "Sophia" },
    { valor: "onyx", emoji: "👨", nome: "David" },
    { valor: "ash", emoji: "👨", nome: "Michael" },
];

const VELOCIDADES_TTS = [0.75, 1.00, 1.25, 1.50];

// Segundos que o card da frente fica visível em Flashcards.jsx antes de
// virar sozinho.
const TEMPOS_VIRADA_FLASHCARDS = [5, 8, 12, 15];

function ItemMenu({ icone: Icone, titulo, onClick, cor = "text-gray-300" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center justify-between gap-3 px-4 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl hover:bg-gray-700/50 transition-colors text-left"
        >
            <span className="flex items-center gap-3">
                <Icone className={`w-5 h-5 ${cor}`} />
                <span className="text-white text-base">{titulo}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
    );
}

export default function Configuracoes() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { logout, user, checkAuth } = useAuth();
    const isPremium = user?.plano === 1;
    const API_URL = import.meta.env.VITE_API_URL;

    const [openTreinoIA, setOpenTreinoIA] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);

    // O bloqueio (limitado sem nenhum dos dois recursos disponível, ou free
    // sem acesso a nenhum) fica por conta do próprio ModalIA - uma coroa em
    // cada opção bloqueada, que só abre o modal premium quando o usuário
    // tenta entrar naquela opção específica (ver ModalIA.jsx). Sempre abre
    // o ModalIA aqui, pra qualquer plano - pular direto pro premium pro
    // plano free era o mesmo bug já corrigido na Home (commit c6041fe),
    // só que esse arquivo tinha o código duplicado e ninguém tinha mexido.
    function verifyPlan() {
        setOpenTreinoIA(true);
    }

    const [apelido, setApelido] = useState('');
    const [salvandoApelido, setSalvandoApelido] = useState(false);
    const [erroApelido, setErroApelido] = useState('');
    const [mensagemApelido, setMensagemApelido] = useState('');

    useEffect(() => {
        if (user?.apelido) setApelido(user.apelido);
    }, [user?.apelido]);

    async function handleSalvarApelido(e) {
        e.preventDefault();
        setErroApelido('');
        setMensagemApelido('');

        const valor = apelido.trim();

        if (valor.length < 3 || valor.length > 20 || !/^[a-zA-Z0-9_]+$/.test(valor)) {
            setErroApelido(t("nickname_invalid"));
            return;
        }

        if (valor === user?.apelido) return;

        setSalvandoApelido(true);

        try {
            const res = await fetch(`${API_URL}/controller/configuracoes.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ action: 'atualizar_apelido', apelido: valor })
            });

            const data = await res.json();

            if (!data.success) {
                setErroApelido(data.message || t("unexpected_error"));
                return;
            }

            setMensagemApelido(t("saved_successfully"));
            checkAuth(true);
        } catch (error) {
            console.error('Erro ao salvar apelido:', error);
            setErroApelido(t("server_connection_error"));
        } finally {
            setSalvandoApelido(false);
        }
    }

    const [quantidadeFrases, setQuantidadeFrases] = useState('');
    const [loadingQuantidade, setLoadingQuantidade] = useState(false);
    const [salvandoQuantidade, setSalvandoQuantidade] = useState(false);
    const [mensagemQuantidade, setMensagemQuantidade] = useState('');
    const [erroQuantidade, setErroQuantidade] = useState('');

    const [vozTts, setVozTts] = useState('nova');
    const [salvandoVoz, setSalvandoVoz] = useState(false);
    const [erroVoz, setErroVoz] = useState('');

    const [velocidadeTts, setVelocidadeTts] = useState(1.00);
    const [salvandoVelocidade, setSalvandoVelocidade] = useState(false);
    const [erroVelocidade, setErroVelocidade] = useState('');

    // Preferência só do dispositivo (não precisa sincronizar entre aparelhos,
    // mesmo padrão de armazenamento já usado pra velocidade de fallback em
    // src/utils/audioPlayer.js) - controla se a frente do flashcard em
    // DigitarTexto.jsx toca o áudio sozinha ou só quando o usuário clicar.
    const [autoplayFrente, setAutoplayFrente] = useState(
        () => localStorage.getItem('zaldemy_autoplay_frente') === '1'
    );

    function handleToggleAutoplayFrente() {
        const novoValor = !autoplayFrente;
        setAutoplayFrente(novoValor);
        localStorage.setItem('zaldemy_autoplay_frente', novoValor ? '1' : '0');
    }

    // Preferência só do dispositivo (mesmo padrão do autoplay acima) -
    // controla quanto tempo o card da frente fica visível antes de virar
    // sozinho em Flashcards.jsx, lido diretamente do localStorage por lá.
    const [tempoViradaFlashcards, setTempoViradaFlashcards] = useState(
        () => parseInt(localStorage.getItem('zaldemy_tempo_virada_flashcards'), 10) || 8
    );

    function handleSelecionarTempoVirada(segundos) {
        setTempoViradaFlashcards(segundos);
        localStorage.setItem('zaldemy_tempo_virada_flashcards', String(segundos));
    }

    // Notificações push - só existe (feature-detect + PWA instalada, ver
    // notificacoesDisponiveis) fora do navegador comum e fora do app nativo
    // (Capacitor ainda não tem push nativo configurado).
    const [notifDisponivel, setNotifDisponivel] = useState(false);
    const [notifAtivada, setNotifAtivada] = useState(false);
    const [notifCarregando, setNotifCarregando] = useState(false);
    const [notifErro, setNotifErro] = useState('');

    useEffect(() => {
        if (!notificacoesDisponiveis()) return;

        setNotifDisponivel(true);
        statusNotificacoes().then((status) => setNotifAtivada(status.ativado));
    }, []);

    async function handleToggleNotificacoes() {
        setNotifErro('');
        setNotifCarregando(true);

        try {
            if (notifAtivada) {
                await desativarNotificacoes();
                setNotifAtivada(false);
            } else {
                await ativarNotificacoes();
                setNotifAtivada(true);
            }
        } catch (error) {
            setNotifErro(error.message || t("server_connection_error"));
        } finally {
            setNotifCarregando(false);
        }
    }

    // Manda uma notificação de teste pro próprio usuário - confirma a
    // cadeia inteira (subscription salva, chaves VAPID, service worker)
    // sem precisar de acesso ao terminal do servidor pra rodar o cron.
    const [notifTestando, setNotifTestando] = useState(false);
    const [notifTesteEnviado, setNotifTesteEnviado] = useState(false);

    async function handleTestarNotificacao() {
        setNotifErro('');
        setNotifTesteEnviado(false);
        setNotifTestando(true);

        try {
            const res = await fetch(`${API_URL}/controller/pushNotifications.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                },
                body: JSON.stringify({ action: 'enviar_teste' }),
            });
            const data = await res.json();

            if (!data.success) {
                // resultados vem do backend só nessa action de teste (ver
                // enviarParaUsuarioComDiagnostico) - motivo real de cada
                // subscription que falhou, pra debugar de verdade em vez de
                // só "não funcionou".
                const motivos = (data.resultados || [])
                    .filter((r) => !r.sucesso)
                    .map((r) => r.motivo)
                    .join(' | ');
                setNotifErro(motivos || data.message || t("server_connection_error"));
                return;
            }

            setNotifTesteEnviado(true);
        } catch (error) {
            setNotifErro(error.message || t("server_connection_error"));
        } finally {
            setNotifTestando(false);
        }
    }

    const [openModalExcluirConta, setOpenModalExcluirConta] = useState(false);
    const [excluindoConta, setExcluindoConta] = useState(false);
    const [erroExcluirConta, setErroExcluirConta] = useState('');

    const [openModalCancelarAssinatura, setOpenModalCancelarAssinatura] = useState(false);
    const [processandoAssinatura, setProcessandoAssinatura] = useState(false);
    const [erroAssinatura, setErroAssinatura] = useState('');

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    async function handleExcluirConta() {
        setExcluindoConta(true);
        setErroExcluirConta('');

        try {
            const res = await fetch(`${API_URL}/controller/configuracoes.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ action: 'excluir_conta' })
            });

            const data = await res.json();

            if (!data.success) {
                setErroExcluirConta(data.message || t("unexpected_error"));
                setOpenModalExcluirConta(false);
                return;
            }

            await logout();
            navigate("/login");
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            setErroExcluirConta(t("server_connection_error"));
            setOpenModalExcluirConta(false);
        } finally {
            setExcluindoConta(false);
        }
    }

    async function handleCancelarAssinatura() {
        setProcessandoAssinatura(true);
        setErroAssinatura('');

        try {
            const res = await fetch(`${API_URL}/controller/assinatura.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ action: 'cancelar' })
            });

            const data = await res.json();

            if (!data.success) {
                setErroAssinatura(data.message || t("unexpected_error"));
                setOpenModalCancelarAssinatura(false);
                return;
            }

            await checkAuth(true);
            setOpenModalCancelarAssinatura(false);
        } catch (error) {
            console.error('Erro ao cancelar assinatura:', error);
            setErroAssinatura(t("server_connection_error"));
            setOpenModalCancelarAssinatura(false);
        } finally {
            setProcessandoAssinatura(false);
        }
    }

    async function handleReativarAssinatura() {
        setProcessandoAssinatura(true);
        setErroAssinatura('');

        try {
            const res = await fetch(`${API_URL}/controller/assinatura.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ action: 'reativar' })
            });

            const data = await res.json();

            if (!data.success) {
                setErroAssinatura(data.message || t("unexpected_error"));
                return;
            }

            await checkAuth(true);
        } catch (error) {
            console.error('Erro ao reativar assinatura:', error);
            setErroAssinatura(t("server_connection_error"));
        } finally {
            setProcessandoAssinatura(false);
        }
    }

    useEffect(() => {
        async function carregarConfiguracoes() {
            setLoadingQuantidade(true);

            try {
                const res = await fetch(`${API_URL}/controller/configuracoes.php`, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + localStorage.getItem("token")
                    },
                    body: JSON.stringify({ action: 'obter' })
                });

                const data = await res.json();

                if (data.success) {
                    setQuantidadeFrases(String(data.quantidade_frases_aprender));
                    setVozTts(data.voz_tts || 'nova');
                    setVelocidadeTts(data.velocidade_tts ?? 1.00);
                    localStorage.setItem('zaldemy_velocidade_tts', String(data.velocidade_tts ?? 1.00));
                }
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
            } finally {
                setLoadingQuantidade(false);
            }
        }

        carregarConfiguracoes();
    }, []);

    async function handleSalvarQuantidade(e) {
        e.preventDefault();
        setErroQuantidade('');
        setMensagemQuantidade('');

        const quantidade = Number(quantidadeFrases);

        if (!quantidade || quantidade < QUANTIDADE_FRASES_MIN || quantidade > QUANTIDADE_FRASES_MAX) {
            setErroQuantidade(t("phrases_amount_invalid", { min: QUANTIDADE_FRASES_MIN, max: QUANTIDADE_FRASES_MAX }));
            return;
        }

        setSalvandoQuantidade(true);

        try {
            const res = await fetch(`${API_URL}/controller/configuracoes.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'atualizar_quantidade_frases_aprender',
                    quantidade_frases_aprender: quantidade
                })
            });

            const data = await res.json();

            if (!data.success) {
                setErroQuantidade(data.message || t("unexpected_error"));
                return;
            }

            setMensagemQuantidade(t("saved_successfully"));
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            setErroQuantidade(t("server_connection_error"));
        } finally {
            setSalvandoQuantidade(false);
        }
    }

    async function handleSelecionarVoz(voz) {
        if (voz === vozTts || salvandoVoz) return;

        const vozAnterior = vozTts;
        setVozTts(voz);
        setErroVoz('');
        setSalvandoVoz(true);

        try {
            const res = await fetch(`${API_URL}/controller/configuracoes.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ action: 'atualizar_voz_tts', voz_tts: voz })
            });

            const data = await res.json();

            if (!data.success) {
                setVozTts(vozAnterior);
                setErroVoz(data.message || t("unexpected_error"));
            } else {
                // Sem isso, frases já ouvidas antes continuavam tocando com
                // a voz anterior pra sempre - o cache (memória e Service
                // Worker) guarda o áudio só pelo texto, sem saber qual
                // personagem foi usado pra gerar.
                limparCacheVozNatural();
            }
        } catch (error) {
            console.error('Erro ao salvar voz:', error);
            setVozTts(vozAnterior);
            setErroVoz(t("server_connection_error"));
        } finally {
            setSalvandoVoz(false);
        }
    }

    async function handleSelecionarVelocidade(velocidade) {
        if (velocidade === velocidadeTts || salvandoVelocidade) return;

        const velocidadeAnterior = velocidadeTts;
        setVelocidadeTts(velocidade);
        setErroVelocidade('');
        setSalvandoVelocidade(true);

        try {
            const res = await fetch(`${API_URL}/controller/configuracoes.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ action: 'atualizar_velocidade_tts', velocidade_tts: velocidade })
            });

            const data = await res.json();

            if (!data.success) {
                setVelocidadeTts(velocidadeAnterior);
                setErroVelocidade(data.message || t("unexpected_error"));
            } else {
                localStorage.setItem('zaldemy_velocidade_tts', String(velocidade));
            }
        } catch (error) {
            console.error('Erro ao salvar velocidade:', error);
            setVelocidadeTts(velocidadeAnterior);
            setErroVelocidade(t("server_connection_error"));
        } finally {
            setSalvandoVelocidade(false);
        }
    }

    return (
        <div className="h-dvh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-[140px]">
                <div className="relative mb-4 mt-4">
                    <div
                        className="left-0 cursor-pointer inline-block"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-2xl text-white"></i>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 mb-6">
                        <Settings className="w-6 h-6 text-green-400" />
                        <h1 className="text-2xl font-bold text-white">{t("settings")}</h1>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-green-400" />
                            <span className="text-white text-sm">{t("nickname")}</span>
                        </div>

                        <form onSubmit={handleSalvarApelido} className="flex items-center gap-2">
                            <input
                                type="text"
                                maxLength={20}
                                disabled={salvandoApelido}
                                value={apelido}
                                onChange={(e) => {
                                    setApelido(e.target.value);
                                    setErroApelido('');
                                    setMensagemApelido('');
                                }}
                                className="flex-1 bg-gray-900 border border-gray-600 rounded-full px-4 py-2 text-white text-sm outline-none focus:border-green-400"
                            />
                            <button
                                type="submit"
                                disabled={salvandoApelido}
                                className="shrink-0 bg-[#4cb8c4] disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium"
                            >
                                {salvandoApelido ? t("saving") : t("save")}
                            </button>
                        </form>

                        <p className="text-xs text-gray-400 mt-2">{t("nickname_hint")}</p>

                        {erroApelido && (
                            <p className="text-red-400 text-xs mt-2">{erroApelido}</p>
                        )}
                        {mensagemApelido && (
                            <p className="text-green-400 text-xs mt-2">{mensagemApelido}</p>
                        )}
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-green-400" />
                                <span className="text-white text-sm">{t("phrases_per_learning_session")}</span>
                            </div>
                            <span className="text-green-400 text-lg font-bold min-w-[2rem] text-right">
                                {Number(quantidadeFrases) || QUANTIDADE_FRASES_MIN}
                            </span>
                        </div>

                        <form onSubmit={handleSalvarQuantidade} className="flex items-center gap-3">
                            <div className="flex-1">
                                <input
                                    type="range"
                                    min={QUANTIDADE_FRASES_MIN}
                                    max={QUANTIDADE_FRASES_MAX}
                                    disabled={loadingQuantidade}
                                    value={Number(quantidadeFrases) || QUANTIDADE_FRASES_MIN}
                                    onChange={(e) => {
                                        setQuantidadeFrases(e.target.value);
                                        setErroQuantidade('');
                                        setMensagemQuantidade('');
                                    }}
                                    className="w-full accent-green-400 cursor-pointer"
                                />

                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>{QUANTIDADE_FRASES_MIN}</span>
                                    <span>{QUANTIDADE_FRASES_MAX}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={salvandoQuantidade || loadingQuantidade}
                                className="shrink-0 bg-[#4cb8c4] disabled:opacity-50 text-white px-4 py-1.5 rounded-full text-sm font-medium"
                            >
                                {salvandoQuantidade ? t("saving") : t("save")}
                            </button>
                        </form>

                        {erroQuantidade && (
                            <p className="text-red-400 text-xs mt-2">{erroQuantidade}</p>
                        )}
                        {mensagemQuantidade && (
                            <p className="text-green-400 text-xs mt-2">{mensagemQuantidade}</p>
                        )}
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 mb-3">
                        {isPremium && (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <Volume2 className="w-5 h-5 text-[#4cb8c4]" />
                                    <span className="text-white text-base">{t("voice_type")}</span>
                                </div>

                                <div className="space-y-1.5">
                                    {VOZES_TTS.map((voz) => {
                                        const selecionada = vozTts === voz.valor;
                                        return (
                                            <button
                                                key={voz.valor}
                                                type="button"
                                                disabled={salvandoVoz}
                                                onClick={() => handleSelecionarVoz(voz.valor)}
                                                className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors disabled:opacity-60 ${
                                                    selecionada
                                                        ? "border-[#4cb8c4] bg-[#4cb8c4]/10"
                                                        : "border-gray-700 bg-gray-900/40 hover:bg-gray-700/40"
                                                }`}
                                            >
                                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-lg leading-none shrink-0">
                                                    {voz.emoji}
                                                </span>
                                                <span className={`flex-1 text-left text-sm font-medium ${selecionada ? "text-[#4cb8c4]" : "text-gray-300"}`}>
                                                    {voz.nome}
                                                </span>
                                                {selecionada && (
                                                    <Check className="w-4 h-4 text-[#4cb8c4] shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {erroVoz && (
                                    <p className="text-red-400 text-xs mt-3">{erroVoz}</p>
                                )}
                            </>
                        )}

                        <div className={isPremium ? "mt-4 pt-4 border-t border-gray-700" : ""}>
                            <div className="flex items-center gap-2 mb-2">
                                <Gauge className="w-4 h-4 text-[#4cb8c4]" />
                                <span className="text-gray-300 text-sm">{t("voice_speed")}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {VELOCIDADES_TTS.map((velocidade) => {
                                    const selecionada = velocidadeTts === velocidade;
                                    return (
                                        <button
                                            key={velocidade}
                                            type="button"
                                            disabled={salvandoVelocidade}
                                            onClick={() => handleSelecionarVelocidade(velocidade)}
                                            className={`rounded-lg border py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                                                selecionada
                                                    ? "border-[#4cb8c4] bg-[#4cb8c4]/10 text-[#4cb8c4]"
                                                    : "border-gray-700 bg-gray-900/40 text-gray-300 hover:bg-gray-700/40"
                                            }`}
                                        >
                                            {velocidade}x
                                        </button>
                                    );
                                })}
                            </div>
                            {erroVelocidade && (
                                <p className="text-red-400 text-xs mt-2">{erroVelocidade}</p>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Play className="w-4 h-4 text-[#4cb8c4]" />
                                <span className="text-gray-300 text-sm">{t("autoplay_front_card")}</span>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={autoplayFrente}
                                onClick={handleToggleAutoplayFrente}
                                className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors ${
                                    autoplayFrente ? "bg-[#4cb8c4]" : "bg-gray-700"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        autoplayFrente ? "translate-x-5" : "translate-x-0.5"
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Gauge className="w-4 h-4 text-[#4cb8c4]" />
                                <span className="text-gray-300 text-sm">{t("flip_time_flashcards")}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {TEMPOS_VIRADA_FLASHCARDS.map((segundos) => {
                                    const selecionado = tempoViradaFlashcards === segundos;
                                    return (
                                        <button
                                            key={segundos}
                                            type="button"
                                            onClick={() => handleSelecionarTempoVirada(segundos)}
                                            className={`rounded-lg border py-1.5 text-sm font-medium transition-colors ${
                                                selecionado
                                                    ? "border-[#4cb8c4] bg-[#4cb8c4]/10 text-[#4cb8c4]"
                                                    : "border-gray-700 bg-gray-900/40 text-gray-300 hover:bg-gray-700/40"
                                            }`}
                                        >
                                            {segundos}s
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {notifDisponivel && (
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 mb-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-[#4cb8c4]" />
                                    <span className="text-white text-base">{t("notifications_title")}</span>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={notifAtivada}
                                    disabled={notifCarregando}
                                    onClick={handleToggleNotificacoes}
                                    className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${notifAtivada ? "bg-[#4cb8c4]" : "bg-gray-700"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifAtivada ? "translate-x-5" : "translate-x-0.5"
                                            }`}
                                    />
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm mt-2">{t("notifications_desc")}</p>
                            {/* Botão de teste só pras contas usadas pra depurar esse recurso -
                                texto fixo em português de propósito (não é algo que o usuário
                                comum vai ver, não precisa de tradução). */}
                            {notifAtivada && [194, 47].includes(user?.id) && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleTestarNotificacao}
                                        disabled={notifTestando}
                                        className="mt-3 w-full px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-700/50 disabled:opacity-60 text-gray-300 text-sm font-medium transition-colors"
                                    >
                                        {notifTestando ? "Enviando..." : "Testar notificação"}
                                    </button>
                                    {notifTesteEnviado && (
                                        <p className="text-[#4cb8c4] text-xs mt-2">Notificação de teste enviada! Deve chegar em instantes.</p>
                                    )}
                                </>
                            )}
                            {notifErro && (
                                <p className="text-red-400 text-xs mt-2">{notifErro}</p>
                            )}
                        </div>
                    )}

                    {isPremium && (
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 mb-3">
                            <div className="flex items-center gap-3 mb-3">
                                <CreditCard className="w-5 h-5 text-[#4cb8c4]" />
                                <span className="text-white text-base">{t("subscription")}</span>
                            </div>

                            {user?.assinatura_cancelamento_previsto ? (
                                <>
                                    <p className="text-amber-300 text-sm mb-3">
                                        {t("subscription_ends_on", {
                                            date: new Date(user.assinatura_cancelamento_previsto).toLocaleDateString()
                                        })}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleReativarAssinatura}
                                        disabled={processandoAssinatura}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#4cb8c4] hover:bg-[#3da5b0] disabled:opacity-60 text-white text-sm font-medium transition-colors"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        {t("reactivate_subscription")}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-300 text-sm mb-3">{t("subscription_active")}</p>
                                    <button
                                        type="button"
                                        onClick={() => setOpenModalCancelarAssinatura(true)}
                                        disabled={processandoAssinatura}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-700 hover:bg-gray-700/50 disabled:opacity-60 text-gray-300 text-sm font-medium transition-colors"
                                    >
                                        {t("cancel_subscription")}
                                    </button>
                                </>
                            )}

                            {erroAssinatura && (
                                <p className="text-red-400 text-xs mt-3">{erroAssinatura}</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        <ItemMenu
                            icone={FileText}
                            titulo={t("terms_of_use")}
                            cor="text-blue-400"
                            onClick={() => navigate("/termosdeuso")}
                        />

                        <ItemMenu
                            icone={Shield}
                            titulo={t("privacy_policy")}
                            cor="text-purple-400"
                            onClick={() => navigate("/politicaprivacidade")}
                        />

                        <ItemMenu
                            icone={ShieldCheck}
                            titulo={t("access_history_title")}
                            cor="text-[#4cb8c4]"
                            onClick={() => navigate("/configuracoes/acessos")}
                        />

                        <ItemMenu
                            icone={LogOut}
                            titulo={t("log_out")}
                            cor="text-red-400"
                            onClick={handleLogout}
                        />

                        <ItemMenu
                            icone={Trash2}
                            titulo={t("delete_account")}
                            cor="text-red-500"
                            onClick={() => setOpenModalExcluirConta(true)}
                        />

                        {erroExcluirConta && (
                            <p className="text-red-400 text-xs">{erroExcluirConta}</p>
                        )}
                    </div>
                </div>
            </div>

            <ModalConfirm
                openModalConfirm={openModalExcluirConta}
                setOpenModalConfirm={setOpenModalExcluirConta}
                msg={t("delete_account_confirm_message")}
                onConfirm={handleExcluirConta}
            />

            <ModalConfirm
                openModalConfirm={openModalCancelarAssinatura}
                setOpenModalConfirm={setOpenModalCancelarAssinatura}
                msg={t("cancel_subscription_confirm_message")}
                onConfirm={handleCancelarAssinatura}
            />

            <div className="sticky inset-x-0 bottom-0 z-10 text-center w-full justify-items-center justify-center items-center   ">


                <div className=" w-full ">
                    <div className='flex  left-0   w-full justify-around py-2 '>
                        <button type="button" onClick={() => navigate('/home')} className="flex flex-col items-center gap-1">
                            <Home width={26} height={26} className='text-violet-400' />
                        </button>

                        <button type="button" className="flex flex-col items-center gap-1">
                            <Settings width={26} height={26} className='text-blue-400' />
                            <span className="w-1 h-1 rounded-full bg-blue-400" />
                        </button>

                        <button type="button" onClick={() => navigate('/metricas')} className="flex flex-col items-center gap-1">
                            <BarChart3 width={26} height={26} className='text-green-400' />
                        </button>

                        <button type="button" onClick={verifyPlan} className="relative flex flex-col items-center gap-1">
                            <Bot width={26} height={26} className="text-amber-400" />
                            {user?.plano !== 1 && user?.plano !== 3 && (
                                <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <ModalIA setOpenTreinoIA={setOpenTreinoIA} openTreinoIA={openTreinoIA} />
            <PremiumModal isOpen={isPremiumModalOpen} setIsPremiumModalOpen={setIsPremiumModalOpen} onClose={() => { setIsPremiumModalOpen(false); setMotivoPremium(null); }} motivo={motivoPremium} />
        </div>
    );
}
