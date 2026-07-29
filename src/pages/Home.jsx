import { useState, useEffect, useLayoutEffect, useRef, use } from 'react'
import { useNavigate } from "react-router-dom";
import ModalCategorias from '../components/ModalCategorias';
import ModalCategoriasEditar from '../components/ModalCategoriasEditar'
import ModalTreino from '../components/ModaTreino';
import ModalTreinoAdvinhar from "../components/ModalTreinoAdvinhar";
import ModalIA from '../components/ModalIA';
import ModalSucesso from '../components/ModalSucesso';
import PremiumModal from '../components/PremiumModal'
import ModalConfirm from '../components/ModalConfirm';
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import usePremiumLimitListener from "../hooks/usePremiumLimitListener";


import { BookOpen, BarChart3, Settings, Play, Crown, Bot, Plus } from "lucide-react";

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

export default function Home() {
    const { user, setUser, setCategoriasLoading } = useAuth();
    const [open, setOpen] = useState(false);
    const [mostrarGuiaCategoria, setMostrarGuiaCategoria] = useState(
        () => localStorage.getItem("zaldemy_guia_add_categoria_pendente") === "1"
    );
    const [openCategoriaEditar, setOpenCategoriaEditar] = useState(false);
    const [openTreino, setOpenTreino] = useState(false)
    const [categorias, setCategorias] = useState([]);
    const [revisarPorCategoria, setRevisarPorCategoria] = useState({});
    const [openTreinoAdvinhar, setOpenTreinoAdvinhar] = useState(false)
    const [openTreinoIA, setOpenTreinoIA] = useState(false)
    const [openModalSucesso, setOpenModalSucesso] = useState(false)
    const [categoriaId, setCategoriaId] = useState(0)
    const [categoriaClick, setCategoriaClick] = useState('')
    const [categoriaPublicaClick, setCategoriaPublicaClick] = useState(0)
    const [msgModalSucesso, setMsgModalSucesso] = useState('')
    const [frase, openFrase] = useState('')
    const [error, setError] = useState('')
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [recarregar, setRecarregar] = useState(false)
    const [modalConfirm, setOpenModalConfirm] = useState(false)
    const [msgModalConfirm, setMsgModalConfirm] = useState('')
    const [deleteId, setDeleteId] = useState(0)
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
                    idiomaNativo: cat.idioma_nativo ?? cat.idiomaNativo ?? cat.idioma_nativo_data ?? null,
                    idiomaAprendendo: cat.idioma_aprendendo ?? cat.idiomaAprendendo ?? cat.idioma_aprendendo_data ?? null,
                    categoriaPublica: Number(cat.public ?? cat.categoria_publica ?? 0),
                    categoriaDados: cat.categoria_dados ?? cat.categoriaDados ?? null,
                }));

                setCategorias(categoriasFormatadas);
                carregarRevisarPorCategoria(categoriasFormatadas);
            })
            .catch((error) => {
                console.error('Erro ao carregar categorias:', error);
            })
            .finally(() => {
                setCategoriasLoading(false)
            });
    };

    const carregarRevisarPorCategoria = (listaCategorias) => {
        if (!listaCategorias.length) {
            setRevisarPorCategoria({});
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
                    .then(data => ({ id: cat.id, revisar: data.data?.[3]?.total ?? 0 }))
                    .catch(() => ({ id: cat.id, revisar: 0 }))
            )
        ).then((resultados) => {
            const mapa = {};
            resultados.forEach(({ id, revisar }) => {
                mapa[id] = revisar;
            });
            setRevisarPorCategoria(mapa);
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
            setTimeout(() => {
                setOpenModalSucesso(false);
            }, 2500); // 3 segundos
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

    function saudacaoPorHorario() {
        const hora = new Date().getHours();
        if (hora < 12) return t("good_morning");
        if (hora < 18) return t("good_afternoon");
        return t("good_evening");
    }

    function verifyPlan(e) {
        if (user.plano === 1) {
            setOpenTreinoIA(true)
            return
        }
        setMotivoPremium(null)
        setIsPremiumModalOpen(true)
        // navigate('/premiumplan');

    }

    usePremiumLimitListener((motivo) => {
        setMotivoPremium(motivo);
        setIsPremiumModalOpen(true);
    });

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


    return (
        <div className="h-dvh flex flex-col max-w-7xl mx-auto  from-gray-900 to-gray-800 bg-gradient-to-br">

            <div className="px-4 pt-4">
                <p className="text-lg font-semibold text-white">
                    {saudacaoPorHorario()}, {user?.name?.split(' ')[0]}! 👋
                </p>
                <p className="text-sm text-gray-400">
                    {t("choose_category_subtitle")}
                </p>
            </div>

            <div className="lista-categoria flex-1 overflow-y-auto py-4 scrollbar-hide mt-4" id="lista-categoria">
                <div className=" items-center justify-center px-4 ">

                    {/* Item */}
                    {categorias.map((item, index) => {
                        const paraRevisar = revisarPorCategoria[item.id] ?? 0;
                        const progresso = item.quantidade > 0
                            ? Math.min(100, Math.round((paraRevisar / item.quantidade) * 100))
                            : 0;

                        return (
                        <div key={item.id} onClick={() => validar(item.quantidade, item.id)} className="flex bg-gray-800/50   border border-gray-700 items-center justify-between py-3 px-4  rounded-xl  shadow-lg mb-4 ">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`flex items-center justify-center w-11 h-11 shrink-0 rounded-full text-white font-semibold text-lg ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
                                    {item.categoria?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg text-white font-medium truncate">
                                        {item.categoria}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <span>{item.quantidade} {t("words")}</span>
                                        <span>•</span>
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
                                    className="shadow-md px-4 py-1 text-md  rounded-full bg-[#4cb8c4] text-white hover:opacity-90"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCategoriaId(item.id);
                                        setOpenTreino(true);
                                    }}
                                >
                                    {t("training")}
                                </button>

                                {/* Botão dos 3 pontinhos */}
                                <button
                                    className="text-slate-300 text-3xl"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(menuOpenId === item.id ? null : item.id);
                                    }}
                                >
                                    ⋮
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
            <div className="relative sticky  z-10 bottom-0 text-center w-full justify-items-center justify-center items-center pt-4 pb-16">

                {mostrarGuiaCategoria && (
                    <div className="fixed bottom-40 left-1/2 -translate-x-1/2 w-52 max-w-[85vw] z-20 pointer-events-none">
                        <div className="animate-gentle-bounce">
                            <div className="bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg text-center">
                                {t("first_category_hint")}
                            </div>
                            <div className="w-3 h-3 bg-orange-600 rotate-45 mx-auto -mt-1.5" />
                        </div>
                    </div>
                )}

                <div className="relative inline-block">
                    <button className={`
                        flex items-center justify-center gap-2
                        px-6
                        mb-4
                        py-3
                        rounded-full
                        bg-[#4cb8c4] hover:opacity-90
                        text-white
                        font-medium
                       text-lg
                        transition
                        ${mostrarGuiaCategoria ? "animate-pulse-glow-ring" : ""}
                        `} onClick={() => {
                        setOpen(true);
                        if (mostrarGuiaCategoria) {
                            setMostrarGuiaCategoria(false);
                            localStorage.removeItem("zaldemy_guia_add_categoria_pendente");
                        }
                    }}>
                        <Plus size={20} />
                        {t("add_category")}
                    </button>
                </div>

                <div className=" w-full ">
                    <div className='flex  left-0   w-full justify-center py-2 '>
                        {/*  <a href="/leituradigital"> <div className='bg-blue-400 rounded-full p-3 flex justify-center items-center'> */}

                        <button type="button" onClick={() => navigate('/configuracoes')}>
                            <div className=' p-3 flex justify-center items-center'>
                                {/*  <BookOpen className='text-white' /> */}
                                <Settings width={38} height={38} className='text-violet-400' />
                                {/* <img src={imgSetting} alt="" width={40} /> */}
                            </div>
                        </button>
                        {/* <button type="button" onClick={() => navigate('/leituradigital')} >
                            <div className=' p-3 flex justify-center items-center'>
                                <BookOpen width={38} height={38} className='text-green-600' />

                            </div>
                        </button> */}
                        <button type="button" onClick={() => navigate('/metricas')}>
                            <div className=' p-3 flex justify-center items-center'>
                                <BarChart3 className='text-amber-400' width={38} height={38} />

                                {/*  <BookOpen className='text-white' /> */}
                                {/* <img src={imgEstatistica} alt="" width={40} /> */}
                            </div>
                        </button>
                        {/*<a href="/videos">
                            <div className=' p-3 flex justify-center items-center'>
                                <Play className='text-red-500 ' width={38} height={38} />
                                
                            </div>
                        </a>*/}
                        {/*<button onClick={(e) => { verifyPlan() }}>
                            <div className=' p-3 flex justify-center items-center'>
                                <Bot width={38} height={38} className="text-yellow-500" />
                               
                            </div>
                        </button>*/}
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
                setOpenModalSucesso={setOpenModalSucesso}
                onSuccess={carregarCategorias}
                onOpenPremium={() => {
                    setOpen(false);
                    setMotivoPremium("categorias");
                    setIsPremiumModalOpen(true);
                }}
            />
            <ModalCategoriasEditar
                open={openCategoriaEditar}
                setOpenCategoriaEditar={setOpenCategoriaEditar}
                categoriaEditar={categoriaClick}
                categoriaIdEditar={categoriaId}
                categoriaPublicaEditar={categoriaPublicaClick}
                onSuccess={carregarCategorias}


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
            <ModalConfirm setOpenModalConfirm={setOpenModalConfirm} openModalConfirm={modalConfirm} msg={msgModalConfirm} onConfirm={confirmarExclusao} />
        </div>
    )
}