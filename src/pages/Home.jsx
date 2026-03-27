import imgPlus from '../assets/img/plus.png'
import imgBook from '../assets/img/book.png'
import imgSetting from '../assets/img/setting.png'
import imgEstatistica from '../assets/img/estatistic.png'
import imgPlay from '../assets/img/play.png'

import { useState, useEffect, useRef, use } from 'react'
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


import { BookOpen, BarChart3, Settings, Play, Crown, Bot } from "lucide-react";


export default function Home() {
    const { user, setUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [openCategoriaEditar, setOpenCategoriaEditar] = useState(false);
    const [openTreino, setOpenTreino] = useState(false)
    const [categorias, setCategorias] = useState([]);
    const [openTreinoAdvinhar, setOpenTreinoAdvinhar] = useState(false)
    const [openTreinoIA, setOpenTreinoIA] = useState(false)
    const [openModalSucesso, setOpenModalSucesso] = useState(false)
    const [categoriaId, setCategoriaId] = useState(0)
    const [categoriaClick, setCategoriaClick] = useState('')
    const [msgModalSucesso, setMsgModalSucesso] = useState('')
    const [frase, openFrase] = useState('')
    const [error, setError] = useState('')
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [recarregar, setRecarregar] = useState(false)
    const [modalConfirm, setOpenModalConfirm] = useState(false)
    const [msgModalConfirm, setMsgModalConfirm] = useState('')
    const [deleteId, setDeleteId] = useState(0)
    const API_URL = import.meta.env.VITE_API_URL;

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
        setRecarregar(false)
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
            .then(res => res.json())
            .then(data => {

                const categoriasFormatadas = data.map(cat => ({
                    id: cat.id,
                    categoria: cat.categoria,
                    quantidade: cat.total_frases
                }));

                setCategorias(categoriasFormatadas);

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
            setMsgModalSucesso('Excluído com sucesso')
            setTimeout(() => {
                setOpenModalSucesso(false);
            }, 2500); // 3 segundos
            carregarCategorias();


        } catch (error) {
            setError(error?.message || "Erro inesperado")
        } finally {

        }
    }

    useEffect(() => {
        console.log('home ', user)
        carregarCategorias();
    }, []);

    function validar(length, id) {

        //if(length > 0)
        navigate(`/frases/${id}`)
    }

    function verifyPlan(e) {
        if (user.plano === 1) {
            setOpenTreinoIA(true)
            return
        }
        setIsPremiumModalOpen(true)
        // navigate('/premiumplan');

    }


    return (
        <div className="h-dvh flex flex-col max-w-7xl mx-auto  from-gray-900 to-gray-800 bg-gradient-to-br">

            <div className="lista-categoria flex-1 overflow-y-auto py-4 scrollbar-hide " id="lista-categoria">
                <div className=" items-center justify-center px-4 ">

                    {/* Item */}
                    {categorias.map((item) => (
                        <div key={item.id} onClick={() => validar(item.quantidade, item.id)} className="flex bg-gray-800/50   border border-gray-700 items-center justify-between py-3 px-4  rounded-xl  shadow-lg mb-4 ">
                            <div>

                                <p className="text-lg text-white mt-1 font-medium">
                                    {item.categoria}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs py-0.5  rounded-full  text-gray-400 ">
                                        {item.quantidade} palavras
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 relative z-60">
                                <button
                                    className="shadow-md px-4 py-1 text-md  rounded-full bg-blue-400 text-white hover:bg-slate-400"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCategoriaId(item.id);
                                        setOpenTreino(true);
                                    }}
                                >
                                    Treino
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
                                                setOpenCategoriaEditar(true);
                                                setCategoriaId(item.id);
                                                setMenuOpenId(false);
                                            }}
                                        >
                                            Editar
                                        </button>

                                        <button
                                            className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteId(item.id);
                                                setMsgModalConfirm('Deseja excluir esta categoria?');
                                                setOpenModalConfirm(true);
                                                setMenuOpenId(false);

                                            }}
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Item */}

                </div>

            </div>
            <div className=" sticky  z-10 bottom-0 text-center w-full justify-items-center justify-center items-center pt-4 pb-16">

                <button className="
                        px-6
                        mb-4
                        py-3
                        shadow-md
                        rounded-full
                        bg-gray-800/50 backdrop-blur-sm  border border-gray-700
                        text-white
                        font-medium
                       text-lg
                        transition
                        " onClick={() => setOpen(true)}>
                    Adicionar categoria
                </button>

                <div className=" w-full ">
                    <div className='flex  left-0   w-full justify-center py-2 '>
                        {/*  <a href="/leituradigital"> <div className='bg-blue-400 rounded-full p-3 flex justify-center items-center'> */}

                        <a href="/leituradigital">
                            <div className=' p-3 flex justify-center items-center'>
                                {/*  <BookOpen className='text-white' /> */}
                                <Settings width={38} height={38} className='text-purple-400' />
                                {/* <img src={imgSetting} alt="" width={40} /> */}
                            </div>
                        </a>
                        <a href="/leituradigital">
                            <div className=' p-3 flex justify-center items-center'>
                                {/* <img src={imgBook} alt="" width={40} /> */}
                                {<BookOpen width={38} height={38} className='text-green-600' />}

                            </div>
                        </a>
                        <a href="/metricas">
                            <div className=' p-3 flex justify-center items-center'>
                                <BarChart3 className='text-blue-400' width={38} height={38} />

                                {/*  <BookOpen className='text-white' /> */}
                                {/* <img src={imgEstatistica} alt="" width={40} /> */}
                            </div>
                        </a>
                        <a href="/videos">
                            <div className=' p-3 flex justify-center items-center'>
                                <Play className='text-red-500 ' width={38} height={38} />
                                {/* <img src={imgPlay} alt="" width={40} /> */}
                            </div>
                        </a>
                        <button onClick={(e) => { verifyPlan() }}>
                            <div className=' p-3 flex justify-center items-center'>
                                <Bot width={38} height={38} className="text-yellow-500" />
                                {/* <img src={imgPlay} alt="" width={40} /> */}
                            </div>
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
                setOpenModalSucesso={setOpenModalSucesso}
                onSuccess={carregarCategorias}
            />
            <ModalCategoriasEditar
                open={openCategoriaEditar}
                setOpenCategoriaEditar={setOpenCategoriaEditar}
                categoriaEditar={categoriaClick}
                categoriaIdEditar={categoriaId}
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
            <PremiumModal isOpen={isPremiumModalOpen} setIsPremiumModalOpen={setIsPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} />
            <ModalConfirm setOpenModalConfirm={setOpenModalConfirm} openModalConfirm={modalConfirm} msg={msgModalConfirm} onConfirm={confirmarExclusao} />
        </div>
    )
}