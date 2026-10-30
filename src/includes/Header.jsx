import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import imgZaldemy from "../assets/img/zaldemy.png"
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import PremiumModal from "../components/PremiumModal";
import { fetchComTimeout } from "../utils/fetchComTimeout";
import { NIVEIS } from "../utils/niveis";


import {
    Plus,
    Trash2,
    BarChart3,
    Settings,
    HelpCircle,
    Mail,
    Crown,
    LogOut,
    Search,
    Share2,
    Camera,
    Loader2,
    ArrowRightLeft
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
    const { t } = useTranslation();

    const { logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    return <button onClick={handleLogout} className='flex'><LogOut className='me-2' />{t("log_out")}</button>;
}

export default function Header({ titulo }) {


    const { t } = useTranslation();

    const navigate = useNavigate()
    const { pathname } = useLocation();
    const rotaBase = pathname.split('/')[1] || 'home';
    const mostrarSeletorIdioma = pathname === '/home' || pathname === '/metricas' || pathname === '/listcategorias';

    const [open, setOpen] = useState(false)
    const [openSelect, setOpenSelect] = useState(false)
    const [openSelectNativo, setOpenSelectNativo] = useState(false)
    const [idioma, setIdioma] = useState("")
    const [languageList, setLanguageList] = useState([])
    const [trocandoIdioma, setTrocandoIdioma] = useState(false)
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
    const [enviandoFoto, setEnviandoFoto] = useState(false)
    const [erroFoto, setErroFoto] = useState('')
    const fotoInputRef = useRef(null)
    const API_URL = import.meta.env.VITE_API_URL;

    const { user, setUser, categoriasLoading } = useAuth();

    async function handleSelecionarFoto(e) {
        const arquivo = e.target.files?.[0];
        e.target.value = ''; // permite escolher o mesmo arquivo de novo depois

        if (!arquivo) return;

        setErroFoto('');
        setEnviandoFoto(true);

        try {
            const formData = new FormData();
            formData.append('action', 'upload_foto');
            formData.append('foto', arquivo);

            const res = await fetch(`${API_URL}/controller/perfil.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: formData
            });

            const data = await res.json();

            if (!data.success) {
                setErroFoto(data.message || t("unexpected_error"));
                return;
            }

            setUser((prev) => ({ ...(prev || {}), foto_perfil: data.foto_perfil }));
        } catch (error) {
            console.error('Erro ao enviar foto:', error);
            setErroFoto(t("server_connection_error"));
        } finally {
            setEnviandoFoto(false);
        }
    }

    const idiomaNativo = languageList.find(
        (l) => l.sigla === user?.native_language
    );

    // Não faz sentido aprender o mesmo idioma que já é o nativo
    const idiomasParaAprender = languageList.filter(
        (l) => l.sigla !== user?.native_language
    );

    // Mesma regra, espelhada: não faz sentido o nativo ser igual ao idioma
    // que está aprendendo (idioma, não user?.native_language - precisa
    // refletir uma troca de idioma aprender ainda não salva).
    const idiomasParaNativo = languageList.filter(
        (l) => l.sigla !== idioma
    );

    const selectRef = useRef(null);
    const selectNativoRef = useRef(null);

    async function handleShareApp() {
        const shareData = {
            title: "Zaldemy",
            text: t("share_app"),
            url: window.location.origin,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch { }
        } else {
            await navigator.clipboard.writeText(shareData.url);
        }
    }

    // 🔽 Buscar idiomas
    useEffect(() => {
        let cancelado = false;

        // O nome do idioma no cabeçalho depende só desse fetch (idiomaNativo).
        // Sem timeout/retry, uma rede instável no boot do app (comum em
        // Capacitor) deixava esse fetch travado ou falhando uma vez só, e
        // como o useEffect não roda de novo sozinho, o cabeçalho ficava preso
        // em "Carregando..." pra sempre - daí o retry com backoff abaixo.
        function buscarIdiomas(tentativa = 1) {
            fetchComTimeout(`${API_URL}/controller/language.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'list_languages',
                })
            })
                .then(res => res.json())
                .then(data => { if (!cancelado) setLanguageList(data); })
                .catch(() => {
                    if (!cancelado && tentativa < 4) {
                        setTimeout(() => buscarIdiomas(tentativa + 1), 2000 * tentativa);
                    }
                });
        }

        buscarIdiomas();

        return () => { cancelado = true; };
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
            if (selectNativoRef.current && !selectNativoRef.current.contains(e.target)) {
                setOpenSelectNativo(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const idiomaSelecionado = languageList.find(
        (l) => l.sigla === idioma
    );

    // Nível do PAR DE IDIOMA ativo agora (user.nivel já vem assim do backend,
    // ver controller/me.php e model/Idioma.php::atualizarReferenciaAprendizado)
    // - cada par (nativo + aprendendo) tem o seu próprio, nunca um nível só
    // pro usuário inteiro.
    const nivelAtual = NIVEIS.find((n) => n.id === (user?.nivel || 1)) || NIVEIS[0];

    const handleSelectLanguage = async (item) => {
        const idiomaAnterior = idioma;

        setIdioma(item.sigla);
        setOpenSelect(false);
        setTrocandoIdioma(true);

        try {
            const res = await fetch(`${API_URL}/controller/language.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'update_learning_reference',
                    learning_language: item.id,
                    learning_native: idiomaNativo?.id,
                })
            });

            if (!res.ok) {
                throw new Error(`Falha ao salvar idioma (status ${res.status})`);
            }

            const data = await res.json();

            // Só atualiza o usuário (o que dispara o carregamento das categorias em
            // Home.jsx) depois do backend confirmar -- ele é quem cadastra a
            // categoria/frases padrão desse par de idiomas. Atualizar antes cria uma
            // corrida onde a Home busca as categorias antes delas existirem no banco.
            // nivel vem do par NOVO (cada par de idioma tem o seu, ver Nivel.php) -
            // sem isso o indicador de nível na Home ficava mostrando o nível do
            // par anterior até a próxima vez que o usuário mexesse nele.
            setUser(prev => ({
                ...prev,
                learning_language: item.sigla,
                nivel: data.nivel ?? prev?.nivel
            }));
        } catch (error) {
            console.error('Erro ao salvar idioma:', error);
            // servidor não confirmou a troca (ex: sessão expirada) -> desfaz a troca otimista
            setIdioma(idiomaAnterior);
        } finally {
            setTrocandoIdioma(false);
        }
    };

    // Espelha handleSelectLanguage - mesma action/endpoint (atualiza o par
    // inteiro de uma vez), só invertendo qual lado muda. idiomaNativo não
    // tem estado local otimista próprio (como "idioma" tem pro aprender)
    // porque o overlay de tela cheia (trocandoIdioma) já cobre a tela
    // inteira durante a troca - não tem o que mostrar otimisticamente.
    const handleSelectNativeLanguage = async (item) => {
        setOpenSelectNativo(false);
        setTrocandoIdioma(true);

        try {
            const res = await fetch(`${API_URL}/controller/language.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'update_learning_reference',
                    learning_language: idiomaSelecionado?.id,
                    learning_native: item.id,
                })
            });

            if (!res.ok) {
                throw new Error(`Falha ao salvar idioma nativo (status ${res.status})`);
            }

            const data = await res.json();

            setUser(prev => ({
                ...prev,
                native_language: item.sigla,
                nivel: data.nivel ?? prev?.nivel
            }));
        } catch (error) {
            console.error('Erro ao salvar idioma nativo:', error);
        } finally {
            setTrocandoIdioma(false);
        }
    };

    // Inverte nativo <-> aprendendo num clique só (botão no meio dos dois
    // seletores, estilo Google Translate). Sem isso, trocar os dois lados
    // ficava impossível em certos casos: cada dropdown já exclui o idioma
    // que está do OUTRO lado (não faz sentido nativo == aprendendo), então
    // pra inverter pt->en pra en->pt o usuário ficava preso (não dá pra
    // escolher "en" como nativo enquanto "en" ainda é o aprendendo, e
    // vice-versa) - bug real reportado.
    const handleInverterIdiomas = async () => {
        if (!idiomaNativo || !idiomaSelecionado) return;

        const nativoAnterior = idiomaNativo;
        const aprenderAnterior = idiomaSelecionado;

        setIdioma(nativoAnterior.sigla);
        setTrocandoIdioma(true);

        try {
            const res = await fetch(`${API_URL}/controller/language.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'update_learning_reference',
                    learning_language: nativoAnterior.id,
                    learning_native: aprenderAnterior.id,
                })
            });

            if (!res.ok) {
                throw new Error(`Falha ao inverter idiomas (status ${res.status})`);
            }

            const data = await res.json();

            setUser(prev => ({
                ...prev,
                native_language: aprenderAnterior.sigla,
                learning_language: nativoAnterior.sigla,
                nivel: data.nivel ?? prev?.nivel
            }));
        } catch (error) {
            console.error('Erro ao inverter idiomas:', error);
            setIdioma(aprenderAnterior.sigla);
        } finally {
            setTrocandoIdioma(false);
        }
    };

    return (
        <div className={`w-full section-header ${rotaBase === '/home' ? 'shadow-md pb-1' : ''}`}>

            {(trocandoIdioma || categoriasLoading) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br">
                    <img
                        src={imgChapeuFormatura}
                        alt={t("loading")}
                        className="w-28 animate-pulse"
                    />
                </div>
            )}

            {mostrarSeletorIdioma ? (
                <header className="from-gray-900 to-gray-800 bg-gradient-to-br">
                    <div className="w-full mx-auto px-4">
                        <div className="flex h-16 items-center">

                            {/* MENU ☰ */}
                            <button
                                className="md:hidden text-white text-xl"
                                onClick={() => setOpen(true)}
                            >
                                ☰
                            </button>

                            {/* IDIOMA */}
                            <div className="flex items-center w-full ms-3 py-2 justify-between gap-1">

                                {/* SELECT CUSTOM - NATIVO */}
                                <div
                                    ref={selectNativoRef}
                                    className="relative h-10 flex items-center rounded-2xl border border-slate-500 flex-1 min-w-0"
                                >
                                    {/* Botão */}
                                    <div
                                        onClick={() => setOpenSelectNativo(!openSelectNativo)}
                                        className="flex items-center gap-1.5 px-2.5 w-full min-w-0 cursor-pointer"
                                    >
                                        {idiomaNativo ? (
                                            <>
                                                <img
                                                    src={flags[idiomaNativo.sigla] || "https://flagcdn.com/w40/un.png"}
                                                    className="w-5 h-5 rounded-full flex-shrink-0"
                                                />
                                                <span className="text-sm text-white truncate">
                                                    {t(idiomaNativo.sigla)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-white truncate">
                                                {t("loading_dots")}
                                            </span>
                                        )}
                                    </div>

                                    {/* Dropdown */}
                                    {openSelectNativo && (
                                        <div className="absolute top-12 left-0 w-full from-gray-800 to-gray-800 bg-gradient-to-br border rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                                            {idiomasParaNativo.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleSelectNativeLanguage(item)}
                                                    className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer text-white"
                                                >
                                                    <img
                                                        src={flags[item.sigla] || "https://flagcdn.com/w40/un.png"}
                                                        className="w-5 h-5 rounded-full"
                                                    />
                                                    <span className="text-sm">
                                                        {t(item.sigla)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleInverterIdiomas}
                                    disabled={trocandoIdioma}
                                    className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                                    aria-label={t("swap_languages")}
                                >
                                    <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                                </button>

                                {/* SELECT CUSTOM */}
                                <div
                                    ref={selectRef}
                                    className="relative h-10 flex items-center rounded-2xl border border-slate-500 flex-1 min-w-0"
                                >
                                    {/* Botão */}
                                    <div
                                        onClick={() => setOpenSelect(!openSelect)}
                                        className="flex items-center gap-1.5 px-2.5 w-full min-w-0 cursor-pointer"
                                    >
                                        {idiomaSelecionado ? (
                                            <>
                                                <img
                                                    src={flags[idiomaSelecionado.sigla] || "https://flagcdn.com/w40/un.png"}
                                                    className="w-5 h-5 rounded-full flex-shrink-0"
                                                />
                                                <span className="text-sm text-white truncate">
                                                    {t(idiomaSelecionado.sigla)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-white truncate">
                                                {t("select_a_language")}
                                            </span>
                                        )}
                                    </div>

                                    {/* Dropdown */}
                                    {openSelect && (
                                        <div className="absolute top-12 left-0 w-full from-gray-800 to-gray-800 bg-gradient-to-br border rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                                            {idiomasParaAprender.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleSelectLanguage(item)}
                                                    className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer text-white"
                                                >
                                                    <img
                                                        src={flags[item.sigla] || "https://flagcdn.com/w40/un.png"}
                                                        className="w-5 h-5 rounded-full"
                                                    />
                                                    <span className="text-sm">
                                                        {t(item.sigla)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Nível do par de idioma ativo agora - pedido explícito
                            do usuário pra ficar visível aqui, logo abaixo do
                            idioma nativo, já que o nível não é mais global
                            (muda por par de idioma, ver Nivel.php). Fora da
                            linha das bandeiras (que é um flex-row de altura
                            fixa h-16) de propósito - senão vira mais um item
                            NA MESMA linha em vez de aparecer embaixo. */}
                        <div className="ms-3 pb-2 -mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <nivelAtual.icon className="w-3.5 h-3.5 text-[#4cb8c4]" />
                                {t("current_level")}: {t(`level_${nivelAtual.key}_title`)} ({nivelAtual.cefr})
                            </span>
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
                <div className="p-4 flex justify-between items-center">
                    <img className="w-32" src={imgZaldemy} alt="Logo" />
                    <button onClick={() => setOpen(false)} className='text-lg text-white font-semibold'>✕</button>
                </div>

                <div className="flex items-center gap-4 p-4 ">

                    <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => fotoInputRef.current?.click()}
                            disabled={enviandoFoto}
                            className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
                        >
                            <img
                                src={user?.foto_perfil ? `${API_URL}/${user.foto_perfil}` : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiB_hwnr2qi68_5lIrxK6fE74AlsQemoqOQw&s"}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                            {enviandoFoto && (
                                <span className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                </span>
                            )}
                        </button>
                        <span
                            onClick={() => fotoInputRef.current?.click()}
                            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#4cb8c4] border-2 border-gray-900 flex items-center justify-center cursor-pointer"
                        >
                            <Camera className="w-2.5 h-2.5 text-white" />
                        </span>
                        <input
                            ref={fotoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleSelecionarFoto}
                            className="hidden"
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-md font-semibold text-white truncate">
                            {t("hello")}, {user?.name?.split(' ')[0]}
                        </p>
                        {user?.email && (
                            <p className="text-gray-400 text-xs truncate">{user.email}</p>
                        )}
                        {erroFoto && (
                            <p className="text-red-400 text-xs mt-0.5">{erroFoto}</p>
                        )}
                    </div>
                </div>

                <nav className="flex flex-col text-sm font-medium">

                    <button type="button" onClick={() => { setOpen(false); navigate('/faq'); }} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-lg text-left">
                        <HelpCircle size={18} />
                        {t("faq")}
                    </button>

                    <button type="button" onClick={() => { setOpen(false); navigate('/contato'); }} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-lg text-left">
                        <Mail size={18} />
                        {t("contact")}

                    </button>

                    <button onClick={handleShareApp} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-lg text-left">
                        <Share2 size={18} />
                        {t("share_app")}
                    </button>

                    <button type="button" onClick={() => { setOpen(false); navigate('/configuracoes'); }} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-lg text-left">
                        <Settings size={18} />
                        {t("settings")}
                    </button>

                    {user?.plano !== 1 && (
                        <button type="button" onClick={() => { setOpen(false); setIsPremiumModalOpen(true); }} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-lg text-left">
                            <Crown size={18} className='text-yellow-500' />
                            {t("go_premium")}
                        </button>
                    )}

                    <div className='px-4 py-3 text-white text-lg'>
                        <BotaoLogout />
                    </div>
                </nav>
            </aside>

            <PremiumModal
                isOpen={isPremiumModalOpen}
                setIsPremiumModalOpen={setIsPremiumModalOpen}
                onClose={() => setIsPremiumModalOpen(false)}
            />

        </div>
    )
}