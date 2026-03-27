import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import imgCoruja from "../assets/img/coruja.png"
import imgGlobe from "../assets/img/globe.png"
import imgMemly from "../assets/img/mascote-memly.png"
import imgZaldemy from "../assets/img/zaldemy.png"
import { useAuth } from "../context/AuthContext";



import {
    Plus,
    Trash2,
    BarChart3,
    Settings,
    HelpCircle,
    Mail,
    Crown,
    LogOut,
    Search
} from "lucide-react";

// 🌍 Bandeiras
const flags = {
    pt: "https://flagcdn.com/w40/br.png",
    en: "https://flagcdn.com/w40/us.png",
    es: "https://flagcdn.com/w40/es.png",
    fr: "https://flagcdn.com/w40/fr.png",
    de: "https://flagcdn.com/w40/de.png",
    it: "https://flagcdn.com/w40/it.png",
    zh: "https://flagcdn.com/w40/cn.png",
    ja: "https://flagcdn.com/w40/jp.png",
    ru: "https://flagcdn.com/w40/ru.png",
    ar: "https://flagcdn.com/w40/sa.png",
    hi: "https://flagcdn.com/w40/in.png",
    ko: "https://flagcdn.com/w40/kr.png",
    nl: "https://flagcdn.com/w40/nl.png",
    tr: "https://flagcdn.com/w40/tr.png",
    pl: "https://flagcdn.com/w40/pl.png",
};

function BotaoLogout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    return <button onClick={handleLogout} className='flex'><LogOut className='me-2' />Sair</button>;
}

export default function Header({ titulo }) {

    const navigate = useNavigate()
    const { pathname } = useLocation();
    const rotaBase = pathname.split('/')[1] || 'home';

    const [open, setOpen] = useState(false)
    const [openSelect, setOpenSelect] = useState(false)
    const [idioma, setIdioma] = useState("")
    const [languageList, setLanguageList] = useState([])
const API_URL = import.meta.env.VITE_API_URL;
    const { user, setUser } = useAuth();

    const idiomaNativo = languageList.find(
        (l) => l.sigla === user?.native_language
    );

    const selectRef = useRef(null);

    // 🔽 Buscar idiomas
    useEffect(() => {
        fetch(`${API_URL}/controller/language.php`, {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                action: 'list_languages',
            })
        })
            .then(res => res.json())
            .then(data => setLanguageList(data))
            .catch(() => { });
    }, [])

    // 🔽 Sincronizar idioma do usuário
    useEffect(() => {
        if (user?.learning_language) {
            setIdioma(user.learning_language);
        }

    }, [user]);

    // 🔽 Fechar select ao clicar fora
    useEffect(() => {
        function handleClickOutside(e) {
            if (selectRef.current && !selectRef.current.contains(e.target)) {
                setOpenSelect(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const idiomaSelecionado = languageList.find(
        (l) => l.sigla === idioma
    );

    return (
        <div className={`w-full section-header ${rotaBase === '/home' ? 'shadow-md pb-1' : ''}`}>

            {pathname === '/home' ? (
                <header className="from-gray-900 to-gray-800 bg-gradient-to-br">
                    <div className="w-full mx-auto px-4">
                        <div className="flex h-16 ">

                            {/* MENU ☰ */}
                            <button
                                className="md:hidden text-white text-xl"
                                onClick={() => setOpen(true)}
                            >
                                ☰
                            </button>

                            {/* IDIOMA */}
                            <div className="flex items-center w-full ms-3 py-2 justify-between">

                                <span className="text-md font-semibold text-white ">
                                    {idiomaNativo ? idiomaNativo.idioma : "Carregando..."}
                                </span>

                                <img src={imgGlobe} alt="" className="w-9" />

                                {/* SELECT CUSTOM */}
                                <div
                                    ref={selectRef}
                                    className="relative h-10 flex items-center rounded-2xl border border-slate-500  min-w-[180px]"
                                >
                                    {/* Botão */}
                                    <div
                                        onClick={() => setOpenSelect(!openSelect)}
                                        className="flex items-center gap-2 px-4 w-full cursor-pointer"
                                    >
                                        {idiomaSelecionado ? (
                                            <>
                                                <img
                                                    src={flags[idiomaSelecionado.sigla] || "https://flagcdn.com/w40/un.png"}
                                                    className="w-5 h-5 rounded-full"
                                                />
                                                <span className="text-sm text-white">
                                                    {idiomaSelecionado.idioma}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-white">
                                                Selecione um idioma
                                            </span>
                                        )}
                                    </div>

                                    {/* Dropdown */}
                                    {openSelect && (
                                        <div className="absolute top-12 left-0 w-full from-gray-800 to-gray-800 bg-gradient-to-br border rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                                            {languageList.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => {
                                                        setIdioma(item.sigla);
                                                        setOpenSelect(false);

                                                        setUser(prev => ({
                                                            ...prev,
                                                            learning_language: item.sigla
                                                        }));
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer text-white"
                                                >
                                                    <img
                                                        src={flags[item.sigla] || "https://flagcdn.com/w40/un.png"}
                                                        className="w-5 h-5 rounded-full"
                                                    />
                                                    <span className="text-sm">{item.idioma}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </header>
            ) : (
                <div>
                    <div className="relative text-center py-5">
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer"
                            onClick={() => navigate(-1)}
                        >
                            <i className="bi bi-arrow-left text-xl ml-3"></i>
                        </div>
                    </div>
                </div>
            )}

            {/* OVERLAY */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40"
                />
            )}

            {/* SIDEBAR */}
            <aside className={`fixed from-gray-900 to-gray-800 bg-gradient-to-br top-0 left-0 h-full w-64  z-50 transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="p-4 flex justify-between items-center  ">
                    <img className="w-32" src={imgZaldemy} alt="Logo" />
                    <button onClick={() => setOpen(false)} className='text-lg text-white font-semibold'>✕</button>
                </div>

                <div className="flex items-center gap-4 p-4 ">
               
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiB_hwnr2qi68_5lIrxK6fE74AlsQemoqOQw&s" alt="Avatar" className="w-full h-full object-cover"/>
                    </div>

                  
                    <div>
                        <p className="text-md font-semibold text-white">
                            Olá, {user?.name?.split(' ')[0]}
                        </p>
                        {/* <p class="text-sm text-gray-500">
                            {user.email}
                        </p> */}
                    </div>
                </div>

                <nav className="flex flex-col text-sm font-medium">

                    <a href="/" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-white text-lg">
                        <HelpCircle size={18} />
                        FAQ
                    </a>

                    <a href="/" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-white text-lg">
                        <Mail size={18} />
                        Contato
                    </a>

                    <a href="/" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-white text-lg">
                        <Crown size={20} className='text-yellow-500' />
                        Premium
                    </a>

                    <div className='px-4 py-3 text-white text-lg'>
                        <BotaoLogout />
                    </div>
                </nav>
            </aside>

        </div>
    )
}