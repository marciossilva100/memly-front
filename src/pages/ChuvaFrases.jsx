import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { playAudio, pararAudio } from "../utils/audioPlayer";
import { tocarSomAcerto } from "../utils/somJogo";
import { Heart, Trophy, Loader2, CloudRain, Check, Volume2, Settings, X, Target, Flame, Sparkles } from "lucide-react";
import PremiumModal from "../components/PremiumModal";
import LimiteDiarioModal from "../components/LimiteDiarioModal";

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

const MIN_FRASES = 5;
// Premium joga partidas mais longas (mais vidas pra começar) - free/limitado
// continua no valor original.
const VIDAS_INICIAIS = { padrao: 3, premium: 5 };

// Mesmos valores/chave usados em Configuracoes.jsx pra velocidade do jogo -
// mudar num lugar reflete no outro (mesmo localStorage).
const VELOCIDADES_JOGO = [
    { valor: 1.3, labelKey: "speed_slow" },
    { valor: 1.0, labelKey: "speed_normal" },
    { valor: 0.35, labelKey: "speed_fast" },
];
// Raias fixas (centro em %), largura fixa pra todas (LARGURA_ITEM). As
// raias vizinhas SE SOBREPÕEM em X (largura > espaço entre centros) - isso
// é de propósito: permite blocos bem mais largos com 3 raias ao mesmo
// tempo. Quem garante que nunca fica um por cima do outro não é mais
// "cada raia é exclusiva", e sim a checagem de colisão real no spawn (ver
// LIMIAR_QUEDA_SEGURA): uma raia só fica temporariamente bloqueada pra
// vizinhas enquanto o item nela ainda está no alto da tela.
const RAIAS = [25, 50, 75];
const LARGURA_ITEM = 38; // % fixo - ~6% de margem de cada lado
// Fração da queda (0 a 1) que um item precisa ter percorrido antes de uma
// raia vizinha (que se sobrepõe em X) poder spawnar outro item sem risco
// de colisão visual.
const LIMIAR_QUEDA_SEGURA = 0.3;

// Uma cor neon fixa por raia (não aleatória) - visual mais vivo sem virar
// bagunça, já que cada raia sempre cai na mesma cor.
const CORES_RAIA = [
    { bg: "bg-teal-500/25", border: "border-teal-400/70", shadow: "shadow-[0_0_14px_rgba(45,212,191,0.35)]", texto: "text-teal-400", glow: "rgba(45,212,191,0.9)" },
    { bg: "bg-indigo-500/25", border: "border-indigo-400/70", shadow: "shadow-[0_0_14px_rgba(129,140,248,0.35)]", texto: "text-indigo-400", glow: "rgba(129,140,248,0.9)" },
    { bg: "bg-pink-500/25", border: "border-pink-400/70", shadow: "shadow-[0_0_14px_rgba(244,114,182,0.35)]", texto: "text-pink-400", glow: "rgba(244,114,182,0.9)" },
];

function nivelAtual(pontos) {
    return Math.floor(pontos / 50) + 1;
}

function escolherProximoAlvo(pool, usadasAtuais) {
    const disponiveis = pool.filter((f) => !usadasAtuais.includes(f.id));
    const origem = disponiveis.length > 0 ? disponiveis : pool;
    return origem[Math.floor(Math.random() * origem.length)];
}

// Explosão da resposta certa: quebra o texto em letras e anima cada uma pra
// uma direção aleatória (transform/opacity via transition, disparada só
// depois do primeiro paint pra garantir que a transição rode).
function Explosao({ top, left, letras, cor }) {
    const [animar, setAnimar] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setAnimar(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className="absolute pointer-events-none" style={{ top, left }}>
            {letras.map((l) => (
                <span
                    key={l.i}
                    className={`absolute ${cor.texto} text-lg font-extrabold transition-all ease-out`}
                    style={{
                        textShadow: `0 0 10px ${cor.glow}`,
                        transitionDuration: "800ms",
                        transitionDelay: `${l.atraso}ms`,
                        transform: animar
                            ? `translate(${l.dx}px, ${l.dy}px) rotate(${l.rot}deg) scale(1.6)`
                            : 'translate(0px, 0px) rotate(0deg) scale(1)',
                        opacity: animar ? 0 : 1,
                    }}
                >
                    {l.ch}
                </span>
            ))}
        </div>
    );
}

export default function ChuvaFrases() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    const vidasIniciais = user?.plano === 1 ? VIDAS_INICIAIS.premium : VIDAS_INICIAIS.padrao;

    const [fase, setFase] = useState("escolher"); // escolher | jogando | fimDeJogo | poolDominado

    const [categorias, setCategorias] = useState([]);
    const [loadingCategorias, setLoadingCategorias] = useState(true);
    const [selecionadas, setSelecionadas] = useState([]); // ids marcados no picker
    const [categoriasEscolhidas, setCategoriasEscolhidas] = useState([]); // categorias já confirmadas pro jogo atual
    const [loadingFrases, setLoadingFrases] = useState(false);

    const [frases, setFrases] = useState([]);
    // recorde só existe fazendo sentido com UMA categoria - com várias
    // selecionadas, não há uma categoria única pra comparar o recorde salvo.
    const [recorde, setRecorde] = useState(null);

    const [alvo, setAlvo] = useState(null);
    const [caindo, setCaindo] = useState([]);
    const [pontos, setPontos] = useState(0);
    // Estatísticas pra tela de fim de jogo/pool dominado - mesmo padrão já
    // usado em TiroCerteiro.jsx (usuário pediu o mesmo detalhamento aqui).
    const [acertos, setAcertos] = useState(0);
    const [erros, setErros] = useState(0);
    const sequenciaAtualRef = useRef(0);
    const [melhorSequencia, setMelhorSequencia] = useState(0);
    // Cada item: { alvo, certa } - a palavra no idioma nativo e a tradução
    // certa, pra rever depois do jogo o que errou de verdade.
    const [palavrasErradas, setPalavrasErradas] = useState([]);
    const [vidas, setVidas] = useState(vidasIniciais);
    const [explodindo, setExplodindo] = useState(null);

    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [limiteModalOpen, setLimiteModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);

    // Configurações do jogo (velocidade de queda + áudio automático),
    // guardadas no dispositivo - mesmas chaves usadas em Configuracoes.jsx
    // pra velocidade, então mudar aqui também reflete lá e vice-versa.
    const [modalConfigAberto, setModalConfigAberto] = useState(false);
    const [velocidadeJogo, setVelocidadeJogo] = useState(
        () => parseFloat(localStorage.getItem('zaldemy_velocidade_jogo_chuva')) || 1.0
    );
    const [autoplayAudio, setAutoplayAudio] = useState(
        () => localStorage.getItem('zaldemy_autoplay_jogo_chuva') === '1'
    );
    // Indicador visual pro "Ouvir" - sem preload, o clique podia parecer
    // travado (nada acontece por 1-2s até o áudio terminar de gerar).
    const [buscandoAudioAlvo, setBuscandoAudioAlvo] = useState(false);

    function handleSelecionarVelocidadeJogo(velocidade) {
        setVelocidadeJogo(velocidade);
        localStorage.setItem('zaldemy_velocidade_jogo_chuva', String(velocidade));
        // Blocos que já estavam caindo mantêm a duração antiga (a animação já
        // começou com aquele valor) - limpa pra sumirem e reaparecerem já na
        // velocidade nova, senão a troca parece não ter feito nada.
        setCaindo([]);
    }

    function handleToggleAutoplayAudio() {
        const novoValor = !autoplayAudio;
        setAutoplayAudio(novoValor);
        localStorage.setItem('zaldemy_autoplay_jogo_chuva', novoValor ? '1' : '0');
    }

    const uidRef = useRef(0);
    const areaRef = useRef(null);
    // ids de frases já usadas como alvo nesse ciclo - só controla a ordem de
    // sorteio (não aparece na tela), então fica num ref em vez de estado.
    const usadasRef = useRef([]);
    // ids de frases já ACERTADAS nesta partida - diferente de usadasRef
    // (que só evita repetir de imediato, mas volta a sortear depois de um
    // ciclo completo), essas nunca mais voltam a cair, nem depois de um
    // ciclo - pedido explícito do usuário (palavra já dominada não deveria
    // reaparecer). Quando o pool inteiro fica sem nenhuma não-acertada, o
    // jogo encerra com a tela de "dominou tudo" (ver useEffect abaixo).
    const acertadasRef = useRef([]);

    // Para o áudio em reprodução ao sair da tela (troca de rota) - sem isso,
    // o áudio seguia tocando mesmo depois do usuário já ter navegado embora.
    useEffect(() => () => pararAudio(), []);

    // null = checando, true = bloqueado (free ou limitado sem amostra),
    // false = liberado. Checa ANTES de buscar/mostrar a lista de categorias -
    // sem isso, dava pra escolher categoria à toa e só ser barrado ao clicar
    // em "Jogar", depois de já ter visto tudo.
    const [acessoBloqueado, setAcessoBloqueado] = useState(null);
    const [mensagemBloqueio, setMensagemBloqueio] = useState(null);
    // true assim que o usuário decide sair (fechar o modal de bloqueio ou
    // clicar em "Voltar ao início") - esconde a tela de bloqueio na hora,
    // sem esperar a troca de rota terminar de pintar. navigate() do React
    // Router não troca a tela instantaneamente; sem essa flag, a tela de
    // bloqueio ainda ficava visível por um frame entre o clique e a rota
    // realmente mudar pra /home, piscando rápido antes de sumir de vez.
    const [saindoParaHome, setSaindoParaHome] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/controller/jogoChuvaFrases.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token"),
            },
            body: JSON.stringify({ action: "status_acesso" }),
        })
            .then((r) => r.json())
            .then((data) => {
                const bloqueado = Boolean(data?.bloqueado);
                setAcessoBloqueado(bloqueado);
                if (bloqueado) {
                    setMensagemBloqueio(data?.message ?? null);

                    // Cota diária acabou (limitado) é diferente de precisar
                    // virar premium do zero (free) - o primeiro já é um
                    // usuário engajado que só bateu no teto de hoje, não
                    // precisa da vitrine completa de novo.
                    if (data?.limite_atingido) {
                        setLimiteModalOpen(true);
                    } else {
                        setMotivoPremium("jogo_chuva");
                        setIsPremiumModalOpen(true);
                    }
                }
            })
            .catch(() => setAcessoBloqueado(false));
    }, [API_URL]);

    // fase "escolher": categorias do usuário com frases suficientes pro jogo
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
                // Mostra TODAS as categorias, mesmo as que ainda não batem
                // o mínimo - escondê-las sem explicação deixava o usuário
                // sem saber por que uma categoria recém-criada (0 frases)
                // simplesmente não aparecia. As que não batem o mínimo
                // aparecem desabilitadas, com quantas frases ainda faltam.
                setCategorias(lista);
            })
            .catch(() => setCategorias([]))
            .finally(() => setLoadingCategorias(false));
    }, [fase, API_URL, acessoBloqueado]);

    function alternarSelecao(categoria) {
        // Categoria abaixo do mínimo de frases JÁ ESTUDADAS (id_treino >= 2)
        // fica visível mas desabilitada (ver comentário em setCategorias) -
        // clique nela não faz nada. O jogo só usa frases estudadas, então o
        // mínimo tem que valer sobre esse número, não o total cadastrado.
        if ((categoria.total_treinadas ?? 0) < MIN_FRASES) return;

        setSelecionadas((prev) =>
            prev.includes(categoria.id)
                ? prev.filter((id) => id !== categoria.id)
                : [...prev, categoria.id]
        );
    }

    // Premium joga sem limite; Limitado tem uma amostra vitalícia; Free é
    // bloqueado - checagem separada da busca de frases porque não depende de
    // categoria (uma partida pode juntar frases de várias categorias).
    function verificarAcessoEJogar(categoriasParaJogar) {
        fetch(`${API_URL}/controller/jogoChuvaFrases.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token"),
            },
            body: JSON.stringify({ action: "verificar_acesso" }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (!data.success) {
                    setMensagemBloqueio(data?.message ?? null);

                    if (data.limite_atingido) {
                        setLimiteModalOpen(true);
                    } else {
                        setMotivoPremium("jogo_chuva");
                        setIsPremiumModalOpen(true);
                    }
                    return;
                }
                iniciarJogo(categoriasParaJogar);
            })
            .catch(() => {
                // erro de rede - não libera o jogo (evita burlar o limite);
                // usuário pode tentar de novo.
            });
    }

    function iniciarJogo(categoriasParaJogar) {
        setCategoriasEscolhidas(categoriasParaJogar);
        setLoadingFrases(true);
        setFase("jogando");

        const headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token"),
        };

        const buscasFrases = categoriasParaJogar.map((cat) =>
            fetch(`${API_URL}/controller/frases.php`, {
                method: "POST",
                headers,
                // Só frases já estudadas de verdade (id_treino >= 2) - o jogo
                // não deve praticar vocabulário que o aluno nunca treinou.
                body: JSON.stringify({ action: "frases", category_id: cat.id, somente_estudadas: true }),
            }).then((r) => r.json())
        );

        // recorde só é buscado/mostrado quando o jogo é de uma categoria só
        const buscaRecorde =
            categoriasParaJogar.length === 1
                ? fetch(`${API_URL}/controller/jogoChuvaFrases.php`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ action: "buscar_recorde", category_id: categoriasParaJogar[0].id }),
                }).then((r) => r.json())
                : Promise.resolve(null);

        Promise.all([Promise.all(buscasFrases), buscaRecorde])
            .then(([listasFrases, recordeData]) => {
                const listaFrases = listasFrases.flatMap((lista) => (Array.isArray(lista) ? lista : []));

                if (listaFrases.length < MIN_FRASES) {
                    setFase("escolher");
                    return;
                }

                setFrases(listaFrases);
                setRecorde(recordeData?.recorde ?? null);
                setPontos(0);
                setAcertos(0);
                setErros(0);
                sequenciaAtualRef.current = 0;
                setMelhorSequencia(0);
                setPalavrasErradas([]);
                setVidas(vidasIniciais);
                usadasRef.current = [];
                acertadasRef.current = [];
                setCaindo([]);
                setAlvo(escolherProximoAlvo(listaFrases, []));
            })
            .catch(() => setFase("escolher"))
            .finally(() => setLoadingFrases(false));
    }

    // foiAcerto: true quando o alvo atual acabou de ser identificado
    // corretamente (não quando só "encerrou" por cair sem ser tocado) -
    // marca ele como definitivamente fora do pool de sorteio daqui pra
    // frente (ver acertadasRef acima).
    function avancarAlvo(foiAcerto = false) {
        setAlvo((alvoAtual) => {
            if (foiAcerto && alvoAtual) {
                acertadasRef.current = [...acertadasRef.current, alvoAtual.id];
            }

            const poolRestante = frases.filter((f) => !acertadasRef.current.includes(f.id));

            if (poolRestante.length === 0) {
                return null;
            }

            const novasUsadas = alvoAtual ? [...usadasRef.current, alvoAtual.id] : usadasRef.current;
            // usadasRef pode conter ids que acabaram de sair do pool
            // (recém-acertados) - filtra antes de decidir se já deu a volta
            // completa no que resta, senão o ciclo nunca "fecha" de verdade.
            const usadasNoPoolRestante = novasUsadas.filter((id) => poolRestante.some((f) => f.id === id));
            const baseParaEscolha = usadasNoPoolRestante.length >= poolRestante.length ? [] : usadasNoPoolRestante;
            usadasRef.current = baseParaEscolha;
            return escolherProximoAlvo(poolRestante, baseParaEscolha);
        });
        setCaindo([]);
    }

    // palavra (opcional): { alvo, certa } do alvo atual que gerou o erro -
    // vai pra lista de revisão da tela de fim de jogo.
    function perderVida(palavra = null) {
        setVidas((prev) => Math.max(prev - 1, 0));
        setErros((prev) => prev + 1);
        sequenciaAtualRef.current = 0;
        if (palavra) {
            setPalavrasErradas((prev) => [...prev, palavra]);
        }
    }

    // fim de jogo quando as vidas zeram - via effect (não dentro do updater
    // de setVidas) pra não disparar setState/fetch de dentro de outro setState.
    useEffect(() => {
        if (fase === "jogando" && vidas <= 0) {
            setCaindo([]);
            setFase("fimDeJogo");

            // recorde só é salvo pra jogo de categoria única (ver iniciarJogo)
            if (categoriasEscolhidas.length !== 1) return;

            fetch(`${API_URL}/controller/jogoChuvaFrases.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                },
                body: JSON.stringify({
                    action: "salvar_pontuacao",
                    category_id: categoriasEscolhidas[0].id,
                    pontuacao: pontos,
                }),
            })
                .then((res) => res.json())
                .then((data) => setRecorde((prev) => data?.recorde ?? prev))
                .catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vidas]);

    // "Dominou tudo" - avancarAlvo() põe alvo em null quando não sobra mais
    // nenhuma frase não-acertada no pool selecionado. Mesmo padrão de effect
    // do fim de jogo por vidas zeradas (nunca dentro do updater de setAlvo).
    useEffect(() => {
        if (fase === "jogando" && alvo === null) {
            setCaindo([]);
            setFase("poolDominado");

            if (categoriasEscolhidas.length !== 1) return;

            fetch(`${API_URL}/controller/jogoChuvaFrases.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                },
                body: JSON.stringify({
                    action: "salvar_pontuacao",
                    category_id: categoriasEscolhidas[0].id,
                    pontuacao: pontos,
                }),
            })
                .then((res) => res.json())
                .then((data) => setRecorde((prev) => data?.recorde ?? prev))
                .catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alvo]);

    // Sempre em velocidade normal, ignorando a preferência de velocidade
    // salva em Configurações (é uma dica, não o estudo em si).
    // forcarVozPadrao=true - o jogo nunca usa a voz natural (premium), só a
    // padrão, mesmo pra quem tem plano premium/limitado.
    function tocarAudioAlvo() {
        if (!alvo) return;
        setBuscandoAudioAlvo(true);
        playAudio(alvo.texto_traduzido, user, false, null, true, true, () => setBuscandoAudioAlvo(false))
            .catch(() => { })
            .finally(() => setBuscandoAudioAlvo(false));
    }

    // Toca o áudio sozinho a cada nova frase alvo, se a opção "áudio
    // automático" (ícone de config na tela do jogo) estiver ligada.
    useEffect(() => {
        if (fase !== "jogando" || !alvo || !autoplayAudio) return;
        tocarAudioAlvo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alvo, autoplayAudio, fase]);

    // spawn das frases caindo - pausa (sem spawnar nem contar intervalo)
    // enquanto o modal de configurações do jogo está aberto.
    useEffect(() => {
        if (fase !== "jogando" || !alvo || modalConfigAberto) return;

        const nivel = nivelAtual(pontos);
        const intervaloSpawn = Math.max(4500 - nivel * 150, 3000);

        function spawnUmaFrase() {
            setCaindo((prev) => {
                const agora = Date.now();

                // Raias largas o bastante pra sobrepor a vizinha em X quando
                // ambas têm item "no alto" - por isso a checagem não é mais
                // "raia ocupada = bloqueada", e sim colisão real: uma raia só
                // bloqueia outra que se sobrepõe em X se o item nela ainda
                // está na "zona de perigo" (pouco caído). Um item que já caiu
                // o suficiente não bloqueia mais ninguém, mesmo que a raia
                // "oficialmente" ainda esteja em uso - garante 3 raias
                // simultâneas com blocos largos, sem nunca sobrepor de verdade.
                const raiasCandidatas = RAIAS.map((_, i) => i).filter((i) => {
                    return !prev.some((item) => {
                        const progresso = Math.min(1, Math.max(0, (agora - item.spawnTime) / item.duracao));
                        if (progresso >= LIMIAR_QUEDA_SEGURA) return false;
                        return Math.abs(RAIAS[i] - RAIAS[item.raia]) < LARGURA_ITEM;
                    });
                });

                if (raiasCandidatas.length === 0) return prev;

                const temCorreta = prev.some((item) => item.correta);
                // Sorteia se essa é a vez de cair a certa (~35% de chance a cada
                // spawn) em vez de sempre ser a primeira - só força quando chega
                // na última raia candidata, garantindo que ela sempre apareça em
                // algum momento do ciclo, mas em posição aleatória.
                const ultimaRaiaLivre = raiasCandidatas.length === 1;
                const vaiSerCorreta = !temCorreta && (ultimaRaiaLivre || Math.random() < 0.35);

                let texto;
                if (vaiSerCorreta) {
                    texto = alvo.texto_traduzido;
                } else {
                    const candidatas = frases.filter((f) => f.id !== alvo.id);
                    if (candidatas.length === 0) return prev;
                    // quanto maior o nível, mais parecidas (tamanho) as distratoras
                    candidatas.sort(
                        (a, b) =>
                            Math.abs(a.texto_traduzido.length - alvo.texto_traduzido.length) -
                            Math.abs(b.texto_traduzido.length - alvo.texto_traduzido.length)
                    );
                    const faixa = Math.min(candidatas.length, Math.max(2, 6 - Math.floor(nivel / 2)));
                    texto = candidatas[Math.floor(Math.random() * faixa)].texto_traduzido;
                }

                // Preferência de velocidade (Configurações ou o próprio ícone
                // de config na tela do jogo, mesma chave) - multiplicador > 1
                // cai mais devagar, < 1 mais rápido.
                const duracaoBase = Math.max(30000 - nivel * 800, 16000) * velocidadeJogo;
                // varia de 70% a 130% da duração base - dá pra perceber
                // diferença real entre um bloco e outro, sem deixar nenhum
                // rápido demais nem lento demais.
                const duracao = duracaoBase * (0.7 + Math.random() * 0.6);

                const raia = raiasCandidatas[Math.floor(Math.random() * raiasCandidatas.length)];

                uidRef.current += 1;

                return [
                    ...prev,
                    {
                        uid: uidRef.current,
                        texto,
                        correta: vaiSerCorreta,
                        raia,
                        duracao,
                        spawnTime: agora,
                        estado: "normal",
                        jaErrou: false,
                    },
                ];
            });
        }

        // dispara a primeira imediatamente (sem esperar o intervalo) - senão
        // a tela ficava vazia por vários segundos toda vez que o alvo mudava
        spawnUmaFrase();
        const interval = setInterval(spawnUmaFrase, intervaloSpawn);

        return () => clearInterval(interval);
    }, [fase, alvo, pontos, frases, velocidadeJogo, modalConfigAberto]);

    function removerCaindo(uid) {
        setCaindo((prev) => prev.filter((item) => item.uid !== uid));
    }

    function handleFimDaQueda(item) {
        if (item.correta) {
            perderVida(alvo ? { alvo: alvo.texto_nativo, certa: alvo.texto_traduzido } : null);
            avancarAlvo();
        } else {
            removerCaindo(item.uid);
        }
    }

    function handleToqueErrado(item) {
        setCaindo((prev) =>
            prev.map((i) => (i.uid === item.uid ? { ...i, estado: "errada", jaErrou: true } : i))
        );

        if (!item.jaErrou) {
            perderVida(alvo ? { alvo: alvo.texto_nativo, certa: alvo.texto_traduzido } : null);
        }

        setTimeout(() => {
            setCaindo((prev) =>
                prev.map((i) => (i.uid === item.uid ? { ...i, estado: "normal" } : i))
            );
        }, 500);
    }

    function handleToque(item, event) {
        if (!item.correta) {
            handleToqueErrado(item);
            return;
        }

        const el = event.currentTarget;
        const rect = el.getBoundingClientRect();
        const parentRect = areaRef.current?.getBoundingClientRect();
        const top = parentRect ? rect.top - parentRect.top : 0;
        const left = parentRect ? rect.left - parentRect.left : 0;

        const letras = item.texto.split("").map((ch, i) => ({
            ch,
            i,
            dx: (Math.random() - 0.5) * 340,
            dy: (Math.random() - 0.5) * 340 - 90,
            rot: (Math.random() - 0.5) * 540,
            // pequeno atraso por letra - a explosão "estoura" em sequência em
            // vez de todas as letras saindo exatamente juntas, mais dinâmico.
            atraso: Math.random() * 120,
        }));

        setExplodindo({ uid: item.uid, top, left, letras, cor: CORES_RAIA[item.raia % CORES_RAIA.length] });
        setTimeout(() => setExplodindo(null), 950);
        tocarSomAcerto();

        removerCaindo(item.uid);
        setPontos((prev) => prev + 10 + nivelAtual(prev));
        setAcertos((prev) => prev + 1);
        sequenciaAtualRef.current += 1;
        setMelhorSequencia((melhor) => Math.max(melhor, sequenciaAtualRef.current));
        avancarAlvo(true);
    }

    function jogarDeNovo() {
        if (categoriasEscolhidas.length > 0) {
            verificarAcessoEJogar(categoriasEscolhidas);
        }
    }

    return (
        <div className="px-5 h-dvh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex items-center gap-3 mb-4 mt-4">
                <div className="cursor-pointer" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left text-2xl text-white"></i>
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#4cb8c4]/20 to-[#085078]/20 text-[#4cb8c4]">
                        <CloudRain className="w-5 h-5" />
                    </span>
                    <h1 className="text-lg font-semibold text-white leading-tight truncate">
                        {t("phrase_rain_title")}
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
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
                        {acessoBloqueado === null && (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 text-[#4cb8c4] animate-spin" />
                            </div>
                        )}

                        {acessoBloqueado === true && !saindoParaHome && (
                            <div className="text-center py-10">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-yellow-400" />
                                </div>
                                <p className="text-gray-300 mb-4">{mensagemBloqueio || t("premium_reason_audio")}</p>
                                <button
                                    onClick={() => {
                                        setSaindoParaHome(true);
                                        navigate(-1);
                                    }}
                                    className="px-6 py-3 rounded-full bg-gray-800/50 border border-gray-700 text-white font-medium hover:bg-gray-700/50 transition-colors"
                                >
                                    {t("back_to_home")}
                                </button>
                            </div>
                        )}

                        {acessoBloqueado === false && loadingCategorias && (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 text-[#4cb8c4] animate-spin" />
                            </div>
                        )}

                        {acessoBloqueado === false && !loadingCategorias && categorias.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-gray-300 mb-4">
                                    {t("need_min_phrases_hint", { minimo: MIN_FRASES })}
                                </p>
                                <button
                                    onClick={() => navigate("/listcategorias")}
                                    className="px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
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
                                    const faltam = MIN_FRASES - (item.total_treinadas ?? 0);
                                    const bloqueada = faltam > 0;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => alternarSelecao(item)}
                                            className={`flex bg-gray-800/50 backdrop-blur-sm items-center gap-3 py-3 px-4 rounded-xl border shadow-lg mb-3 transition-colors ${bloqueada
                                                    ? "border-gray-700 cursor-not-allowed"
                                                    : marcada
                                                        ? "border-[#4cb8c4] bg-[#4cb8c4]/10 cursor-pointer"
                                                        : "border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                                                }`}
                                        >
                                            <div
                                                className={`flex items-center justify-center w-11 h-11 shrink-0 rounded-full text-white font-semibold text-lg ${bloqueada ? "opacity-40" : ""} ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                                            >
                                                {item.categoria?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`font-medium truncate ${bloqueada ? "text-gray-400" : "text-white"}`}>{item.categoria}</p>
                                                <p className={`text-xs ${bloqueada ? "text-amber-400" : "text-gray-400"}`}>
                                                    {bloqueada
                                                        ? t("missing_phrases_count", { count: faltam })
                                                        : `${item.total_treinadas} ${t("words")}`}
                                                </p>
                                            </div>
                                            {!bloqueada && (
                                                <div
                                                    className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center ${marcada ? "bg-[#4cb8c4] border-[#4cb8c4]" : "border-gray-600"
                                                        }`}
                                                >
                                                    {marcada && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {selecionadas.length > 0 && (
                        <button
                            onClick={() =>
                                verificarAcessoEJogar(categorias.filter((c) => selecionadas.includes(c.id)))
                            }
                            className="w-full px-6 py-3 mb-4 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors shrink-0"
                        >
                            {t("play")}
                        </button>
                    )}
                </div>
            )}

            {fase === "jogando" && (
                <div className="flex-1 flex flex-col min-h-0 pb-4">
                    <div className="flex items-center justify-between mb-2 shrink-0">
                        <div className="flex items-center gap-1">
                            {Array.from({ length: vidasIniciais }).map((_, i) => (
                                <Heart
                                    key={i}
                                    className={`w-5 h-5 ${i < vidas ? "text-red-500 fill-red-500" : "text-gray-700"}`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <span>{t("score")}: {pontos}</span>
                            {recorde !== null && (
                                <span className="flex items-center gap-1">
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                    {recorde}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="relative rounded-2xl border border-[#4cb8c4]/40 bg-gradient-to-br from-[#4cb8c4]/15 via-gray-900 to-gray-900 px-4 py-3 text-center mb-3 shrink-0 overflow-hidden">
                        <p className="relative text-[#8fdce6] text-[11px] font-semibold uppercase tracking-wider mb-1">
                            {t("translate_this")}
                        </p>
                        <p className="relative text-base font-bold text-white mb-2">
                            {loadingFrases ? "..." : alvo?.texto_nativo}
                        </p>
                        <button
                            type="button"
                            onClick={tocarAudioAlvo}
                            disabled={!alvo || buscandoAudioAlvo}
                            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 text-[#4cb8c4] text-xs hover:bg-[#4cb8c4]/20 transition-colors disabled:opacity-50"
                        >
                            {buscandoAudioAlvo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                            {buscandoAudioAlvo ? t("generating_audio") : t("listen")}
                        </button>
                    </div>

                    <div ref={areaRef} className="chuva-area relative flex-1 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/40">
                        {caindo.map((item) => {
                            const cor = CORES_RAIA[item.raia % CORES_RAIA.length];
                            return (
                                <button
                                    key={item.uid}
                                    onClick={(e) => handleToque(item, e)}
                                    onAnimationEnd={() => handleFimDaQueda(item)}
                                    className={`chuva-item px-3 py-2 rounded-2xl border text-sm font-medium text-center transition-colors ${item.estado === "errada"
                                            ? "bg-red-500/80 border-red-400 text-white"
                                            : `${cor.bg} ${cor.border} ${cor.shadow} text-white`
                                        }`}
                                    style={{
                                        left: `${RAIAS[item.raia]}%`,
                                        transform: "translateX(-50%)",
                                        width: `${LARGURA_ITEM}%`,
                                        animationDuration: `${item.duracao}ms`,
                                        // congela a queda no ponto exato enquanto o modal de
                                        // configurações do jogo está aberto
                                        animationPlayState: modalConfigAberto ? "paused" : "running",
                                    }}
                                >
                                    {item.texto}
                                </button>
                            );
                        })}
                        {explodindo && <Explosao {...explodindo} />}
                    </div>
                </div>
            )}

            {(fase === "fimDeJogo" || fase === "poolDominado") && (
                <div className="relative flex-1 flex flex-col items-center text-center overflow-y-auto py-6 px-1">
                    <div className="w-16 h-16 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 flex items-center justify-center mb-4 shrink-0">
                        {fase === "poolDominado" ? (
                            <Sparkles className="w-8 h-8 text-[#4cb8c4]" />
                        ) : (
                            <Trophy className="w-8 h-8 text-[#4cb8c4]" />
                        )}
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-2">
                        {fase === "poolDominado" ? t("pool_mastered_title") : t("game_over_title")}
                    </h1>
                    {fase === "poolDominado" && (
                        <p className="text-gray-400 text-sm mb-3 max-w-xs">{t("pool_mastered_subtitle")}</p>
                    )}
                    <p className="text-gray-300 mb-1">{t("score")}: {pontos}</p>
                    {recorde !== null && (
                        <p className="text-gray-400 text-sm mb-4">{t("best_score")}: {recorde}</p>
                    )}

                    <div className="grid grid-cols-2 gap-2 w-full max-w-xs mb-4">
                        <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-3 flex flex-col items-center gap-1">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-lg font-semibold text-white leading-none">{acertos}</span>
                            <span className="text-[11px] text-gray-400 leading-none">{t("hits_label")}</span>
                        </div>
                        <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-3 flex flex-col items-center gap-1">
                            <X className="w-4 h-4 text-red-400" />
                            <span className="text-lg font-semibold text-white leading-none">{erros}</span>
                            <span className="text-[11px] text-gray-400 leading-none">{t("misses_label")}</span>
                        </div>
                        <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-3 flex flex-col items-center gap-1">
                            <Target className="w-4 h-4 text-[#4cb8c4]" />
                            <span className="text-lg font-semibold text-white leading-none">
                                {(acertos + erros) > 0 ? Math.round((acertos / (acertos + erros)) * 100) : 0}%
                            </span>
                            <span className="text-[11px] text-gray-400 leading-none">{t("accuracy_rate")}</span>
                        </div>
                        <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-3 flex flex-col items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-lg font-semibold text-white leading-none">{melhorSequencia}</span>
                            <span className="text-[11px] text-gray-400 leading-none">{t("best_answer_streak")}</span>
                        </div>
                    </div>

                    {palavrasErradas.length > 0 && (
                        <div className="w-full max-w-xs mb-4 text-left">
                            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">{t("words_to_review_label")}</p>
                            <div className="max-h-32 overflow-y-auto flex flex-col gap-1.5 pr-1">
                                {palavrasErradas.map((p, i) => (
                                    <div
                                        key={i}
                                        className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-1.5 text-sm text-white flex items-center justify-between gap-2"
                                    >
                                        <span className="truncate">{p.alvo}</span>
                                        <span className="text-gray-400 text-xs shrink-0">{p.certa}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 w-full max-w-xs mt-auto shrink-0">
                        <button
                            onClick={jogarDeNovo}
                            className="w-full px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
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
                            // navigate(-1), não navigate("/home"): a rota
                            // anterior no histórico já É o hub de jogos (único
                            // jeito de entrar aqui) - empilhar um /home novo por
                            // cima fazia o botão físico de voltar do celular
                            // (que volta 1 passo no histórico) cair de novo
                            // nessa tela de fim de jogo em vez de seguir saindo.
                            onClick={() => navigate(-1)}
                            className="w-full px-6 py-3 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            {t("back_to_home")}
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
                                <Settings className="w-4 h-4 text-[#4cb8c4]" />
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

                        <div className="mb-4">
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
                                                    ? "border-[#4cb8c4] bg-[#4cb8c4]/10 text-[#4cb8c4]"
                                                    : "border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-700/40"
                                                }`}
                                        >
                                            {t(labelKey)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-700">
                            <span className="text-gray-300 text-sm">{t("game_audio_autoplay")}</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={autoplayAudio}
                                onClick={handleToggleAutoplayAudio}
                                className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors ${autoplayAudio ? "bg-[#4cb8c4]" : "bg-gray-700"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoplayAudio ? "translate-x-5" : "translate-x-0.5"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PremiumModal
                isOpen={isPremiumModalOpen}
                setIsPremiumModalOpen={setIsPremiumModalOpen}
                onClose={() => {
                    // Acesso à tela inteira bloqueado (limite do jogo acabou) - fechar o
                    // modal (setIsPremiumModalOpen(false)) ANTES de navegar deixava a
                    // tela de bloqueio por trás visível por um frame entre um estado e
                    // outro (a rota só troca de verdade depois do navigate), causando
                    // uma piscada rápida. Só navega, sem tocar no estado do modal - a
                    // página inteira desmonta na troca de rota de qualquer forma.
                    if (acessoBloqueado === true) {
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
                    if (acessoBloqueado === true) {
                        setSaindoParaHome(true);
                        navigate(-1);
                    }
                }}
                onAssinarPremium={() => {
                    setLimiteModalOpen(false);
                    setMotivoPremium("jogo_chuva");
                    setIsPremiumModalOpen(true);
                }}
            />
        </div>
    );
}
