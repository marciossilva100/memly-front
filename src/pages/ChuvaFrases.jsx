import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { playAudio } from "../utils/audioPlayer";
import { Heart, Trophy, Loader2, CloudRain, Check } from "lucide-react";

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
const VIDAS_INICIAIS = 3;

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
function Explosao({ top, left, letras }) {
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
                    className="absolute text-white text-base font-semibold transition-all duration-700 ease-out"
                    style={{
                        transform: animar
                            ? `translate(${l.dx}px, ${l.dy}px) rotate(${l.rot}deg)`
                            : 'translate(0px, 0px) rotate(0deg)',
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

    const [fase, setFase] = useState("escolher"); // escolher | jogando | fimDeJogo

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
    const [vidas, setVidas] = useState(VIDAS_INICIAIS);
    const [explodindo, setExplodindo] = useState(null);
    // texto mostrado no centro da tela junto com o áudio, no acerto - a
    // próxima chuva só começa depois que ele some (áudio termina).
    const [textoCentral, setTextoCentral] = useState(null);

    const uidRef = useRef(0);
    const areaRef = useRef(null);
    // ids de frases já usadas como alvo nesse ciclo - só controla a ordem de
    // sorteio (não aparece na tela), então fica num ref em vez de estado.
    const usadasRef = useRef([]);

    // fase "escolher": categorias do usuário com frases suficientes pro jogo
    useEffect(() => {
        if (fase !== "escolher") return;

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
    }, [fase, API_URL]);

    function alternarSelecao(categoria) {
        setSelecionadas((prev) =>
            prev.includes(categoria.id)
                ? prev.filter((id) => id !== categoria.id)
                : [...prev, categoria.id]
        );
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
                body: JSON.stringify({ action: "frases", category_id: cat.id }),
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
                setVidas(VIDAS_INICIAIS);
                usadasRef.current = [];
                setCaindo([]);
                setTextoCentral(null);
                setAlvo(escolherProximoAlvo(listaFrases, []));
            })
            .catch(() => setFase("escolher"))
            .finally(() => setLoadingFrases(false));
    }

    function avancarAlvo() {
        setAlvo((alvoAtual) => {
            const novasUsadas = alvoAtual ? [...usadasRef.current, alvoAtual.id] : usadasRef.current;
            const baseParaEscolha = novasUsadas.length >= frases.length ? [] : novasUsadas;
            usadasRef.current = baseParaEscolha;
            return escolherProximoAlvo(frases, baseParaEscolha);
        });
        setCaindo([]);
    }

    function perderVida() {
        setVidas((prev) => Math.max(prev - 1, 0));
    }

    // fim de jogo quando as vidas zeram - via effect (não dentro do updater
    // de setVidas) pra não disparar setState/fetch de dentro de outro setState.
    useEffect(() => {
        if (fase === "jogando" && vidas <= 0) {
            setCaindo([]);
            setTextoCentral(null);
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

    // spawn das frases caindo - pausado enquanto o texto central (acerto) está
    // na tela, senão a chuva do próximo alvo começaria antes da hora.
    useEffect(() => {
        if (fase !== "jogando" || !alvo || textoCentral) return;

        const nivel = nivelAtual(pontos);
        const maxSimultaneas = Math.min(3 + Math.floor(nivel / 2), 7);
        const intervaloSpawn = Math.max(2400 - nivel * 120, 1100);

        const interval = setInterval(() => {
            setCaindo((prev) => {
                if (prev.length >= maxSimultaneas) return prev;

                const temCorreta = prev.some((item) => item.correta);
                // Sorteia se essa é a vez de cair a certa (~35% de chance a cada
                // spawn) em vez de sempre ser a primeira - só força quando chega
                // no último espaço livre, garantindo que ela sempre apareça em
                // algum momento do ciclo, mas em posição aleatória.
                const ultimoSlotDisponivel = prev.length >= maxSimultaneas - 1;
                const vaiSerCorreta = !temCorreta && (ultimoSlotDisponivel || Math.random() < 0.35);

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

                const duracaoBase = Math.max(15000 - nivel * 600, 7000);
                const duracao = duracaoBase + (Math.random() * 1500 - 750);

                uidRef.current += 1;

                return [
                    ...prev,
                    {
                        uid: uidRef.current,
                        texto,
                        correta: vaiSerCorreta,
                        // centralizado via transform:translateX(-50%) no render,
                        // faixa apertada pra não deixar a frase saindo da tela
                        // mesmo quando ela é mais comprida.
                        left: 22 + Math.random() * 56,
                        duracao,
                        estado: "normal",
                        jaErrou: false,
                    },
                ];
            });
        }, intervaloSpawn);

        return () => clearInterval(interval);
    }, [fase, alvo, pontos, frases, textoCentral]);

    function removerCaindo(uid) {
        setCaindo((prev) => prev.filter((item) => item.uid !== uid));
    }

    function handleFimDaQueda(item) {
        if (item.correta) {
            perderVida();
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
            perderVida();
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
            dx: (Math.random() - 0.5) * 220,
            dy: (Math.random() - 0.5) * 220 - 60,
            rot: (Math.random() - 0.5) * 360,
        }));

        setExplodindo({ uid: item.uid, top, left, letras });
        setTimeout(() => setExplodindo(null), 700);

        removerCaindo(item.uid);
        setCaindo([]);
        setPontos((prev) => prev + 10 + nivelAtual(prev));
        setTextoCentral(item.texto);

        // Sempre em velocidade normal, ignorando a preferência de velocidade
        // configurada em Configurações - o objetivo aqui é reforçar a
        // pronúncia certa, não seguir a preferência de estudo do usuário.
        playAudio(item.texto, user, false, null, false, true)
            .catch(() => { })
            .finally(() => {
                setTextoCentral(null);
                avancarAlvo();
            });
    }

    function jogarDeNovo() {
        if (categoriasEscolhidas.length > 0) {
            iniciarJogo(categoriasEscolhidas);
        }
    }

    return (
        <div className="px-5 h-dvh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex items-center gap-3 mb-4 mt-4">
                <div className="cursor-pointer" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left text-2xl text-white"></i>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#4cb8c4]/20 to-[#085078]/20 text-[#4cb8c4]">
                        <CloudRain className="w-5 h-5" />
                    </span>
                    <h1 className="text-lg font-semibold text-white leading-tight truncate">
                        {t("phrase_rain_title")}
                    </h1>
                </div>
            </div>

            {fase === "escolher" && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
                        {loadingCategorias && (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 text-[#4cb8c4] animate-spin" />
                            </div>
                        )}

                        {!loadingCategorias && categorias.length === 0 && (
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
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => alternarSelecao(item)}
                                            className={`flex bg-gray-800/50 backdrop-blur-sm items-center gap-3 py-3 px-4 rounded-xl border shadow-lg mb-3 cursor-pointer transition-colors ${marcada ? "border-[#4cb8c4] bg-[#4cb8c4]/10" : "border-gray-700 hover:bg-gray-700/50"
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
                                                className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center ${marcada ? "bg-[#4cb8c4] border-[#4cb8c4]" : "border-gray-600"
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
                                iniciarJogo(categorias.filter((c) => selecionadas.includes(c.id)))
                            }
                            className="w-full px-6 py-3 mb-4 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors shrink-0"
                        >
                            {t("play_again") /* "Jogar" reaproveitando o mesmo texto do botão de início */}
                        </button>
                    )}
                </div>
            )}

            {fase === "jogando" && (
                <div className="flex-1 flex flex-col min-h-0 pb-4">
                    <div className="flex items-center justify-between mb-2 shrink-0">
                        <div className="flex items-center gap-1">
                            {Array.from({ length: VIDAS_INICIAIS }).map((_, i) => (
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

                    <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm px-4 py-3 text-center mb-3 shrink-0">
                        <p className="text-xs text-gray-400 mb-1">{t("translate_this")}</p>
                        <p className="text-lg font-semibold text-white">
                            {loadingFrases ? "..." : alvo?.texto_nativo}
                        </p>
                    </div>

                    <div ref={areaRef} className="chuva-area relative flex-1 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/40">
                        {caindo.map((item) => (
                            <button
                                key={item.uid}
                                onClick={(e) => handleToque(item, e)}
                                onAnimationEnd={() => handleFimDaQueda(item)}
                                className={`chuva-item px-3 py-2 rounded-2xl border text-sm font-medium text-center transition-colors ${item.estado === "errada"
                                        ? "bg-red-500/80 border-red-400 text-white"
                                        : "bg-gray-800/80 border-gray-600 text-white"
                                    }`}
                                style={{
                                    left: `${item.left}%`,
                                    transform: "translateX(-50%)",
                                    maxWidth: "62%",
                                    animationDuration: `${item.duracao}ms`,
                                }}
                            >
                                {item.texto}
                            </button>
                        ))}
                        {explodindo && <Explosao {...explodindo} />}

                        {textoCentral && (
                            <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
                                <div className="bg-gray-900/95 border border-[#4cb8c4]/40 rounded-2xl px-5 py-4 text-center shadow-xl max-w-[85%]">
                                    <p className="text-white text-lg font-semibold">{textoCentral}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {fase === "fimDeJogo" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 flex items-center justify-center mb-5">
                        <Trophy className="w-8 h-8 text-[#4cb8c4]" />
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-2">{t("game_over_title")}</h1>
                    <p className="text-gray-300 mb-1">{t("score")}: {pontos}</p>
                    {recorde !== null && (
                        <p className="text-gray-400 text-sm mb-8">{t("best_score")}: {recorde}</p>
                    )}

                    <div className="flex flex-col gap-3 w-full max-w-xs">
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
                            onClick={() => navigate("/home")}
                            className="w-full px-6 py-3 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            {t("back_to_home")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
