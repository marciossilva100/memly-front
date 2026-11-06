import { useState, useEffect, useLayoutEffect, useRef, use } from 'react'
import { useNavigate } from "react-router-dom";
import ModalCategorias from '../components/ModalCategorias';
import ModalCategoriasEditar from '../components/ModalCategoriasEditar'
import ModalTreino from '../components/ModaTreino';
import ModalTreinoAdvinhar from "../components/ModalTreinoAdvinhar";
import ModalIA from '../components/ModalIA';
import ModalSucesso from '../components/ModalSucesso';
import PremiumModal from '../components/PremiumModal'
import LimiteDiarioModal from '../components/LimiteDiarioModal';
import ModalConfirm from '../components/ModalConfirm';
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { treinoStatsCache } from "../utils/treinoStatsCache";
import { carregarFrasesIaVistas } from "../utils/frasesIaVistas";


import { BookOpen, BarChart3, Bot, Plus, Home as HomeIcon, CheckCircle2, Flame, Gamepad2, Crown, Search, AlertTriangle, RefreshCw, Sparkles, MoreVertical, Star } from "lucide-react";

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

// Categoria pode ter até 50 caracteres agora (era 20), mas o card da Home é
// estreito demais pra caber isso sem quebrar o layout - trunca em 15 pra
// exibição (o nome completo continua salvo e aparece ao editar a categoria).
const MAX_CARACTERES_NOME_CATEGORIA_HOME = 15;

function truncarNomeCategoria(nome) {
    if (!nome || nome.length <= MAX_CARACTERES_NOME_CATEGORIA_HOME) return nome;
    return nome.slice(0, MAX_CARACTERES_NOME_CATEGORIA_HOME) + "…";
}

// Mesma fórmula que existia só dentro do TermometroEstudo (removido da Home -
// a barra vertical ao lado da lista tinha baixa descoberta e o modal dela
// duplicava streak/treino IA que a tela de Métricas já mostra bem melhor).
// O conceito de nível em si é único (não existe em Métricas), por isso
// virou só mais um card na mesma fileira de Categorias/Palavras, em vez de
// um elemento à parte.
const PALAVRAS_POR_NIVEL = 20;
const PONTOS_POR_DIA_ACESSO = 5;

function calcularNivelEstudo(totalAprendidas, diasAcesso) {
    const pontosTotais = totalAprendidas + diasAcesso * PONTOS_POR_DIA_ACESSO;
    return Math.floor(pontosTotais / PALAVRAS_POR_NIVEL) + 1;
}

export default function Home() {
    const { user, setUser, setCategoriasLoading, categoriasLoading } = useAuth();
    // Mesmo estado de "frases da IA já vistas" usado em Frases.jsx (chave
    // compartilhada) - marcar como vista lá também soma o indicador daqui.
    const [frasesIaVistas] = useState(() => carregarFrasesIaVistas());
    const [open, setOpen] = useState(false);
    const [openCategoriaEditar, setOpenCategoriaEditar] = useState(false);
    const [openTreino, setOpenTreino] = useState(false)
    const [categorias, setCategorias] = useState([]);
    // true só quando a busca de categorias falhou de verdade (erro de rede/
    // servidor) - diferente de "usuário não tem categoria nenhuma", que é um
    // resultado válido e não deve mostrar erro nenhum. Bug real reportado: o
    // processo do app foi morto pelo Android por pressão de memória
    // enquanto em segundo plano; ao reabrir, a busca de categorias falhou
    // (rede ainda se recuperando logo depois do processo reiniciar) e a
    // tela ficava com a lista vazia sem nenhum aviso nem jeito de tentar de
    // novo sem fechar e abrir o app inteiro.
    const [erroCategorias, setErroCategorias] = useState(false);
    const [buscaCategoria, setBuscaCategoria] = useState("");
    // Balão "crie sua primeira categoria" - baseado no estado real (usuário
    // sem nenhuma categoria ainda), não numa flag solta que só era limpa
    // clicando exatamente no botão de adicionar. Isso fazia o balão voltar a
    // aparecer pra usuários antigos: se a primeira categoria fosse criada por
    // outro caminho, ou se a flag ficasse de um login antigo no mesmo
    // navegador (localStorage não é por conta), ela nunca era removida.
    // tipo=3 são as categorias de interesse criadas automaticamente no
    // onboarding (uma por par de idioma) - o usuário não escolheu criá-las,
    // então elas não contam como "já tem categoria" pra esse balão. Sem essa
    // exclusão, o balão nunca aparecia pra ninguém: todo usuário novo já sai
    // do onboarding com pelo menos uma dessas.
    const temCategoriaPropria = categorias.some((cat) => cat.tipo !== 3);
    // Some assim que o usuário clica no botão indicado (guia_categoria_dispensado,
    // persistido no backend via controller/categorias.php ação
    // dispensar_guia_primeira_categoria) - nunca mais volta a aparecer
    // depois disso, mesmo que ele ainda não tenha criado categoria nenhuma e
    // mesmo em outro dispositivo/sessão. Antes disso ser persistido no
    // servidor, um estado só em memória fazia o balão reaparecer a cada
    // recarregamento da página.
    // !erroCategorias - sem isso, uma falha de rede ao buscar categorias
    // (lista vem vazia por erro, não por o usuário realmente não ter
    // nenhuma) mostrava esse guia de "crie sua primeira categoria" de forma
    // enganosa, por cima do erro real. Ver erroCategorias/carregarCategorias.
    const mostrarGuiaCategoria = !categoriasLoading && !temCategoriaPropria && !user?.guia_categoria_dispensado && !erroCategorias;
    // Guia de "próximo passo" - continuação do guia acima, cobrindo os
    // estágios seguintes (usuário já tem categoria mas ainda fica perdido
    // sobre o que fazer). Nunca aparece junto com mostrarGuiaCategoria -
    // fica em silêncio até esse primeiro guia sumir (categoria criada ou
    // dispensada), pra não empilhar dois avisos ao mesmo tempo.
    const totalFrases = categorias.reduce((soma, cat) => soma + (cat.quantidade || 0), 0);
    const mostrarGuiaAdicionarFrases = !categoriasLoading && !mostrarGuiaCategoria && categorias.length > 0 && totalFrases === 0;
    // Some se QUALQUER frase já passou por um treino de verdade (id_treino
    // >= 2, ver total_treinadas em Categorias::listarComQuantidade) - não
    // depende só da flag guia_treino_dispensado (persistida via
    // controller/treino.php ação dispensar_guia_treino, setada ao clicar no
    // CTA do card), que nunca seria marcada pra quem já treinou por outro
    // caminho (ex: clicando direto no botão Treinar de uma categoria, antes
    // desse guia existir).
    const totalTreinadas = categorias.reduce((soma, cat) => soma + (cat.treinadas || 0), 0);
    const mostrarGuiaTreinar = !categoriasLoading && !mostrarGuiaCategoria && totalFrases > 0 && totalTreinadas === 0 && !user?.guia_treino_dispensado;
    const categoriaComConteudo = categorias.find((cat) => cat.quantidade > 0);
    const [revisarPorCategoria, setRevisarPorCategoria] = useState({});
    const [openTreinoAdvinhar, setOpenTreinoAdvinhar] = useState(false)
    const [openTreinoIA, setOpenTreinoIA] = useState(false)
    const [openModalSucesso, setOpenModalSucesso] = useState(false)
    const [categoriaId, setCategoriaId] = useState(0)
    const [categoriaClick, setCategoriaClick] = useState('')
    const [categoriaPublicaClick, setCategoriaPublicaClick] = useState(0)
    const [categoriaGerarFraseDiariaClick, setCategoriaGerarFraseDiariaClick] = useState(0)
    const [msgModalSucesso, setMsgModalSucesso] = useState('')
    const [frase, openFrase] = useState('')
    const [error, setError] = useState('')
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);
    const [limiteModalOpen, setLimiteModalOpen] = useState(false);
    const [mensagemLimite, setMensagemLimite] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [recarregar, setRecarregar] = useState(false)
    const [modalConfirm, setOpenModalConfirm] = useState(false)
    const [msgModalConfirm, setMsgModalConfirm] = useState('')
    const [deleteId, setDeleteId] = useState(0)
    const [streak, setStreak] = useState(0)
    const [diasAcesso, setDiasAcesso] = useState(0)
    const [totalAprendidas, setTotalAprendidas] = useState(0)
    const nivelEstudo = calcularNivelEstudo(totalAprendidas, diasAcesso)
    const [treinoIaDisponivel, setTreinoIaDisponivel] = useState(false)
    const { t } = useTranslation();
    const API_URL = import.meta.env.VITE_API_URL;

    const [translations, setTranslations] = useState({});
    const navigate = useNavigate();

    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpenId(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    useEffect(() => {

        const fetchData = () => {
            fetch(`${API_URL}/controller/treino.php`, {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: 'retornarTreino',
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (!data.success) {
                        console.log(data.message);
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        };

        // chama uma vez imediatamente (opcional, mas recomendado)
        fetchData();

        // chama a cada 1 minuto (60000 ms)
        const interval = setInterval(fetchData, 60000);

        // limpa o intervalo quando o componente desmontar
        return () => clearInterval(interval);

    }, []);

    useEffect(() => {
        if (!user) return;

        fetch(`${API_URL}/controller/metricas.php`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ action: 'streak' })
        })
            .then(res => res.json())
            .then(data => {
                setStreak(data?.streak ?? 0);
                setDiasAcesso(data?.dias_acesso ?? 0);
            })
            .catch(() => {
                setStreak(0);
                setDiasAcesso(0);
            });
    }, [user?.native_language, user?.learning_language, user?.id]);

    // Bolinha de notificação no ícone de Treino com IA quando ainda sobra
    // frase do dia OU pergunta disponível hoje - 'acesso' já cobre os dois
    // casos que importam pro usuário (ainda não fez hoje, ou começou e
    // ficou com uma pendência sem responder), sem precisar de lógica extra
    // aqui (ver comentário em FraseDoDia::getPendente). Free nunca busca
    // (nunca tem acesso mesmo, mostrar "disponível" pra quem é bloqueado
    // seria enganoso) - premium também tem teto diário aqui (diferente da
    // coroa que foi removida), então a bolinha some sozinha depois que ele
    // usa a cota do dia.
    useEffect(() => {
        if (!user?.id || (user.plano !== 1 && user.plano !== 3)) {
            setTreinoIaDisponivel(false);
            return;
        }

        const headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        };

        Promise.all([
            fetch(`${API_URL}/controller/fraseDoDia.php`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ action: 'verificar_acesso' })
            }).then(res => res.json()).catch(() => ({ acesso: false })),
            fetch(`${API_URL}/controller/DailyQuestionController.php?action=verificar_acesso`, {
                headers
            }).then(res => res.json()).catch(() => ({ acesso: false })),
        ]).then(([frase, perguntas]) => {
            setTreinoIaDisponivel(Boolean(frase?.acesso) || Boolean(perguntas?.acesso));
        });
    }, [user?.id, user?.plano, API_URL]);

    const carregarCategorias = () => {
        const nativeLanguage = user?.native_language ?? user?.nativeLanguage ?? user?.idioma_nativo ?? user?.idiomaNativo ?? null;
        const learningLanguage = user?.learning_language ?? user?.learningLanguage ?? user?.idioma_aprendendo ?? user?.idiomaAprendendo ?? null;

        if (!nativeLanguage || !learningLanguage) {
            setCategorias([]);
            setCategoriasLoading(false);
            return;
        }

        setRecarregar(false)
        setCategoriasLoading(true)
        setErroCategorias(false)
        fetch(`${API_URL}/controller/categorias.php`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                action: 'listar-com-quantidade'
            })
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Falha ao carregar categorias (status ${res.status})`);
                }
                return res.json();
            })
            .then(data => {
                const respostaCategorias = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.categorias)
                        ? data.categorias
                        : [];

                const normalizarValor = (valor) => typeof valor === 'string' ? valor.trim().toLowerCase() : valor;

                const categoriasFiltradas = respostaCategorias.filter((cat) => {
                    const idiomaNativoCategoria = cat.idioma_nativo ?? cat.idiomaNativo ?? cat.idioma_nativo_data ?? null;
                    const idiomaAprendendoCategoria = cat.idioma_aprendendo ?? cat.idiomaAprendendo ?? cat.idioma_aprendendo_data ?? null;

                    return normalizarValor(idiomaNativoCategoria) === normalizarValor(nativeLanguage)
                        && normalizarValor(idiomaAprendendoCategoria) === normalizarValor(learningLanguage);
                });

                const categoriasFormatadas = categoriasFiltradas.map((cat) => ({
                    id: cat.id ?? cat.categoria_id ?? cat.categoriaId,
                    categoria: cat.categoria ?? cat.nome,
                    quantidade: cat.total_frases ?? cat.quantidade ?? 0,
                    treinadas: cat.total_treinadas ?? 0,
                    idiomaNativo: cat.idioma_nativo ?? cat.idiomaNativo ?? cat.idioma_nativo_data ?? null,
                    idiomaAprendendo: cat.idioma_aprendendo ?? cat.idiomaAprendendo ?? cat.idioma_aprendendo_data ?? null,
                    categoriaPublica: Number(cat.public ?? cat.categoria_publica ?? 0),
                    gerarFraseDiaria: Number(cat.gerar_frase_diaria ?? 0),
                    fraseNovaId: cat.frase_nova_id ?? null,
                    categoriaDados: cat.categoria_dados ?? cat.categoriaDados ?? null,
                    tipo: cat.tipo ?? null,
                }));

                setCategorias(categoriasFormatadas);
                carregarRevisarPorCategoria(categoriasFormatadas);
            })
            .catch((error) => {
                console.error('Erro ao carregar categorias:', error);
                setErroCategorias(true);
            })
            .finally(() => {
                setCategoriasLoading(false)
            });
    };

    const carregarRevisarPorCategoria = (listaCategorias) => {
        if (!listaCategorias.length) {
            setRevisarPorCategoria({});
            setTotalAprendidas(0);
            return;
        }

        Promise.all(
            listaCategorias.map((cat) =>
                fetch(`${API_URL}/controller/treino.php`, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + localStorage.getItem("token")
                    },
                    body: JSON.stringify({
                        action: 'training_stats',
                        category_id: cat.id
                    })
                })
                    .then(res => res.json())
                    // data.data é indexado pelos 4 estágios do treino, em ordem:
                    // [0]=não conheço [1]=memorizando [2]=em treino [3]=memorizado
                    .then(data => {
                        // Guarda o formato completo que o modal de treino
                        // (ModaTreino.jsx) espera, no cache compartilhado -
                        // como essa busca já roda pra toda categoria assim
                        // que a home carrega, o modal abre com os números
                        // certos na hora, sem o "pisca zerado" de antes.
                        treinoStatsCache.set(cat.id, {
                            learn: data.data?.[0]?.total ?? 0,
                            repeat: (data.data?.[1]?.total ?? 0) + (data.data?.[2]?.total ?? 0),
                            repeat_traine: data.data?.[2]?.total ?? 0,
                            review: data.data?.[3]?.total ?? 0,
                            traine: data.data?.[1]?.segundos_restantes ?? 0
                        });

                        return {
                            id: cat.id,
                            revisar: data.data?.[2]?.total ?? 0,
                            aprendidas: data.data?.[3]?.total ?? 0
                        };
                    })
                    .catch(() => ({ id: cat.id, revisar: 0, aprendidas: 0 }))
            )
        ).then((resultados) => {
            const mapa = {};
            let somaAprendidas = 0;
            resultados.forEach(({ id, revisar, aprendidas }) => {
                mapa[id] = revisar;
                somaAprendidas += aprendidas;
            });
            setRevisarPorCategoria(mapa);
            setTotalAprendidas(somaAprendidas);
        });
    };


    const confirmarExclusao = () => {
        categoriaExcluir(deleteId);
        setOpenModalConfirm(false);
    };

    const categoriaExcluir = async (categoria_id) => {

        try {
            const res = await fetch(`${API_URL}/controller/categorias.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'excluir_categoria',
                    categoria_id: categoria_id,
                })
            });

            const data = await res.json();

            if (!data.success) {
                console.log(data.message);
                return;
            }
            setOpenModalSucesso(true)
            setMsgModalSucesso(translations.deletedSuccess ?? 'Excluído com sucesso')
            carregarCategorias();


        } catch (error) {
            setError(error?.message || "Erro inesperado")
        } finally {

        }
    }

    // useLayoutEffect (em vez de useEffect) para marcar categoriasLoading=true
    // antes do navegador pintar a tela, evitando o flash de conteúdo vazio
    // entre o loading do AuthGate e o loading do Header.
    useLayoutEffect(() => {
        console.log('home ', user)
        if (user) {
            carregarCategorias();
        } else {
            setCategorias([]);
            setCategoriasLoading(false);
        }
    }, [user?.native_language, user?.learning_language, user?.id]);

    function validar(length, id) {

        //if(length > 0)
        navigate(`/frases/${id}`)
    }

    // Guarda em ref (não só no estado do usuário) porque o clique fora
    // (abaixo) precisa de uma checagem síncrona pra não disparar o fetch de
    // dispensa duas vezes quando o próprio clique no botão "adicionar
    // categoria" também aciona o listener global de clique fora.
    const guiaCategoriaDispensadaRef = useRef(false);

    function dispensarGuiaCategoria() {
        if (guiaCategoriaDispensadaRef.current || user?.guia_categoria_dispensado) return;
        guiaCategoriaDispensadaRef.current = true;

        setUser((prev) => prev && { ...prev, guia_categoria_dispensado: true });

        fetch(`${API_URL}/controller/categorias.php`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ action: 'dispensar_guia_primeira_categoria' })
        }).catch((error) => console.error('Erro ao dispensar guia de categoria:', error));
    }

    function abrirAdicionarCategoria() {
        setOpen(true);
        dispensarGuiaCategoria();
    }

    const guiaTreinoDispensadoRef = useRef(false);

    function dispensarGuiaTreino() {
        if (guiaTreinoDispensadoRef.current || user?.guia_treino_dispensado) return;
        guiaTreinoDispensadoRef.current = true;

        setUser((prev) => prev && { ...prev, guia_treino_dispensado: true });

        fetch(`${API_URL}/controller/treino.php`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ action: 'dispensar_guia_treino' })
        }).catch((error) => console.error('Erro ao dispensar guia de treino:', error));
    }

    function irParaPrimeiraCategoriaComConteudo() {
        if (!categoriaComConteudo) return;
        dispensarGuiaTreino();
        setCategoriaId(categoriaComConteudo.id);
        setOpenTreino(true);
    }

    // Some também se o usuário interagir com qualquer outro botão da tela ou
    // clicar fora dele, não só ao clicar exatamente no botão indicado.
    useEffect(() => {
        if (!mostrarGuiaCategoria) return;

        function handleCliqueFora() {
            dispensarGuiaCategoria();
        }

        document.addEventListener('click', handleCliqueFora);
        return () => document.removeEventListener('click', handleCliqueFora);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mostrarGuiaCategoria]);

    function saudacaoPorHorario() {
        const hora = new Date().getHours();
        if (hora < 12) return t("good_morning");
        if (hora < 18) return t("good_afternoon");
        return t("good_evening");
    }

    function verifyPlan(e) {
        // O bloqueio (limitado sem nenhum dos dois recursos disponível, ou
        // free sem acesso a nenhum) fica por conta do próprio ModalIA - uma
        // coroa em cada opção bloqueada, que só abre o modal premium quando
        // o usuário tenta entrar naquela opção específica (ver
        // ModalIA.jsx). Sempre abre o ModalIA aqui, pra qualquer plano -
        // pular direto pro premium pro plano free (como fazia antes) é o
        // mesmo bug já corrigido pro limitado no commit c6041fe, só que
        // nesse branch ninguém tinha mexido ainda.
        setOpenTreinoIA(true)
    }

    async function translateString(phrase) {
        try {
            const res = await fetch(`${API_URL}/controller/libreTranslate.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    phrase: phrase,
                    sourceLang: 'pt',
                    targetLang: user?.native_language
                })
            });

            const data = await res.json();

            if (!data.success) return phrase;

            return data.message;
        } catch (err) {
            return phrase;
        }
    }

    async function translateUIStrings() {
        if (!user) return;
        const map = {
            words: 'palavras',
            train: 'Treino',
            edit: 'Editar',
            delete: 'Excluir',
            addCategory: 'Adicionar categoria',
            confirmDelete: 'Deseja excluir esta categoria?',
            deletedSuccess: 'Excluído com sucesso'
        };

        const entries = Object.entries(map);
        const results = await Promise.all(entries.map(async ([key, val]) => {
            const translated = await translateString(val);
            return [key, translated];
        }));

        const obj = Object.fromEntries(results);
        setTranslations(obj);
    }

    useEffect(() => {
        if (user) translateUIStrings();
    }, [user?.native_language, user?.learning_language, user?.id]);


    // h-full (não h-dvh) de propósito - o Layout (App.jsx) já reserva a
    // altura certa da tela pra essa página numa linha flex-1, contando com a
    // altura real do Header acima. h-dvh aqui reivindicava a tela INTEIRA de
    // novo, além do espaço do Header, sempre cortando a barra de ícones de
    // baixo pela altura exata do Header (bug real reportado - piorou quando
    // o Header cresceu com o indicador de nível).
    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto  from-gray-900 to-gray-800 bg-gradient-to-br">

            <div className="px-4 pt-4">
                <p className="text-lg font-semibold text-white">
                    {saudacaoPorHorario()}, {user?.name?.split(' ')[0]}! 👋
                </p>
                <p className="text-sm text-gray-400">
                    {t("choose_category_subtitle")}
                </p>
            </div>

            {/* Só mostra com pelo menos 1 categoria - sem isso, usuário novo
                via "Categorias: 0" e "Palavras aprendidas: 0" bem na
                primeira tela, antes mesmo de ele criar algo, o que passa
                sensação de vazio em vez de motivar. Também evita o flash de
                "0" por um instante enquanto carrega, antes do número real
                chegar (mesmo raciocínio do skeleton da lista logo abaixo). */}
            {categorias.length > 0 && (
            <div className="grid grid-cols-3 gap-2 px-4 pt-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-2 py-1 flex items-center min-w-0">
                    <div>
                        <BookOpen className="text-emerald-400 me-2" size={26} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] text-gray-400 lowercase truncate">{t("categories")}</p>
                        <p className="text-lg font-bold text-white">{categorias.length}</p>
                        <p className="text-[11px] text-gray-400 truncate">{t("active")}</p>
                    </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-2 py-1 flex items-center min-w-0">
                    <div>
                        <CheckCircle2 className="text-purple-400 me-2" size={26} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] text-gray-400 truncate"> {t("words")}</p>
                        <p className="text-lg font-bold text-white">{totalAprendidas}</p>
                        <p className="text-[11px] text-gray-400 truncate">{t("learned")}</p>
                    </div>
                </div>

                {/* Nível de estudo - único conceito aqui que não existe na
                    tela de Métricas (streak/treino IA/jogos já aparecem
                    melhor lá, ver TermometroEstudo removido). Leva pra
                    Métricas ao tocar, em vez de abrir um modal próprio que
                    só repetiria o que já tem lá. */}
                <button
                    type="button"
                    onClick={() => navigate('/metricas')}
                    className="bg-gray-800/50 border border-gray-700 rounded-xl px-2 py-1 flex items-center min-w-0 text-left"
                >
                    <div>
                        <Star className="text-cyan-400 me-2" size={26} fill="currentColor" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] text-gray-400 truncate">{t("study_level_short_label")}</p>
                        <p className="text-lg font-bold text-white">{nivelEstudo}</p>
                        <p className="text-[11px] text-gray-400 truncate">{t("study_level_card_hint")}</p>
                    </div>
                </button>

                {/* <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 flex items-center">
                    <div>
                        <Flame className="text-orange-400 me-3" size={30} />

                    </div>
                    <div>
                        <p className="text-xs text-gray-400">{t("streak")}</p>
                        <p className="text-xl font-bold text-white">{streak}</p>
                        <p className="text-xs text-gray-400">{t("days")}</p>
                    </div>

                </div> */}
            </div>
            )}

            {(mostrarGuiaAdicionarFrases || mostrarGuiaTreinar) && (
                <div className="px-4 pt-4">
                    <div className="bg-orange-400 border border-white/15 rounded-xl px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold leading-snug">
                                {mostrarGuiaAdicionarFrases ? t("home_next_step_add_phrases") : t("home_next_step_train")}
                            </p>
                        </div>
                        {mostrarGuiaAdicionarFrases ? (
                            <button
                                type="button"
                                onClick={() => navigate(`/frases/${categorias[0].id}`)}
                                className="shrink-0 px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-semibold whitespace-nowrap"
                            >
                                {t("home_next_step_add_phrases_cta")}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={irParaPrimeiraCategoriaComConteudo}
                                className="shrink-0 px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-semibold whitespace-nowrap"
                            >
                                {t("home_next_step_train_cta")}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {categorias.length > 5 && (
                <div className="px-4 pt-4">
                    <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden px-3">
                        <Search className="text-gray-500 shrink-0" width={18} />
                        <input
                            type="text"
                            className="w-full py-2.5 outline-none text-base text-white !bg-transparent placeholder:text-gray-500"
                            placeholder={t("search")}
                            value={buscaCategoria}
                            onChange={(e) => setBuscaCategoria(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {erroCategorias && !categoriasLoading && (
                <div className="px-4 pt-4">
                    <div className="flex flex-col items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                        <AlertTriangle className="text-red-400" size={24} />
                        <p className="text-sm text-gray-300">{t("server_connection_error")}</p>
                        <button
                            type="button"
                            onClick={carregarCategorias}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium transition-colors"
                        >
                            <RefreshCw size={14} />
                            {t("try_again")}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 min-h-0 mt-4 px-4">
                <div className="lista-categoria h-full overflow-y-auto  scrollbar-hide" id="lista-categoria">
                <div className=" items-center justify-center pr-2 ">

                    {/* Skeleton de carregamento - antes a área ficava
                        totalmente vazia (nem spinner, nem esqueleto) entre o
                        mount da Home e a resposta de listar-com-quantidade,
                        dando a impressão de glitch/tela quebrada por um
                        instante, principalmente em rede mais lenta. Só no
                        carregamento INICIAL (categorias ainda vazio) - uma
                        atualização em segundo plano com a lista já
                        preenchida não deve substituir os cards reais por
                        esqueletos. */}
                    {categoriasLoading && categorias.length === 0 && (
                        <div className="animate-pulse" aria-hidden="true">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="flex bg-gray-800/50 border border-gray-700 items-center justify-between py-3 px-4 rounded-xl shadow-lg mb-4"
                                >
                                    <div className="flex items-center gap-3 min-w-0 w-full">
                                        <div className="w-9 h-9 shrink-0 rounded-full bg-gray-700" />
                                        <div className="min-w-0 flex-1">
                                            <div className="h-4 w-24 rounded bg-gray-700" />
                                            <div className="h-3 w-16 rounded bg-gray-700 mt-2" />
                                            <div className="h-1.5 w-32 max-w-full rounded-full bg-gray-700 mt-2" />
                                        </div>
                                    </div>
                                    <div className="h-7 w-16 rounded-full bg-gray-700 shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Item */}
                    {categorias
                        .filter((item) => item.categoria?.toLowerCase().includes(buscaCategoria.trim().toLowerCase()))
                        .map((item, index) => {
                        const paraRevisar = revisarPorCategoria[item.id] ?? 0;
                        const progresso = item.quantidade > 0
                            ? Math.min(100, Math.round((paraRevisar / item.quantidade) * 100))
                            : 0;

                        const temFraseNova = item.fraseNovaId && !frasesIaVistas.has(item.fraseNovaId);

                        return (
                            <div key={item.id} onClick={() => validar(item.quantidade, item.id)} className={`relative flex bg-gray-800/50   border border-gray-700 items-center justify-between py-3 px-4  rounded-xl  shadow-lg mb-4 ${temFraseNova ? "mt-3" : ""}`}>
                                {temFraseNova && (
                                    // mt-3 no card (acima) reserva espaço pra esse selo não
                                    // encostar/ficar apertado contra o card anterior - com
                                    // vários cards seguidos tendo frase nova, só o mb-4 padrão
                                    // entre eles não deixava respiro nenhum (reportado:
                                    // "ficou tudo muito apertado ali").
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-purple-500 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-lg animate-pulse whitespace-nowrap">
                                        <Sparkles size={11} />
                                        {t("new_phrase_available")}
                                    </span>
                                )}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-white font-semibold text-lg ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
                                        {item.categoria?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base text-white font-medium truncate">
                                            {truncarNomeCategoria(item.categoria)}
                                        </p>
                                        <div className="flex flex-col text-xs text-gray-400">
                                            <span>{item.quantidade} {t("words")}</span>
                                            <span className="text-emerald-400">{paraRevisar} {t("to_review")}</span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 w-32 max-w-full rounded-full bg-gray-700 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-emerald-400 transition-all"
                                                style={{ width: `${progresso}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 relative z-60 shrink-0">
                                    <button
                                        className="shadow-md px-3 py-1 text-sm rounded-full bg-[#4cb8c4] text-white hover:opacity-90"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispensarGuiaTreino();
                                            setCategoriaId(item.id);
                                            setOpenTreino(true);
                                        }}
                                    >
                                        {t("training")}
                                    </button>

                                    {/* Botão dos 3 pontinhos - ícone de verdade
                                        (lucide-react), não mais o caractere
                                        "⋮" cru estilizado como texto grande,
                                        inconsistente com o resto dos ícones
                                        da interface. */}
                                    <button
                                        className="text-slate-300 p-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === item.id ? null : item.id);
                                        }}
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {/* Menu */}
                                    {menuOpenId === item.id && (
                                        <div
                                            ref={menuRef}
                                            className="absolute right-0 top-10 bg-gray-800   border border-gray-700 shadow-lg rounded-lg p-2 w-32 z-40"
                                        >
                                            <button
                                                className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCategoriaClick(item.categoria);
                                                    setCategoriaPublicaClick(item.categoriaPublica);
                                                    setCategoriaGerarFraseDiariaClick(item.gerarFraseDiaria);
                                                    setOpenCategoriaEditar(true);
                                                    setCategoriaId(item.id);
                                                    setMenuOpenId(false);
                                                }}
                                            >
                                                {t("edit")}
                                            </button>

                                            <button
                                                className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteId(item.id);
                                                    setMsgModalConfirm(translations.confirmDelete ?? 'Deseja excluir esta categoria?');
                                                    setOpenModalConfirm(true);
                                                    setMenuOpenId(false);

                                                }}
                                            >
                                                {t("delete")}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Item */}

                </div>

            </div>
            </div>
            {/* Fica FORA da barra de baixo (abaixo) de propósito - essa barra
                usa mask-image pra dar o efeito de fade, e mask-image recorta
                a renderização de TODOS os descendentes, inclusive os com
                position:fixed, mesmo saindo do fluxo normal. Um balão fixed
                dentro dela ficava com metade cortada pela máscara. */}
            {mostrarGuiaCategoria && (
                <div className="fixed bottom-40 left-1/2 -translate-x-1/2 w-52 max-w-[85vw] z-20 pointer-events-none">
                    <div className="animate-gentle-bounce">
                        {/* Mesma paleta do balão de HintBalloon.jsx (usado em
                            Frases.jsx) - gradiente âmbar/laranja/vermelho com
                            borda branca sutil, em vez do laranja sólido de
                            antes. */}
                        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border border-white/15 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg text-center">
                            {t("first_category_hint")}
                        </div>
                        <div className="w-3 h-3 bg-orange-500 rotate-45 mx-auto -mt-1.5" />
                    </div>
                </div>
            )}

            <div
                // pb-4 (antes pb-16) - com a altura da Home corrigida (ver commit
                // sobre h-full/h-dvh), essa barra passou a ficar de fato encostada
                // no fim de verdade da tela, e os 64px de padding que antes
                // ajudavam a compensar o cálculo errado de altura viraram um vão
                // vazio visível entre os ícones e a barra de navegação do Android
                // (bug real reportado, confirmado inspecionando o app de verdade
                // via chrome://inspect).
                className="relative sticky z-10 bottom-0 text-center w-full justify-items-center justify-center items-center pb-4"
                style={{
                    backgroundImage: "none",
                    boxShadow: "none",
                    outline: "none",
                    borderTop: "0px transparent",
                    paddingTop: "60px",
                    marginTop: "-60px",
                    backgroundColor: "rgb(17, 24, 39)",
                    // Pontos em px (não %) - o fade existe só pra suavizar a
                    // extensão de 60px criada pelo paddingTop/marginTop acima
                    // (onde o conteúdo da lista passa por trás antes da barra
                    // "de verdade" começar). Com % relativo à altura TOTAL do
                    // elemento (que inclui o botão "Adicionar categoria" + a
                    // fileira de ícones), o fade acabava cobrindo boa parte do
                    // próprio botão, deixando-o parcialmente transparente -
                    // bug real reportado ("botão parece estar sob uma
                    // sombra"). Com calc(100% - 60px), a opacidade plena
                    // sempre cobre exatamente até o fim da extensão de 60px,
                    // não importa a altura total (conteúdo real nunca entra
                    // na zona de fade).
                    WebkitMaskImage: "linear-gradient(to top, black 0, black calc(100% - 60px), transparent 100%)",
                    maskImage: "linear-gradient(to top, black 0, black calc(100% - 60px), transparent 100%)",
                }}
            >

                <div className="relative inline-block w-full px-4">
                    <button className={`
                        flex items-center justify-center gap-2
                        w-full
                        mb-4
                        py-3
                        rounded-full
                        bg-gradient-to-r from-blue-500 to-emerald-500 hover:opacity-90
                        text-white
                        font-medium
                       text-lg
                        transition
                        ${mostrarGuiaCategoria ? "animate-pulse-glow-ring" : ""}
                        `} onClick={abrirAdicionarCategoria}>
                        <Plus size={20} />
                        {t("add_category")}
                    </button>
                </div>

                <div className=" w-full ">
                    <div className='flex  left-0   w-full justify-around py-2 '>
                        <button type="button" className="flex flex-col items-center gap-1">
                            <HomeIcon width={26} height={26} className='text-violet-400' />
                            <span className="w-1 h-1 rounded-full bg-violet-400" />
                        </button>

                        <button type="button" onClick={() => navigate('/jogos')} className="flex flex-col items-center gap-1">
                            <Gamepad2 width={26} height={26} className='text-blue-400' />
                        </button>

                        <button type="button" onClick={() => navigate('/metricas')} className="flex flex-col items-center gap-1">
                            <BarChart3 className='text-green-400' width={26} height={26} />
                        </button>

                        <button type="button" onClick={() => verifyPlan()} className="relative flex flex-col items-center gap-1">
                            <Bot width={28} height={28} className="text-orange-400" />
                            {/* Coroa só pro free (nunca teve acesso, precisa virar
                                premium pra usar) - cota diária esgotada (limitado)
                                não mostra mais coroa nem abre o modal completo de
                                premium, só o modal enxuto dentro de Perguntas.jsx. */}
                            {user?.plano !== 1 && user?.plano !== 3 && (
                                <Crown className="absolute -top-1 -right-2 w-4 h-4 text-yellow-400" />
                            )}
                            {/* Bolinha de notificação - ainda sobra frase do dia ou
                                pergunta disponível hoje (nunca junto com a coroa,
                                planos são mutuamente exclusivos nas duas condições). */}
                            {treinoIaDisponivel && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border border-gray-900" />
                                </span>
                            )}
                        </button>
                    </div>
                </div>

            </div>
            <ModalCategorias
                setOpen={setOpen}
                open={open}
                onOpenModalSucesso={(msgSucesso) => {
                    setOpen(false);
                    setOpenModalSucesso(true);
                    setMsgModalSucesso(msgSucesso);
                }}
                onSuccess={carregarCategorias}
                onOpenPremium={(motivo) => {
                    setOpen(false);
                    setMotivoPremium(motivo ?? "categorias");
                    setIsPremiumModalOpen(true);
                }}
                onOpenLimiteDiario={(mensagem) => {
                    setOpen(false);
                    setMensagemLimite(mensagem);
                    setLimiteModalOpen(true);
                }}
            />
            <ModalCategoriasEditar
                open={openCategoriaEditar}
                setOpenCategoriaEditar={setOpenCategoriaEditar}
                categoriaEditar={categoriaClick}
                categoriaIdEditar={categoriaId}
                categoriaPublicaEditar={categoriaPublicaClick}
                categoriaGerarFraseDiariaEditar={categoriaGerarFraseDiariaClick}
                isPremium={user?.plano === 1}
                onSuccess={carregarCategorias}

                onOpenPremium={(motivo) => {
                    setOpenCategoriaEditar(false);
                    setMotivoPremium(motivo ?? "frase_diaria_categoria");
                    setIsPremiumModalOpen(true);
                }}

                onOpenModalSucesso={(msgSucesso) => {
                    setOpenModalSucesso(true);
                    setMsgModalSucesso(msgSucesso);
                    setOpenCategoriaEditar(false);
                    setRecarregar(true)
                }}
            />
            <ModalTreino
                openTreino={openTreino}
                onClose={() => setOpenTreino(false)}

                onOpenPremium={() => {
                    setOpenTreino(false);
                    setOpenTreinoAdvinhar(false);
                    setMotivoPremium(null);
                    setIsPremiumModalOpen(true);
                }}

                onOpenAdvinhar={() => {
                    setOpenTreino(false);
                    setOpenTreinoAdvinhar(true);
                    setIsPremiumModalOpen(false);
                }}

                onOpenIA={() => {
                    setOpenTreino(false);
                    setOpenTreinoIA(true);
                }}

                categoriaId={categoriaId}
            />

            <ModalTreinoAdvinhar categoriaId={categoriaId} setOpenTreinoAdvinhar={setOpenTreinoAdvinhar} openTreinoAdvinhar={openTreinoAdvinhar} />
            <ModalIA setOpenTreinoIA={setOpenTreinoIA} openTreinoIA={openTreinoIA} />
            <ModalSucesso msg={msgModalSucesso} openModalSucesso={openModalSucesso} setOpenModalSucesso={setOpenModalSucesso} />
            <PremiumModal isOpen={isPremiumModalOpen} setIsPremiumModalOpen={setIsPremiumModalOpen} onClose={() => { setIsPremiumModalOpen(false); setMotivoPremium(null); }} motivo={motivoPremium} />
            <LimiteDiarioModal
                isOpen={limiteModalOpen}
                mensagem={mensagemLimite}
                onClose={() => setLimiteModalOpen(false)}
                // Categoria por IA tem teto diário pros dois planos (premium
                // e limitado) - quem já é premium não tem pra onde fazer
                // upsell, então some com o botão "Assinar Premium" nesse caso.
                mostrarCtaPremium={user?.plano !== 1}
                onAssinarPremium={() => {
                    setLimiteModalOpen(false);
                    setMotivoPremium("categoria_ia");
                    setIsPremiumModalOpen(true);
                }}
            />
            <ModalConfirm setOpenModalConfirm={setOpenModalConfirm} openModalConfirm={modalConfirm} msg={msgModalConfirm} onConfirm={confirmarExclusao} />
        </div>
    )
}