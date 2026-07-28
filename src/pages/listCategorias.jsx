import { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import ModalCategorias from '../components/ModalCategorias';
import ModalTreino from '../components/ModaTreino';
import ModalTreinoAdvinhar from "../components/ModalTreinoAdvinhar";
import ModalIA from '../components/ModalIA';
import ModalSucesso from '../components/ModalSucesso';
import PremiumModal from '../components/PremiumModal'
import { useAuth } from "../context/AuthContext";
import ModalIncorporarFrases from '../components/ModalIncorporarFrases'
import { useTranslation } from "react-i18next";


import { BookOpen,Search,Filter,Loader2,Home,Settings,BarChart3,UserRound,ChevronDown,FolderPlus } from "lucide-react";

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

export default function ListCategoria() {
    const { t } = useTranslation();
    const { user, setUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [openIncorporar, setOpenIncorporar] = useState(false)
    const [categorias, setCategorias] = useState([]);
    const [openTreinoAdvinhar, setOpenTreinoAdvinhar] = useState(false)
    const [openTreinoIA, setOpenTreinoIA] = useState(false)
    const [openModalSucesso, setOpenModalSucesso] = useState(false)
    const [categoriaId, setCategoriaId] = useState(0)
    const [msgModalSucesso, setMsgModalSucesso] = useState('')
    const [frase, openFrase] = useState('')
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [contador, setContador] = useState(0);
    const [textoBusca, setTextoBusca] = useState("")
    const [categoriaSelecionada, setCategoriaSelecionada] = useState("")
    const API_URL = import.meta.env.VITE_API_URL;

    const navigate = useNavigate();

    const carregarCategorias = async (pageAtual = 1, reset = false) => {
        if (!reset && (loading || !hasMore)) return;

        setLoading(true);

        if (reset) {
            // Some a listagem antiga na hora, sem esperar a resposta do novo idioma
            setCategorias([]);
        }

        try {
            const res = await fetch(`${API_URL}/controller/categorias.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'get_all',
                    page: pageAtual
                })
            });

            const data = await res.json();

            const categoriasFormatadas = data.map(cat => ({
                id: cat.id,
                categoria: cat.categoria,
                quantidade: cat.total_frases,
                usuario: cat.usuario
            }));

            // 🔥 concatena (não sobrescreve), exceto ao trocar de idioma
            setCategorias(prev => reset ? categoriasFormatadas : [...prev, ...categoriasFormatadas]);

            // 🔥 controle de fim
            setHasMore(categoriasFormatadas.length >= 20);

            setPage(pageAtual);
        } finally {
            setLoading(false);
        }
    };

    function adicionar(id) {

        fetch(`${API_URL}/controller/categorias.php`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                action: 'adicionar_compartilhado',
                category_id: id
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'Categoria já existe')
                    setOpenIncorporar(true)

                setOpenModalSucesso(true)


                if (data.inseridas === 0) {
                    setMsgModalSucesso(t("category_phrases_already_exist"))
                }

                if (data.inseridas > 0) {
                    setMsgModalSucesso(t("added"))
                }

                setContador(contador + 1);

            })
            .finally(() => {
                setLoading(false);
            });

    }

    useEffect(() => {
        carregarCategorias(1, true);
    }, [user?.learning_language]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const fullHeight = document.documentElement.scrollHeight;

            // Quando chegar perto do final
            if (scrollTop + windowHeight >= fullHeight - 100) {
                carregarCategorias(page + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [page, loading, hasMore]);

    function validar(length, id) {

        //if(length > 0)
        navigate(`/frasesgeral/${id}`)
    }

    const buscaNormalizada = textoBusca.trim().toLowerCase();

    const nomesCategoriasDisponiveis = [...new Set(
        categorias.map(item => item.categoria).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    const categoriasFiltradas = categorias.filter(item => {
        const combinaBusca = !buscaNormalizada
            || item.categoria?.toLowerCase().includes(buscaNormalizada)
            || item.usuario?.toLowerCase().includes(buscaNormalizada);

        const combinaSelecao = !categoriaSelecionada || item.categoria === categoriaSelecionada;

        return combinaBusca && combinaSelecao;
    });


    return (
        <div className="h-[calc(100dvh-64px)] flex flex-col max-w-7xl mx-auto   from-gray-900 to-gray-800 bg-gradient-to-br">

            {/* HEADER */}
            {/* <div className="relative  mb-4 text-left mt-4">
                <div
                    className=" cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-2xl text-white"></i>
                </div>
            </div> */}
               <div className="sticky top-0 z-10 px-6 py-4">

                    <h1 className="flex items-center gap-3 text-xl font-semibold text-white mb-8">
                        <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#4cb8c4]/20 to-[#085078]/20 text-[#4cb8c4]">
                            <FolderPlus className="w-5 h-5" />
                        </span>
                        {t("add_category")}
                    </h1>

                    <div className="mb-3 flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm px-4 py-3 shadow-lg transition focus-within:border-[#4cb8c4] focus-within:ring-2 focus-within:ring-[#4cb8c4]/30">
                        <Search width={18} className='text-gray-400 shrink-0' />

                        <input
                            type="text"
                            className="w-full bg-transparent outline-none text-white text-base placeholder:text-gray-500"
                            placeholder={t("search")}
                            value={textoBusca}
                            onChange={(e) => {
                                setTextoBusca(e.target.value)
                            }}
                        />
                    </div>

                    <div className='mb-2 relative'>
                        <select
                            className="w-full appearance-none rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm px-4 py-3 pr-10 text-base text-white shadow-lg outline-none transition focus:border-[#4cb8c4] focus:ring-2 focus:ring-[#4cb8c4]/30"
                            value={categoriaSelecionada}
                            onChange={(e) => setCategoriaSelecionada(e.target.value)}
                        >
                            <option value="" className="bg-gray-800">{t("all_categories")}</option>
                            {nomesCategoriasDisponiveis.map((nome) => (
                                <option key={nome} value={nome} className="bg-gray-800">{nome}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                        {/* <div className="cursor-pointer flex justify-end mb-4">
                            <Filter className="text-white mt-2" width={15} />
                        </div> */}

                    {loading && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
                        </div>
                    )}
            
                </div>

            <div className="lista-categoria  flex-1 overflow-y-auto pb-[140px] scrollbar-hide " id="lista-categoria">
             

                <div className="px-6 items-center justify-center">

                    {/* Item */}
                    {categoriasFiltradas.map((item, index) => (
                        <div key={item.id} onClick={() => validar(item.quantidade, item.id)} className="flex bg-gray-800/50 backdrop-blur-sm items-center justify-between py-3 px-4  rounded-xl border border-gray-700 shadow-lg mb-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`flex items-center justify-center w-11 h-11 shrink-0 rounded-full text-white font-semibold text-lg ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
                                    {item.categoria?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg text-white font-medium truncate">
                                        {item.categoria}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs py-0.5  rounded-full  text-gray-300 ">
                                            {item.quantidade} {t("words")}
                                        </span>
                                    </div>
                                    {item.usuario && (
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 whitespace-nowrap">
                                            <UserRound size={12} className="text-blue-400 shrink-0" />
                                            <span>{t("shared_by")}</span>
                                            <span className="text-yellow-500 font-medium">{item.usuario.split(' ')[0]}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <button className="shadow-md px-4 py-1 text-md font-medium rounded-full bg-emerald-500 text-white hover:bg-emerald-600 "
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        adicionar(item.id);

                                    }}>
                                    {t("add")}
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Item */}

                </div>

            </div>



            <ModalIA setOpenTreinoIA={setOpenTreinoIA} openTreinoIA={openTreinoIA} />
            <ModalSucesso msg={msgModalSucesso} openModalSucesso={openModalSucesso} setOpenModalSucesso={setOpenModalSucesso} />
            <ModalIncorporarFrases openIncorporar={openIncorporar} setOpenIncorporar={setOpenIncorporar} />

            <div className="sticky inset-x-0 bottom-0 z-10 text-center w-full justify-items-center justify-center items-center   ">


                <div className=" w-full ">
                    <div className='flex  left-0   w-full justify-center py-2 '>
                        <button type="button" onClick={() => navigate('/home')}>
                            <div className=' p-3 flex justify-center items-center'>
                                <Home width={38} height={38} className='text-[#4cb8c4]' />
                            </div>
                        </button>
                        <button type="button" onClick={() => navigate('/configuracoes')}>
                            <div className=' p-3 flex justify-center items-center'>
                                <Settings width={38} height={38} className='text-[#4cb8c4]' />
                            </div>
                        </button>
                        <button type="button" onClick={() => navigate('/metricas')}>
                            <div className=' p-3 flex justify-center items-center'>
                                <BarChart3 className='text-[#4cb8c4]' width={38} height={38} />

                                {/*  <BookOpen className='text-white' /> */}
                                {/* <img src={imgEstatistica} alt="" width={40} /> */}
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}