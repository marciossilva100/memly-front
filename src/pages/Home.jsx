import imgPlus from '../assets/img/plus.png'
import imgBook from '../assets/img/book.png'
import imgSetting from '../assets/img/setting.png'
import imgEstatistica from '../assets/img/estatistic.png'

import { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import ModalCategorias from '../components/ModalCategorias';
import ModalTreino from '../components/ModaTreino';
import ModalTreinoAdvinhar from "../components/ModalTreinoAdvinhar";
import ModalIA from '../components/ModalIA';
import ModalSucesso from '../components/ModalSucesso';
import { useAuth } from "../context/AuthContext";


import { BookOpen } from "lucide-react";


export default function Home() {
    const { user,setUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [openTreino, setOpenTreino] = useState(false)
    const [categorias, setCategorias] = useState([]);
    const [openTreinoAdvinhar, setOpenTreinoAdvinhar] = useState(false)
    const [openTreinoIA, setOpenTreinoIA] = useState(false)
    const [openModalSucesso, setOpenModalSucesso] = useState(false)
    const [categoriaId, setCategoriaId] = useState(0)
    const [msgModalSucesso, setMsgModalSucesso] = useState('')
    const [frase, openFrase] = useState('')
    const navigate = useNavigate();

    const carregarCategorias = () => {
        fetch('http://localhost:8081/controller/categorias.php', {
            method: 'POST',
            credentials: "include",
            headers: {
                'Content-Type': 'application/json'
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

    useEffect(() => {
        console.log('home ',user)
        carregarCategorias();
    }, []);

    function validar(length, id) {

        //if(length > 0)
        navigate(`/frases/${id}`)
    }


    return (
        <div className="max-w-7xl mx-auto">

            <div className="lista-categoria border-t-2 py-4 overflow-auto h-[calc(100vh-110px)]" id="lista-categoria">
                <div className="min-h-screen items-center justify-center px-4 ">

                    {/* Item */}
                    {categorias.map((item) => (
                        <div key={item.id} onClick={() => validar(item.quantidade, item.id)} className="flex bg-white items-center justify-between py-3 px-4  rounded-xl border shadow-lg mb-4">
                            <div>

                                <p className="text-base text-slate-800 mt-1 font-medium">
                                    {item.categoria}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs py-0.5  rounded-full  text-gray-400 ">
                                        {item.quantidade} palavras
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="shadow-md px-4 py-1 text-sm font-medium rounded-full bg-blue-400 text-white hover:bg-slate-600 "
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCategoriaId(item.id);
                                        setOpenTreino(true);
                                    }}>
                                    Treino
                                </button>
                                <button className="text-gray-600 hover:text-white">⋮</button>
                            </div>
                        </div>
                    ))}

                    {/* Item */}

                </div>

                <div className="bg-white   fixed bottom-0  w-full justify-items-center justify-center items-center pt-4 ">
                    <div>
                        <button className="
                        px-6
                        py-3
                        rounded-full
                        bg-avocado-500
                        text-white
                        font-medium
                       
                        transition
                        " onClick={() => setOpen(true)}>
                            Adicionar categoria
                        </button>
                    </div>

                    <div className='flex  left-0 bottom-0 mt-3 border-t-2  w-full justify-center py-1'>
                        {/*  <a href="/leituradigital"> <div className='bg-blue-400 rounded-full p-3 flex justify-center items-center'> */}

                        <a href="/leituradigital">
                            <div className=' p-3 flex justify-center items-center'>
                                {/*  <BookOpen className='text-white' /> */}
                                <img src={imgSetting} alt="" width={40} />
                            </div>
                        </a>
                        <a href="/leituradigital">
                            <div className=' p-3 flex justify-center items-center'>
                                <img src={imgBook} alt="" width={40} />
                            </div>
                        </a>
                        <a href="/leituradigital">
                            <div className=' p-3 flex justify-center items-center'>
                                {/*  <BookOpen className='text-white' /> */}
                                <img src={imgEstatistica} alt="" width={40} />
                            </div>
                        </a>
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
            />
            <ModalTreino
                openTreino={openTreino}
                onClose={() => setOpenTreino(false)}

                onOpenAdvinhar={() => {
                    setOpenTreino(false);
                    setOpenTreinoAdvinhar(true);
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
        </div>
    )
}