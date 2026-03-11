import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import imgCoruja from "../assets/img/coruja.png"
import imgGlobe from "../assets/img/globe.png"
import imgMemly from "../assets/img/mascote-memly.png"
import { idiomas } from "../data/idiomas"
import { useAuth } from "../context/AuthContext";
import imgZaldemy from "../assets/img/zaldemy.png"

import {
    Plus,
    Trash2,
    BarChart3,
    Settings,
    HelpCircle,
    Mail,
    Crown,
    Search
} from "lucide-react";

function BotaoLogout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    return <button onClick={handleLogout}>Sair</button>;
}

export default function Header({ titulo }) {
    const navigate = useNavigate()
    const { pathname } = useLocation();
    const rotaBase = pathname.split('/')[1] || 'home';
    const [open, setOpen] = useState(false)
    const [idioma, setIdioma] = useState("")
    const [textoBusca, setTextoBusca] = useState("")

    return (
        <div className={`w-full section-header ${rotaBase === '/home' ? 'shadow-md pb-1' : ''}`}>

            {location.pathname === '/home' ? (
                <header className="bg-white">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex h-16  justify-start ">

                            <button className="md:hidden text-gray-700 text-xl" onClick={() => setOpen(true)}>
                                ☰
                            </button>
                            {/* <div className="ms-3 text-md font-bold text-gray-700 flex items-center ">
                                <img src={imgMemly} alt="" width={40} />
                                Memly
                            </div> */}


                            <div className="flex items-center justify-center gap-3  rounded-xl ms-3 py-2 ">

                                <span className="leading-none text-sm font-semibold text-slate-700">Português</span>

                                {/* <ArrowRight className="w-5 h-5 text-gray-600" /> */}
                                <img src={imgGlobe} alt="" className="w-9" />
                                {/* Wrapper do select */}
                                <div className="
                                relative
                                
                                h-10
                                flex
                                items-center
                                rounded-2xl
                                border
                                border-slate-500
                                bg-white
                                focus-within:ring-2
                                focus-within:ring-blue-500
                            ">
                                    <select
                                        value={idioma}
                                        onChange={(e) => setIdioma(e.target.value)}
                                        className="
                                    text-sm
                                    w-full
                                    h-full
                                    px-4
                                    pr-10
                                    bg-transparent
                                    appearance-none
                                    outline-none
                                "
                                    >
                                        {idiomas.map((item) => (
                                            <option key={item.value} value={item.value}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Setinha */}
                                    <div className="pointer-events-none absolute right-4 flex items-center">
                                        <svg
                                            className="w-4 h-4 text-blue-500"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                        </div>




                    </div>
                    {/* <hr /> */}

                </header>

            ) : (
                <div>
                    <div className={`relative text-center py-5 ${rotaBase === 'flashcards' ? 'bg-slate-50' : ''}`}>
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer"
                            onClick={() => navigate(-1)}
                        >
                            <i className="bi bi-arrow-left text-xl ml-3"></i>
                        </div>
                    </div>


                </div>

            )}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40"
                />
            )}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="p-4 flex justify-between items-center border-b">
                    <div className='text-md font-bold text-gray-700 flex items-center '>
                        <img className="w-32" src={imgZaldemy} alt="Login" />

                    </div>
                    <button onClick={() => setOpen(false)}>✕</button>
                </div>

                <nav className="flex flex-col text-sm font-medium">

                    {/*  <a href="/" className="flex items-center gap-3 px-4 py-3 text-base rounded text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition" >
                        <Plus size={18} />
                        <span>Adicionar idioma</span>
                    </a>

                    <a href="/sobre" className="flex items-center gap-3 px-4 py-3 text-base rounded text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition">
                        <Trash2 size={18} />
                        <span>Excluir idioma</span>
                    </a>

                    <hr className="" />

                    <a href="/contato" className="flex items-center gap-3 px-4 py-3 text-base rounded text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition">
                        <BarChart3 size={18} />
                        <span>Desempenho e estatísticas</span>
                    </a> */}

                    <hr className="" />
                    {/* 
                    <a href="/" className="flex items-center gap-3 px-4 py-3 text-base rounded text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition">
                        <Settings size={18} />
                        <span>Configurações</span>
                    </a> */}

                    <a href="/" className="flex items-center gap-3 px-4 py-3 text-base rounded text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition">
                        <HelpCircle size={18} />
                        <span>FAQ</span>
                    </a>

                    <a href="/" className="flex items-center gap-3 px-4 py-3 text-base rounded text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition">
                        <Mail size={18} />
                        <span>Escreva pra gente</span>
                    </a>

                    <hr className="" />

                    <a href="/" className="flex items-center gap-3 px-4 py-3 text-base rounded text-slate-700 font-semibold hover:bg-blue-50 transition">
                        <Crown size={32} className=' text-yellow-500 bg-blue-700 rounded-full p-2' />
                        <span>Seja Premium</span>
                    </a>
                    <hr className="" />

                    <div className='px-4 py-3 text-base'>
                        {BotaoLogout()}
                    </div>


                </nav>


            </aside>

            {/* <h4 className="text-primary-aux mb-0">
                    {titulo}
                </h4> */}


        </div>


    )
}
