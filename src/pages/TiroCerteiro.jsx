import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Target, Trophy, Loader2, AlertCircle, Crosshair, ChevronLeft, ChevronRight, Flame, Settings, X, Check } from "lucide-react";
import PremiumModal from "../components/PremiumModal";
import LimiteDiarioModal from "../components/LimiteDiarioModal";
import { useAuth } from "../context/AuthContext";
import { playAudio, pararAudio, preloadAudio } from "../utils/audioPlayer";
import { tocarSomTiro, tocarSomMissil, tocarSomAcerto, tocarSomErro } from "../utils/somJogo";
import imgMeteoro1 from "../assets/img/meteoro1.png";
import imgMeteoro2 from "../assets/img/meteoro2.png";

const IMAGENS_METEORO = [imgMeteoro1, imgMeteoro2];

// Mesma paleta/critério de ChuvaFrases.jsx pro picker de categorias -
// duplicado (não importado de lá) porque são telas independentes, sem
// nenhum módulo compartilhado de "seleção de categoria" hoje.
const AVATAR_COLORS = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500',
];
// Mesmo valor de ChuvaFrases.jsx - a IA precisa de vocabulário variado o
// bastante pra gerar 12 rodadas sem repetir, categorias muito pequenas
// dão pouca matéria-prima pro prompt (ver TiroCerteiro::gerarRodadas no
// backend).
const MIN_FRASES = 5;

// Munição/vidas/dificuldade - mesma progressão de nível/formato de duração
// de ChuvaFrases.jsx, adaptada pro par certa+errada por rodada em vez de
// um fluxo contínuo sorteado de um pool.
// Premium joga partidas mais longas (mais vidas/munição pra começar) - free/
// limitado continua no valor original.
const VIDAS_INICIAIS = { padrao: 3, premium: 5 };
const MUNICAO_INICIAL = { padrao: 12, premium: 18 };
// Só 2 raias (certa + 1 errada) - decisão explícita de simplificar pra uma
// escolha binária, mais rápida de resolver que 3 opções.
const RAIAS = [33, 67];
const LARGURA_ITEM = 30;

// Mesmos valores/chave usados em ChuvaFrases.jsx/Configuracoes.jsx pra
// velocidade do jogo, mas guardados numa chave própria (zaldemy_velocidade_jogo_tiro)
// - são jogos diferentes, a preferência de um não deveria forçar o outro.
const VELOCIDADES_JOGO = [
    { valor: 1.3, labelKey: "speed_slow" },
    { valor: 1.0, labelKey: "speed_normal" },
    { valor: 0.35, labelKey: "speed_fast" },
];

// Alterna durante a tela de carregamento (~3-5s reais de chamada à IA) pra
// dar sensação de progresso em vez de um texto parado.
const MENSAGENS_CARREGANDO = [
    "tiro_loading_msg_1",
    "tiro_loading_msg_2",
    "tiro_loading_msg_3",
    "tiro_loading_msg_4",
];

// Tempo (ms) que cada tipo de tiro leva pra VIAJAR da nave até o alvo -
// mesmo valor usado na transição CSS do traço/míssil (ver EfeitoTiro) e no
// atraso antes da explosão disparar, pra nunca dessincronizar um do outro.
const DURACAO_VIAGEM_TIRO = { missil: 260, padrao: 120 };

const CORES_RAIA = [
    { bg: "bg-cyan-500/20", border: "border-cyan-400/70", shadow: "shadow-[0_0_16px_rgba(34,211,238,0.45)]", texto: "text-cyan-300", glow: "rgba(34,211,238,0.9)" },
    { bg: "bg-fuchsia-500/20", border: "border-fuchsia-400/70", shadow: "shadow-[0_0_16px_rgba(232,121,249,0.45)]", texto: "text-fuchsia-300", glow: "rgba(232,121,249,0.9)" },
];

function nivelAtual(pontos) {
    return Math.floor(pontos / 50) + 1;
}

// Nave controlável (botões esquerda/direita movem entre as 3 raias fixas,
// mesmas raias em que os alvos caem) - o jogador mira posicionando a nave,
// não tocando direto no alvo. Transição suave de "left" entre raias.
function Nave({ raia }) {
    return (
        <div
            className="absolute bottom-2 z-10 pointer-events-none flex flex-col items-center transition-[left] duration-200 ease-out"
            style={{ left: `${RAIAS[raia]}%`, transform: "translateX(-50%)" }}
        >
            {/* silhueta simples de nave: nariz + asas varridas + entalhe atrás.
                data-nave-corpo dá o retângulo de referência pro cálculo de
                onde exatamente fica o bico (topo-centro) e as asas (cantos
                inferiores) na hora de atirar. */}
            <div
                data-nave-corpo
                className="w-8 h-8 bg-gradient-to-t from-cyan-300 via-fuchsia-400 to-white animate-nave-pulso"
                style={{ clipPath: "polygon(50% 0%, 78% 62%, 100% 100%, 50% 78%, 0% 100%, 22% 62%)" }}
            />
            <div className="w-3 h-3 -mt-1 rounded-full bg-cyan-300/90 shadow-[0_0_10px_4px_rgba(34,211,238,0.8)]" />
        </div>
    );
}

// Painel HUD de um alvo: cantos tipo mira de trava (bracket), não a bolha
// arredondada da Chuva de Frases - lê como "algo pra travar mira e atirar",
// não como um botão de responder.
function PainelAlvo({ texto, cor, errada }) {
    const corBorda = errada ? "#f87171" : cor.glow;

    return (
        <span className="relative inline-flex items-center justify-center px-3 py-2 w-full h-full">
            <span
                className={`relative z-10 text-xs font-semibold text-center leading-tight ${errada ? "text-white" : cor.texto}`}
            >
                {texto}
            </span>
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: corBorda }} />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: corBorda }} />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: corBorda }} />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: corBorda }} />
        </span>
    );
}

// Efeito de tiro: 1 ou 2 traços/lasers saindo dos pontos reais da nave (bico
// ou as duas asas, conforme tipoTiro) até o alvo acertado, seguido de uma
// explosão de partículas neon no ponto de impacto - mesmo princípio de
// Explosao em ChuvaFrases.jsx (CSS + transition disparada após o primeiro
// paint), só que partículas em vez de letras, e com o(s) traço(s) subindo
// antes da explosão.
function EfeitoTiro({ top, left, cor, raios, particulas, tipoTiro }) {
    const [animar, setAnimar] = useState(false);
    // Só true depois que o tiro (laser ou míssil) termina de VIAJAR até o
    // alvo - antes disso a explosão/flash/onda de choque ficava disparando
    // junto com o disparo, "acertando" antes do tiro visualmente chegar lá.
    const [impacto, setImpacto] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setAnimar(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
        const duracaoViagem = DURACAO_VIAGEM_TIRO[tipoTiro] ?? DURACAO_VIAGEM_TIRO.padrao;
        const timer = setTimeout(() => setImpacto(true), duracaoViagem);
        return () => clearTimeout(timer);
    }, [tipoTiro]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {raios.map((raio, i) => (
                <div key={i}>
                    {/* clarão de onde o tiro sai - posição real da nave
                        (bico ou asa), não um ponto fixo. */}
                    <div
                        className="absolute -translate-x-1/2 w-6 h-6 rounded-full transition-opacity"
                        style={{
                            left: raio.origemX,
                            bottom: raio.distanciaAteFundo,
                            backgroundColor: cor.glow,
                            filter: "blur(6px)",
                            opacity: animar ? 0 : 0.9,
                            transitionDuration: "200ms",
                        }}
                    />
                    {tipoTiro === "missil" ? (
                        // Míssil: projétil que VIAJA até o alvo (não é um
                        // feixe instantâneo) - reaproveita o mesmo vetor
                        // origem→alvo do laser (rotate + eixo local), mas
                        // anima a posição de um corpo pequeno ao longo desse
                        // eixo em vez de "crescer" uma linha, com um rastro
                        // de chama atrás pra reforçar a sensação de projétil.
                        // !impacto - sem isso o corpo do míssil ficava parado
                        // no ponto do alvo depois de chegar lá, visível por
                        // cima da explosão, em vez de sumir na hora do
                        // impacto.
                        !impacto && <div
                            className="absolute origin-bottom"
                            style={{
                                left: raio.origemX,
                                bottom: raio.distanciaAteFundo,
                                height: `${raio.comprimento}px`,
                                transform: `rotate(${raio.angulo}deg)`,
                            }}
                        >
                            <div
                                className="absolute -translate-x-1/2 transition-[bottom] ease-in"
                                style={{
                                    left: 0,
                                    bottom: animar ? `${raio.comprimento}px` : "0px",
                                    transitionDuration: `${DURACAO_VIAGEM_TIRO.missil}ms`,
                                }}
                            >
                                <div
                                    className="absolute left-1/2 -translate-x-1/2 top-1.5 w-1 h-4 rounded-full blur-[1px] opacity-80"
                                    style={{ background: `linear-gradient(to top, transparent, ${cor.glow})` }}
                                />
                                <div
                                    className="relative w-2 h-3.5 rounded-t-full rounded-b-sm"
                                    style={{ backgroundColor: cor.glow, boxShadow: `0 0 8px 2px ${cor.glow}` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div
                            className="absolute origin-bottom"
                            style={{
                                left: raio.origemX,
                                bottom: raio.distanciaAteFundo,
                                width: "3px",
                                height: animar ? `${raio.comprimento}px` : "0px",
                                background: `linear-gradient(to top, ${cor.glow}, transparent)`,
                                boxShadow: `0 0 10px ${cor.glow}`,
                                transform: `rotate(${raio.angulo}deg)`,
                                transition: `height ${DURACAO_VIAGEM_TIRO.padrao}ms ease-out`,
                            }}
                        />
                    )}
                </div>
            ))}
            {/* Só MONTA no DOM quando o impacto de verdade acontece - antes
                disso, nem existe (não é só invisível via opacity). Um flash/
                onda/partículas sempre presentes desde o clique, só com a
                transição esperando "impacto", ainda pintava a explosão
                inteira montada (grande, visível) no ponto do alvo desde o
                primeiro frame - a transição só reagia numa mudança de
                estado que nunca chegava a acontecer antes do impacto. */}
            {impacto && <ExplosaoImpacto top={top} left={left} cor={cor} particulas={particulas} />}
        </div>
    );
}

function ExplosaoImpacto({ top, left, cor, particulas }) {
    const [explodindo, setExplodindo] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setExplodindo(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className="absolute" style={{ top, left }}>
            {/* Flash + onda de choque só existem quando há partículas de
                verdade (acerto) - miss/erro passam particulas:[] e não
                ganham esse extra, só o(s) traço(s)/míssil. */}
            {particulas.length > 0 && (
                <>
                    <span
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ease-out"
                        style={{
                            backgroundColor: "#fff",
                            filter: "blur(4px)",
                            width: explodindo ? "6px" : "40px",
                            height: explodindo ? "6px" : "40px",
                            opacity: explodindo ? 0 : 0.9,
                            transitionDuration: "220ms",
                        }}
                    />
                    <span
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ease-out"
                        style={{
                            borderColor: cor.glow,
                            width: explodindo ? "100px" : "6px",
                            height: explodindo ? "100px" : "6px",
                            opacity: explodindo ? 0 : 0.85,
                            transitionDuration: "480ms",
                        }}
                    />
                </>
            )}
            {particulas.map((p) => (
                <span
                    key={p.i}
                    className="absolute rounded-full transition-all ease-out"
                    style={{
                        width: `${p.tamanho ?? 6}px`,
                        height: `${p.tamanho ?? 6}px`,
                        backgroundColor: p.cor ?? cor.glow,
                        boxShadow: `0 0 6px ${p.cor ?? cor.glow}`,
                        transitionDuration: "750ms",
                        transitionDelay: `${p.atraso}ms`,
                        transform: explodindo
                            ? `translate(${p.dx}px, ${p.dy}px) scale(0.3) rotate(${p.rotacao ?? 0}deg)`
                            : "translate(0px, 0px) scale(1)",
                        opacity: explodindo ? 0 : 1,
                    }}
                />
            ))}
        </div>
    );
}

export default function TiroCerteiro() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL;
    const vidasIniciais = user?.plano === 1 ? VIDAS_INICIAIS.premium : VIDAS_INICIAIS.padrao;
    const municaoInicial = user?.plano === 1 ? MUNICAO_INICIAL.premium : MUNICAO_INICIAL.padrao;

    // Para o áudio em reprodução ao sair da tela (troca de rota) - mesmo
    // motivo de ChuvaFrases.jsx.
    useEffect(() => () => pararAudio(), []);

    // escolher | carregando | jogando | fimDeJogo
    const [fase, setFase] = useState("escolher");
    // Alterna a mensagem da tela de carregamento pra dar sensação de
    // progresso durante os ~3-5s reais da geração por IA, em vez de um texto
    // parado (que parece travado quando a chamada demora mais que o normal).
    const [mensagemCarregandoIdx, setMensagemCarregandoIdx] = useState(0);
    const [bloqueado, setBloqueado] = useState(false);
    const [mensagemBloqueio, setMensagemBloqueio] = useState(null);
    const [conteudoInsuficiente, setConteudoInsuficiente] = useState(false);
    const [erro, setErro] = useState(null);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [limiteModalOpen, setLimiteModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);
    const [saindoParaHome, setSaindoParaHome] = useState(false);

    // null = checando, true = bloqueado (free ou cota do limitado
    // esgotada), false = liberado - checa ANTES de mostrar o picker de
    // categorias, mesmo padrão de ChuvaFrases.jsx.
    const [acessoBloqueado, setAcessoBloqueado] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [loadingCategorias, setLoadingCategorias] = useState(true);
    const [selecionadas, setSelecionadas] = useState([]); // ids marcados no picker
    const [categoriasEscolhidas, setCategoriasEscolhidas] = useState([]); // confirmadas pra partida atual

    const [rodadas, setRodadas] = useState([]);
    const [indiceAtual, setIndiceAtual] = useState(0);
    const [caindo, setCaindo] = useState([]);
    const [pontos, setPontos] = useState(0);
    const [vidas, setVidas] = useState(vidasIniciais);
    const [municao, setMunicao] = useState(municaoInicial);
    const [tiro, setTiro] = useState(null);
    const [recorde, setRecorde] = useState(null);
    // índice em RAIAS (0 ou 1) - a nave se move entre as 2 raias fixas com
    // os botões, mesma faixa em que os alvos caem.
    const [naveLane, setNaveLane] = useState(0);

    // Configuração de velocidade - mesmo botão/modal do jogo da Chuva de
    // Frases, mas com chave própria de localStorage (jogo diferente).
    const [modalConfigAberto, setModalConfigAberto] = useState(false);
    const [velocidadeJogo, setVelocidadeJogo] = useState(
        // padrão "rápido" (0.35) pra quem nunca mexeu na configuração -
        // último item de VELOCIDADES_JOGO.
        () => parseFloat(localStorage.getItem('zaldemy_velocidade_jogo_tiro')) || VELOCIDADES_JOGO[VELOCIDADES_JOGO.length - 1].valor
    );

    function handleSelecionarVelocidadeJogo(velocidade) {
        setVelocidadeJogo(velocidade);
        localStorage.setItem('zaldemy_velocidade_jogo_tiro', String(velocidade));
        setCaindo([]);
    }

    // Tipo de tiro: "bico" (um só feixe, saindo do nariz da nave) ou "asas"
    // (dois feixes, um de cada asa, convergindo no mesmo alvo).
    const [tipoTiro, setTipoTiro] = useState(
        () => localStorage.getItem('zaldemy_tipo_tiro') || 'bico'
    );

    function handleSelecionarTipoTiro(tipo) {
        setTipoTiro(tipo);
        localStorage.setItem('zaldemy_tipo_tiro', tipo);
    }

    const uidRef = useRef(0);
    const areaRef = useRef(null);
    const alvo = rodadas[indiceAtual] ?? null;

    // Meteoros decorativos caindo de vez em quando no fundo - só estética,
    // não interage com o jogo (mira/tiro continuam olhando só pra `caindo`,
    // nunca pra `meteoros`). Roda em qualquer fase da tela (loading, jogo
    // bloqueado etc), não só durante a partida.
    const [meteoros, setMeteoros] = useState([]);
    const meteoroUidRef = useRef(0);

    useEffect(() => {
        let cancelado = false;
        let timeoutId;

        function agendarProximo() {
            const espera = 6000 + Math.random() * 9000; // 6 a 15s
            timeoutId = setTimeout(() => {
                if (cancelado) return;

                meteoroUidRef.current += 1;
                const duracao = 5000 + Math.random() * 3000;
                setMeteoros((prev) => [
                    ...prev,
                    {
                        uid: meteoroUidRef.current,
                        img: IMAGENS_METEORO[Math.floor(Math.random() * IMAGENS_METEORO.length)],
                        esquerda: Math.random() * 90,
                        largura: 18 + Math.random() * 58,
                        duracao,
                        drift: (Math.random() - 0.5) * 220,
                        rotacao: 120 + Math.random() * 300,
                    },
                ]);
                agendarProximo();
            }, espera);
        }

        agendarProximo();

        return () => {
            cancelado = true;
            clearTimeout(timeoutId);
        };
    }, []);

    function removerMeteoro(uid) {
        setMeteoros((prev) => prev.filter((m) => m.uid !== uid));
    }

    // 'verificar_acesso' e 'obter_rodadas' podem os dois devolver um bloqueio
    // de plano/cota/cooldown (o segundo reconfere porque é uma chamada
    // separada, que pode acontecer alguns segundos depois da primeira).
    // Retorna true se tratou a resposta como bloqueio (chamador não deve
    // seguir processando).
    function tratarBloqueio(data) {
        if (data.success) return false;

        // Cooldown não é bloqueio de plano - não faz sentido abrir o modal de
        // "vire premium" pra quem já é premium e só está clicando rápido
        // demais em "jogar de novo". Usa a mesma tela de erro genérica (com
        // "tentar novamente"), que já existe pra outras falhas.
        if (data.cooldown) {
            setErro(data.message || t("unexpected_error"));
            return true;
        }

        if (data.conteudo_insuficiente) {
            setConteudoInsuficiente(true);
            return true;
        }

        setBloqueado(true);
        setMensagemBloqueio(data?.message ?? null);

        // Cota diária acabou (usuário limitado) é diferente de precisar
        // virar premium do zero (free) - aqui já é um usuário engajado que
        // só bateu no teto de hoje, não precisa da vitrine completa de
        // funcionalidades de novo, só um aviso claro + opção de assinar.
        if (data.limite_atingido) {
            setLimiteModalOpen(true);
        } else {
            setMotivoPremium("tiro_certeiro");
            setIsPremiumModalOpen(true);
        }
        return true;
    }

    // categoriasParaJogar: array de categorias (objetos com id) escolhidas
    // no picker - category_ids vazio (nenhuma seleção, não deveria acontecer
    // já que o botão "Jogar" só aparece com >=1 marcada) equivale a "todas as
    // categorias" no backend, mesmo comportamento de antes do picker existir.
    function iniciarPartida(categoriasParaJogar) {
        setCategoriasEscolhidas(categoriasParaJogar);
        setFase("carregando");
        setErro(null);
        setConteudoInsuficiente(false);

        const headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token"),
        };

        fetch(`${API_URL}/controller/tiroCerteiro.php`, {
            method: "POST",
            headers,
            body: JSON.stringify({ action: "verificar_acesso" }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (tratarBloqueio(data)) return null;

                return fetch(`${API_URL}/controller/tiroCerteiro.php`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        action: "obter_rodadas",
                        category_ids: categoriasParaJogar.map((c) => c.id),
                    }),
                }).then((r) => r.json());
            })
            .then((data) => {
                if (!data) return; // já tratado como bloqueio acima
                if (tratarBloqueio(data)) return;

                setRodadas(data.rodadas);
                setIndiceAtual(0);
                setPontos(0);
                setVidas(vidasIniciais);
                setMunicao(municaoInicial);
                setCaindo([]);
                setFase("jogando");
            })
            .catch(() => setErro(t("server_connection_error")));

        fetch(`${API_URL}/controller/tiroCerteiro.php`, {
            method: "POST",
            headers,
            body: JSON.stringify({ action: "buscar_recorde" }),
        })
            .then((r) => r.json())
            .then((data) => setRecorde(data?.recorde ?? null))
            .catch(() => { });
    }

    // Checa bloqueio de plano/cota ANTES de mostrar o picker de categorias -
    // só consulta, não registra uso (seguro chamar a qualquer momento).
    // Mesmo padrão de ChuvaFrases.jsx.
    useEffect(() => {
        fetch(`${API_URL}/controller/tiroCerteiro.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token"),
            },
            body: JSON.stringify({ action: "status_acesso" }),
        })
            .then((r) => r.json())
            .then((data) => {
                const acessoBloqueadoAgora = Boolean(data?.bloqueado);
                setAcessoBloqueado(acessoBloqueadoAgora);
                if (acessoBloqueadoAgora) {
                    setMensagemBloqueio(data?.message ?? null);
                    if (data?.limite_atingido) {
                        setLimiteModalOpen(true);
                    } else {
                        setMotivoPremium("tiro_certeiro");
                        setIsPremiumModalOpen(true);
                    }
                }
            })
            .catch(() => setAcessoBloqueado(false));
    }, [API_URL]);

    // Categorias do usuário com frases suficientes pra alimentar a IA - só
    // busca depois de confirmar que o acesso não está bloqueado.
    useEffect(() => {
        if (fase !== "escolher" || acessoBloqueado !== false) return;

        setLoadingCategorias(true);
        fetch(`${API_URL}/controller/categorias.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token"),
            },
            body: JSON.stringify({ action: "listar-com-quantidade" }),
        })
            .then((res) => res.json())
            .then((data) => {
                const lista = Array.isArray(data) ? data : [];
                setCategorias(lista.filter((c) => (c.total_frases ?? 0) >= MIN_FRASES));
            })
            .catch(() => setCategorias([]))
            .finally(() => setLoadingCategorias(false));
    }, [fase, API_URL, acessoBloqueado]);

    function alternarSelecao(categoria) {
        setSelecionadas((prev) =>
            prev.includes(categoria.id)
                ? prev.filter((id) => id !== categoria.id)
                : [...prev, categoria.id]
        );
    }

    useEffect(() => {
        if (fase !== "carregando") return;

        setMensagemCarregandoIdx(0);
        const intervalo = setInterval(() => {
            setMensagemCarregandoIdx((prev) => (prev + 1) % MENSAGENS_CARREGANDO.length);
        }, 1400);

        return () => clearInterval(intervalo);
    }, [fase]);

    function avancarRodada() {
        setIndiceAtual((prev) => (prev + 1 < rodadas.length ? prev + 1 : 0));
        setCaindo([]);
    }

    function perderVida() {
        setVidas((prev) => Math.max(prev - 1, 0));
    }

    function usarMunicao() {
        setMunicao((prev) => Math.max(prev - 1, 0));
    }

    // fim de jogo quando vidas OU munição zeram - via effect, mesmo padrão
    // de ChuvaFrases.jsx, pra não disparar setState/fetch de dentro de
    // outro setState.
    useEffect(() => {
        if (fase === "jogando" && (vidas <= 0 || municao <= 0)) {
            setCaindo([]);
            setFase("fimDeJogo");

            fetch(`${API_URL}/controller/tiroCerteiro.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                },
                body: JSON.stringify({ action: "salvar_pontuacao", pontuacao: pontos }),
            })
                .then((res) => res.json())
                .then((data) => setRecorde((prev) => data?.recorde ?? prev))
                .catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vidas, municao]);

    // Pré-carrega o áudio da tradução certa assim que o texto da rodada
    // aparece (não só quando o jogador acerta) - sem isso, o TTS só começava
    // a buscar o áudio no momento do acerto, com o atraso de rede/geração
    // caindo bem na hora que devia ser instantâneo. Mesma voz padrão
    // gratuita usada no playAudio() do acerto (forcarVozPadrao=true).
    useEffect(() => {
        if (fase !== "jogando" || !alvo) return;
        preloadAudio(alvo.certa, user, null, true);
    }, [fase, alvo, user]);

    // Spawna as 2 opções da rodada juntas, sempre uma em cada raia (nunca
    // duas na mesma raia ao mesmo tempo) - cada uma com sua própria
    // variação de duração, então caem em alturas diferentes uma da outra,
    // não sincronizadas. Um par só, não um fluxo contínuo como em
    // ChuvaFrases.jsx - cada rodada é as 2 opções da IA, não um pool
    // grande de frases pra sortear.
    useEffect(() => {
        if (fase !== "jogando" || !alvo) return;

        const nivel = nivelAtual(pontos);
        const duracaoBase = Math.max(30000 - nivel * 800, 16000) * velocidadeJogo;
        const agora = Date.now();

        // Altura real da área em px, lida uma única vez aqui (não a cada
        // frame) - dá o alcance da queda em transform (px), não em % de
        // "top" (que forçaria reflow contínuo, ver comentário no CSS).
        const alturaArea = areaRef.current?.getBoundingClientRect().height ?? 600;
        const yInicio = -0.12 * alturaArea;
        const yFim = 1.08 * alturaArea;

        const raiaCorreta = Math.random() < 0.5 ? 0 : 1;
        const raiaErrada = raiaCorreta === 0 ? 1 : 0;

        uidRef.current += 1;
        const itemCorreto = {
            uid: uidRef.current,
            texto: alvo.certa,
            correta: true,
            raia: raiaCorreta,
            duracao: duracaoBase * (0.75 + Math.random() * 0.5),
            spawnTime: agora,
            estado: "normal",
            jaErrou: false,
            yInicio,
            yFim,
        };

        uidRef.current += 1;
        const itemErrado = {
            uid: uidRef.current,
            texto: alvo.errada,
            correta: false,
            raia: raiaErrada,
            duracao: duracaoBase * (0.75 + Math.random() * 0.5),
            spawnTime: agora,
            estado: "normal",
            jaErrou: false,
            yInicio,
            yFim,
        };

        setCaindo([itemCorreto, itemErrado]);
    }, [fase, alvo, pontos, velocidadeJogo]);

    function removerCaindo(uid) {
        setCaindo((prev) => prev.filter((item) => item.uid !== uid));
    }

    function handleFimDaQueda(item) {
        if (item.correta) {
            perderVida();
            avancarRodada();
        } else {
            removerCaindo(item.uid);
        }
    }

    function moverNave(direcao) {
        setNaveLane((prev) => Math.min(RAIAS.length - 1, Math.max(0, prev + direcao)));
    }

    // Pontos reais de onde o tiro sai, lidos do DOM da nave (não calculados
    // a partir da raia/porcentagem) - "bico" é o topo-centro do corpo da
    // nave; "asas" são os dois cantos inferiores do mesmo elemento. Sem
    // isso o tiro saía sempre de um ponto fixo, nunca batendo com a
    // posição/forma visual real da nave.
    function origensDaNave() {
        const naveEl = areaRef.current?.querySelector('[data-nave-corpo]');
        const naveRect = naveEl?.getBoundingClientRect();
        const parentRect = areaRef.current?.getBoundingClientRect();

        if (!naveRect || !parentRect) {
            return [{ x: 0, y: parentRect?.height ?? 0 }];
        }

        if (tipoTiro === 'asas') {
            const y = naveRect.bottom - parentRect.top;
            return [
                { x: naveRect.left - parentRect.left, y },
                { x: naveRect.right - parentRect.left, y },
            ];
        }

        return [{ x: naveRect.left - parentRect.left + naveRect.width / 2, y: naveRect.top - parentRect.top }];
    }

    // Dispara na raia em que a nave está mirando (não mais tocando direto
    // no alvo) - só existe no máximo 1 alvo por raia por vez (as 2 opções
    // caem juntas, uma de cada lado). Sem alvo na raia, o tiro sobe reto
    // até o topo sem acertar nada (erra por má mira, não custa vida, só
    // munição).
    function atirar() {
        if (municao <= 0) return;
        usarMunicao();
        if (tipoTiro === "missil") {
            tocarSomMissil();
        } else {
            tocarSomTiro();
        }

        const alvoAtingido = caindo.find((item) => item.raia === naveLane) ?? null;

        const parentRect = areaRef.current?.getBoundingClientRect();
        const altura = parentRect?.height ?? 0;
        const origens = origensDaNave();
        const corNave = CORES_RAIA[naveLane];
        // Tudo que representa o IMPACTO (remover o bloco, tocar o som de
        // acerto/erro, perder vida, pontuar, avançar rodada) precisa
        // esperar o mesmo tempo que o tiro leva pra chegar lá (ver
        // DURACAO_VIAGEM_TIRO) - sem isso o bloco sumia/"explodia" no
        // instante do clique, antes do laser/míssil visualmente alcançá-lo.
        const duracaoViagem = DURACAO_VIAGEM_TIRO[tipoTiro] ?? DURACAO_VIAGEM_TIRO.padrao;

        function montarRaios(alvoX, alvoY) {
            return origens.map((o) => {
                const dx = alvoX - o.x;
                const dy = o.y - alvoY;
                return {
                    origemX: o.x,
                    distanciaAteFundo: altura - o.y,
                    comprimento: Math.sqrt(dx * dx + dy * dy),
                    angulo: Math.atan2(dx, dy) * (180 / Math.PI),
                };
            });
        }

        if (!alvoAtingido) {
            const primeiraOrigem = origens[0] ?? { x: 0, y: altura };
            setTiro({ top: 0, left: primeiraOrigem.x, cor: corNave, raios: montarRaios(primeiraOrigem.x, 0), particulas: [], tipoTiro });
            setTimeout(() => setTiro(null), 500);
            return;
        }

        const el = areaRef.current?.querySelector(`[data-uid="${alvoAtingido.uid}"]`);
        const rect = el?.getBoundingClientRect();
        const top = rect && parentRect ? rect.top - parentRect.top : 0;
        const left = rect && parentRect ? rect.left - parentRect.left + rect.width / 2 : (origens[0]?.x ?? 0);

        const raios = montarRaios(left, top);

        if (!alvoAtingido.correta) {
            setTiro({ top, left, cor: corNave, raios, particulas: [], tipoTiro });
            setTimeout(() => setTiro(null), duracaoViagem + 500);

            setTimeout(() => {
                tocarSomErro();
                setCaindo((prev) =>
                    prev.map((i) => (i.uid === alvoAtingido.uid ? { ...i, estado: "errada", jaErrou: true } : i))
                );
                if (!alvoAtingido.jaErrou) {
                    perderVida();
                }
                setTimeout(() => {
                    setCaindo((prev) =>
                        prev.map((i) => (i.uid === alvoAtingido.uid ? { ...i, estado: "normal" } : i))
                    );
                }, 500);
            }, duracaoViagem);
            return;
        }

        // Explosão de acerto bem mais cheia que a de erro/miss (que não tem
        // partículas nenhuma) - mais fragmentos, tamanhos e cores variados
        // (mistura a cor da raia com um dourado/âmbar de "faísca"), plus
        // flash + onda de choque (ver EfeitoTiro) só nesse caso.
        const corRaia = CORES_RAIA[alvoAtingido.raia % CORES_RAIA.length];
        const particulas = Array.from({ length: 18 }, (_, i) => ({
            i,
            dx: (Math.random() - 0.5) * 260,
            dy: (Math.random() - 0.5) * 260 - 70,
            atraso: Math.random() * 100,
            tamanho: 3 + Math.random() * 6,
            rotacao: Math.random() * 360,
            cor: Math.random() < 0.4 ? "#fbbf24" : corRaia.glow,
        }));

        setTiro({
            top,
            left,
            cor: corRaia,
            raios,
            particulas,
            tipoTiro,
        });
        // Precisa cobrir: viagem do tiro (até 260ms no míssil) + atraso
        // escalonado das partículas (até 100ms) + duração da explosão
        // (750ms) - com folga, senão a limpeza corta a explosão no meio.
        setTimeout(() => setTiro(null), duracaoViagem + 950);

        setTimeout(() => {
            tocarSomAcerto();
            // Sempre a voz padrão gratuita (nunca a natural/premium), mesmo
            // padrão de ChuvaFrases.jsx - reforça a pronúncia certa assim
            // que o jogador acerta, sem depender do plano dele.
            playAudio(alvoAtingido.texto, user, false, null, true, true).catch(() => { });

            removerCaindo(alvoAtingido.uid);
            setPontos((prev) => prev + 10 + nivelAtual(prev));
            avancarRodada();
        }, duracaoViagem);
    }

    return (
        <div className="espaco-fundo px-5 h-dvh flex flex-col text-white">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {meteoros.map((m) => (
                    <img
                        key={m.uid}
                        src={m.img}
                        alt=""
                        onAnimationEnd={() => removerMeteoro(m.uid)}
                        className="meteoro-caindo"
                        style={{
                            left: `${m.esquerda}%`,
                            width: `${m.largura}px`,
                            animationDuration: `${m.duracao}ms`,
                            '--meteoro-drift': `${m.drift}px`,
                            '--meteoro-rot': `${m.rotacao}deg`,
                        }}
                    />
                ))}
            </div>

            <div className="relative flex items-center gap-3 mb-4 mt-4">
                <div className="cursor-pointer" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left text-2xl text-white"></i>
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 text-cyan-300">
                        <Target className="w-5 h-5" />
                    </span>
                    <h1 className="text-lg font-semibold text-white leading-tight truncate">
                        {t("sure_shot_title")}
                    </h1>
                </div>
                {fase === "jogando" && (
                    <button
                        type="button"
                        onClick={() => setModalConfigAberto(true)}
                        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50 transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                )}
            </div>

            {fase === "escolher" && (
                <div className="relative flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
                        {acessoBloqueado === null && (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 text-cyan-300 animate-spin" />
                            </div>
                        )}

                        {acessoBloqueado === true && !saindoParaHome && (
                            <div className="text-center py-10">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-yellow-400" />
                                </div>
                                <p className="text-gray-300 mb-4">{mensagemBloqueio}</p>
                                <button
                                    onClick={() => { setSaindoParaHome(true); navigate(-1); }}
                                    className="px-6 py-3 rounded-full bg-gray-800/50 border border-gray-700 text-white font-medium hover:bg-gray-700/50 transition-colors"
                                >
                                    {t("back_to_home")}
                                </button>
                            </div>
                        )}

                        {acessoBloqueado === false && loadingCategorias && (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 text-cyan-300 animate-spin" />
                            </div>
                        )}

                        {acessoBloqueado === false && !loadingCategorias && categorias.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-gray-300 mb-4">
                                    {t("need_min_phrases_hint", { minimo: MIN_FRASES })}
                                </p>
                                <button
                                    onClick={() => navigate("/listcategorias")}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-white font-medium hover:opacity-90 transition-opacity"
                                >
                                    {t("view_categories")}
                                </button>
                            </div>
                        )}

                        {!loadingCategorias && categorias.length > 0 && (
                            <>
                                <p className="text-gray-400 text-sm mb-3">{t("choose_category_to_play")}</p>
                                {categorias.map((item, index) => {
                                    const marcada = selecionadas.includes(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => alternarSelecao(item)}
                                            className={`flex bg-gray-800/50 backdrop-blur-sm items-center gap-3 py-3 px-4 rounded-xl border shadow-lg mb-3 cursor-pointer transition-colors ${marcada ? "border-cyan-400 bg-cyan-400/10" : "border-gray-700 hover:bg-gray-700/50"
                                                }`}
                                        >
                                            <div
                                                className={`flex items-center justify-center w-11 h-11 shrink-0 rounded-full text-white font-semibold text-lg ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                                            >
                                                {item.categoria?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white font-medium truncate">{item.categoria}</p>
                                                <p className="text-xs text-gray-400">
                                                    {item.total_frases} {t("words")}
                                                </p>
                                            </div>
                                            <div
                                                className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center ${marcada ? "bg-cyan-400 border-cyan-400" : "border-gray-600"
                                                    }`}
                                            >
                                                {marcada && <Check className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {selecionadas.length > 0 && (
                        <button
                            onClick={() =>
                                iniciarPartida(categorias.filter((c) => selecionadas.includes(c.id)))
                            }
                            className="w-full px-6 py-3 mb-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 hover:opacity-90 text-white font-medium transition-opacity shrink-0"
                        >
                            {t("play")}
                        </button>
                    )}
                </div>
            )}

            {fase === "carregando" && !bloqueado && !conteudoInsuficiente && !erro && (
                <div className="relative flex-1 flex flex-col items-center justify-center text-center gap-3">
                    <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
                    <p className="text-gray-300 text-sm transition-opacity duration-300">
                        {t(MENSAGENS_CARREGANDO[mensagemCarregandoIdx])}
                    </p>
                </div>
            )}

            {bloqueado && !saindoParaHome && (
                <div className="relative flex-1 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <p className="text-gray-300 mb-4">{mensagemBloqueio}</p>
                    <button
                        onClick={() => { setSaindoParaHome(true); navigate(-1); }}
                        className="px-6 py-3 rounded-full bg-gray-800/50 border border-gray-700 text-white font-medium hover:bg-gray-700/50 transition-colors"
                    >
                        {t("back")}
                    </button>
                </div>
            )}

            {conteudoInsuficiente && (
                <div className="relative flex-1 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
                        <AlertCircle className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-2">{t("insufficient_content")}</h1>
                    <p className="text-gray-400 text-sm max-w-xs">{t("add_more_phrases_hint")}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-8 px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
                    >
                        {t("back")}
                    </button>
                </div>
            )}

            {erro && (
                <div className="relative flex-1 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
                        <AlertCircle className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-2">{t("unexpected_error")}</h1>
                    <p className="text-gray-400 text-sm max-w-xs">{erro}</p>
                    <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
                        <button
                            onClick={() => iniciarPartida(categoriasEscolhidas)}
                            className="px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
                        >
                            {t("try_again")}
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 rounded-full bg-gray-800/50 border border-gray-700 text-white font-medium hover:bg-gray-700/50 transition-colors"
                        >
                            {t("back")}
                        </button>
                    </div>
                </div>
            )}

            {fase === "jogando" && alvo && (
                <div className="relative flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between gap-2 mb-3 shrink-0 text-sm">
                        <span className="text-gray-300">{t("score")}: <span className="text-white font-semibold">{pontos}</span></span>
                        <span className="flex items-center gap-1 text-red-400">
                            {"❤".repeat(vidas)}
                        </span>
                        <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                            <Crosshair className="w-3.5 h-3.5" /> {municao}
                        </span>
                    </div>

                    <div className="relative rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/10 via-gray-900/60 to-cyan-500/10 px-4 py-3 text-center mb-3 shrink-0">
                        <p className="text-cyan-300 text-[11px] font-semibold uppercase tracking-wider mb-1">
                            {t("translate_this")}
                        </p>
                        <p className="text-base font-bold text-white">{alvo.alvo}</p>
                    </div>

                    <div ref={areaRef} className="chuva-area relative flex-1 overflow-hidden rounded-2xl border border-cyan-900/50 bg-black/30">
                        {caindo.map((item) => {
                            const cor = CORES_RAIA[item.raia % CORES_RAIA.length];
                            const errada = item.estado === "errada";
                            return (
                                <div
                                    key={item.uid}
                                    data-uid={item.uid}
                                    onAnimationEnd={() => handleFimDaQueda(item)}
                                    className={`tiro-item-caindo rounded-md backdrop-blur-sm transition-colors ${errada ? "bg-red-500/30" : "bg-black/50"
                                        }`}
                                    style={{
                                        left: `${RAIAS[item.raia]}%`,
                                        width: `${LARGURA_ITEM}%`,
                                        animationDuration: `${item.duracao}ms`,
                                        animationPlayState: modalConfigAberto ? "paused" : "running",
                                        boxShadow: errada ? "0 0 14px rgba(248,113,113,0.5)" : `0 0 14px ${cor.glow.replace('0.9', '0.35')}`,
                                        '--tiro-y-inicio': `${item.yInicio}px`,
                                        '--tiro-y-fim': `${item.yFim}px`,
                                    }}
                                >
                                    <PainelAlvo texto={item.texto} cor={cor} errada={errada} />
                                </div>
                            );
                        })}
                        {tiro && <EfeitoTiro {...tiro} />}
                        <Nave raia={naveLane} />
                    </div>

                    <div className="flex items-center justify-between shrink-0 pt-3 px-6">
                        <button
                            type="button"
                            onClick={() => moverNave(-1)}
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/70 border border-cyan-400/30 text-cyan-300 active:scale-95 transition-transform"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            type="button"
                            onClick={atirar}
                            disabled={municao <= 0}
                            className="flex items-center justify-center gap-1.5 w-20 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-white font-bold shadow-[0_0_18px_rgba(232,121,249,0.5)] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
                        >
                            <Flame className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => moverNave(1)}
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/70 border border-cyan-400/30 text-cyan-300 active:scale-95 transition-transform"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {fase === "fimDeJogo" && (
                <div className="relative flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mb-5">
                        <Trophy className="w-8 h-8 text-cyan-300" />
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-2">{t("game_over_title")}</h1>
                    <p className="text-gray-300 mb-1">{t("score")}: {pontos}</p>
                    {recorde !== null && (
                        <p className="text-gray-400 text-sm mb-8">{t("best_score")}: {recorde}</p>
                    )}

                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button
                            onClick={() => iniciarPartida(categoriasEscolhidas)}
                            className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 hover:opacity-90 text-white font-medium transition-opacity"
                        >
                            {t("play_again")}
                        </button>
                        <button
                            onClick={() => {
                                setSelecionadas([]);
                                setFase("escolher");
                            }}
                            className="w-full px-6 py-3 rounded-full bg-gray-800/50 border border-gray-700 text-white font-medium hover:bg-gray-700/50 transition-colors"
                        >
                            {t("choose_category_to_play")}
                        </button>
                        <button
                            // navigate(-1), não navigate("/jogos"): a rota
                            // anterior no histórico já É o hub de jogos (único
                            // jeito de entrar aqui) - empilhar um /jogos NOVO por
                            // cima fazia o botão físico de voltar do celular
                            // (que volta 1 passo no histórico) cair de novo nessa
                            // tela de fim de jogo em vez de ir pra Home.
                            onClick={() => navigate(-1)}
                            className="w-full px-6 py-3 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            {t("back")}
                        </button>
                    </div>
                </div>
            )}

            {modalConfigAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setModalConfigAberto(false)} />
                    <div className="relative w-full max-w-xs rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-white font-semibold text-base flex items-center gap-2">
                                <Settings className="w-4 h-4 text-cyan-300" />
                                {t("game_settings")}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setModalConfigAberto(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <p className="text-gray-300 text-sm mb-2">{t("game_speed")}</p>
                            <div className="grid grid-cols-3 gap-2">
                                {VELOCIDADES_JOGO.map(({ valor, labelKey }) => {
                                    const selecionada = velocidadeJogo === valor;
                                    return (
                                        <button
                                            key={valor}
                                            type="button"
                                            onClick={() => handleSelecionarVelocidadeJogo(valor)}
                                            className={`rounded-lg border py-1.5 text-sm font-medium transition-colors ${selecionada
                                                ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                                                : "border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-700/40"
                                                }`}
                                        >
                                            {t(labelKey)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="text-gray-300 text-sm mb-2">{t("shot_type")}</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSelecionarTipoTiro('bico')}
                                    className={`rounded-lg border py-1.5 text-sm font-medium transition-colors ${tipoTiro === 'bico'
                                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                                        : "border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-700/40"
                                        }`}
                                >
                                    {t("shot_type_nose")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSelecionarTipoTiro('asas')}
                                    className={`rounded-lg border py-1.5 text-sm font-medium transition-colors ${tipoTiro === 'asas'
                                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                                        : "border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-700/40"
                                        }`}
                                >
                                    {t("shot_type_wings")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSelecionarTipoTiro('missil')}
                                    className={`rounded-lg border py-1.5 text-sm font-medium transition-colors ${tipoTiro === 'missil'
                                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                                        : "border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-700/40"
                                        }`}
                                >
                                    {t("shot_type_missile")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PremiumModal
                isOpen={isPremiumModalOpen}
                setIsPremiumModalOpen={setIsPremiumModalOpen}
                onClose={() => {
                    if (bloqueado) {
                        setSaindoParaHome(true);
                        navigate(-1);
                        return;
                    }
                    setIsPremiumModalOpen(false);
                    setMotivoPremium(null);
                }}
                motivo={motivoPremium}
            />

            <LimiteDiarioModal
                isOpen={limiteModalOpen}
                mensagem={mensagemBloqueio}
                onClose={() => {
                    setLimiteModalOpen(false);
                    if (bloqueado) {
                        setSaindoParaHome(true);
                        navigate(-1);
                    }
                }}
                onAssinarPremium={() => {
                    setLimiteModalOpen(false);
                    setMotivoPremium("tiro_certeiro");
                    setIsPremiumModalOpen(true);
                }}
            />
        </div>
    );
}
