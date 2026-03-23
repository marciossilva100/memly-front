import imgPlus from '../assets/img/plus.png'
import imgBook from '../assets/img/book.png'
import imgSetting from '../assets/img/setting.png'
import imgEstatistica from '../assets/img/estatistic.png'
import imgPlay from '../assets/img/play.png'

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


import { BookOpen,Search,Filter } from "lucide-react";


export default function ListCategoria() {
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
    const API_URL = import.meta.env.VITE_API_URL;

    const navigate = useNavigate();

    const carregarCategorias = (pageAtual = 1) => {
        if (loading || !hasMore) return;

        setLoading(true);

        fetch(`${API_URL}/controller/categorias.php`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                action: 'get_all',
                page: pageAtual
            })
        })
            .then(res => res.json())
            .then(data => {

                const categoriasFormatadas = data.map(cat => ({
                    id: cat.id,
                    categoria: cat.categoria,
                    quantidade: cat.total_frases
                }));

                // 🔥 concatena (não sobrescreve)
                setCategorias(prev => [...prev, ...categoriasFormatadas]);

                // 🔥 controle de fim
                if (categoriasFormatadas.length < 20) {
                    setHasMore(false);
                }

                setPage(pageAtual);

            })
            .finally(() => {
                setLoading(false);
            });
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
                    setMsgModalSucesso("Categoria e frases já existem em sua lista.")
                }

                if (data.inseridas > 0) {
                    setMsgModalSucesso("Adicionado")
                }

                setContador(contador + 1);

            })
            .finally(() => {
                setLoading(false);
            });

    }

    useEffect(() => {
        carregarCategorias(1);
    }, []);

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


    return (
        <div className="h-dvh flex flex-col max-w-7xl mx-auto  px-6 from-gray-900 to-gray-800 bg-gradient-to-br">

            {/* HEADER */}
            <div className="relative  mb-4 text-left mt-4">
                <div
                    className=" cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-2xl text-white"></i>
                </div>
            </div>

            <div className="lista-categoria  flex-1 overflow-y-auto pb-4 scrollbar-hide" id="lista-categoria">
                <div className="flex-1 flex flex-col">

                    <div >
                        <div className="flex items-center border rounded-md overflow-hidden ">
                            <span className="px-3 text-gray-500">
                                <Search width={20} className='text-white' />
                            </span>

                            <input
                                type="email"
                                className="w-full px-3 py-2 outline-none text-white text-lg bg-gray-800/50 backdrop-blur-sm"
                                placeholder="Buscar"
                                value={textoBusca}
                                onChange={(e) => {
                                    setTextoBusca(e.target.value)
                                    setErro('')
                                }}
                            />
                        </div>
                    </div>
                    
                        <div className="cursor-pointer flex justify-end mb-4">
                            <Filter className="text-white mt-2" width={15} />
                        </div>
                    
                    {loading && <div className="h-screen flex items-center justify-center">
                        Carregando...
                    </div>}
            
                </div>

                <div className=" items-center justify-center">

                    {/* Item */}
                    {categorias.map((item) => (
                        <div key={item.id} onClick={() => validar(item.quantidade, item.id)} className="flex bg-gray-800/50 backdrop-blur-sm items-center justify-between py-3 px-4  rounded-xl border border-gray-700 shadow-lg mb-4">
                            <div>

                                <p className="text-lg text-white mt-1 font-medium">
                                    {item.categoria}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs py-0.5  rounded-full  text-gray-300 ">
                                        {item.quantidade} palavras
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="shadow-md px-4 py-1 text-md font-medium rounded-full bg-blue-400 text-white hover:bg-slate-600 "
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        adicionar(item.id);

                                    }}>
                                    Adicionar
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
        </div>
    )
}