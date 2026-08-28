import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import PremiumModal from '../components/PremiumModal';
import ModalIA from '../components/ModalIA';
import { useTranslation } from "react-i18next";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"
import { playAudio, pararAudio } from "../utils/audioPlayer";

import {
    Search,
    Volume2,
    Globe,
    Home,
    Settings,
    BarChart3,
    Bot,
    Crown,
    Loader2
} from "lucide-react";


// Categoria compartilhada por outro usuário - só visualização e escuta do
// áudio, sem opção de adicionar/editar frases (elas não pertencem a quem
// está vendo). Pra copiar a categoria pra própria lista, o fluxo é
// "Incorporar" em /listcategorias, não daqui.
export default function FrasesGeral() {
    const { t } = useTranslation();
    const { id } = useParams();
    const { user } = useAuth();

    const [frases, setFrases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [textoBusca, setTextoBusca] = useState("")
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);
    const [openTreinoIA, setOpenTreinoIA] = useState(false);
    // Indicador visual pro "Ouvir" - sem preload, o clique podia parecer
    // travado (nada acontece por 1-2s até o áudio terminar de gerar).
    const [tocandoAudioId, setTocandoAudioId] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    // O bloqueio (limitado sem nenhum dos dois recursos disponível, ou free
    // sem acesso a nenhum) fica por conta do próprio ModalIA - uma coroa em
    // cada opção bloqueada, que só abre o modal premium quando o usuário
    // tenta entrar naquela opção específica (ver ModalIA.jsx). Sempre abre
    // o ModalIA aqui, pra qualquer plano - pular direto pro premium pro
    // plano free era o mesmo bug já corrigido na Home (commit c6041fe),
    // só que esse arquivo tinha o código duplicado e ninguém tinha mexido.
    function verifyPlan() {
        setOpenTreinoIA(true);
    }

    // Para o áudio em reprodução ao sair da tela (troca de rota) - sem isso,
    // o áudio seguia tocando mesmo depois do usuário já ter navegado embora.
    useEffect(() => () => pararAudio(), []);

    useEffect(() => {

        listPhrase()
    }, []);

    async function listPhrase() {
        setLoading(true);

        fetch(`${API_URL}/controller/frases.php`, {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                action: 'frasesgeral',
                category_id: id
            })
        })
            .then(res => res.json())
            .then(data => {
                setFrases(data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }

    const buscaNormalizada = textoBusca.trim().toLowerCase();

    const frasesFiltradas = buscaNormalizada
        ? frases.filter(item =>
            item.texto_nativo?.toLowerCase().includes(buscaNormalizada) ||
            item.texto_traduzido?.toLowerCase().includes(buscaNormalizada)
        )
        : frases;

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br">
                <img
                    src={imgChapeuFormatura}
                    alt={t("loading")}
                    className="w-28 animate-pulse"
                />
            </div>
        );
    }

    return (

        <div className="px-5 h-dvh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex items-center gap-3 mb-4 mt-4">
                <div
                    className="cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-2xl text-white"></i>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#4cb8c4]/20 to-[#085078]/20 text-[#4cb8c4]">
                        <Globe className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold text-white leading-tight truncate">{t("phrases")}</h1>
                        <p className="text-xs text-gray-400">{frases.length}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden px-3">
                <Search className="text-gray-500 shrink-0" width={18} />

                <input
                    type="text"
                    className="w-full py-2.5 outline-none text-base text-white !bg-transparent placeholder:text-gray-500"
                    placeholder={t("search")}
                    value={textoBusca}
                    onChange={(e) => setTextoBusca(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-auto scrollbar-hide mt-4">

                <div className="flex-1 flex flex-col">

                    <div className="flex-1 overflow-y-auto scrollbar-hide pb-6 space-y-2">

                        {frasesFiltradas.length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                {t("no_phrase_found")}
                            </div>
                        )}

                        {frasesFiltradas.map((item) => (
                            <div key={item.id}
                                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-3 flex items-center justify-between gap-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-white truncate">{item.texto_nativo}</p>
                                    <p className="text-[#4cb8c4] text-sm truncate mt-0.5">{item.texto_traduzido}</p>
                                </div>
                                {tocandoAudioId === item.id ? (
                                    <Loader2 size={18} className="text-blue-400 shrink-0 animate-spin" />
                                ) : (
                                    <Volume2 size={18} className="text-blue-400 shrink-0" onClick={async () => {
                                        setTocandoAudioId(item.id);
                                        try {
                                            await playAudio(item.texto_traduzido, user);
                                        } finally {
                                            setTocandoAudioId(null);
                                        }
                                    }} />
                                )}
                            </div>
                        ))}

                    </div>
                </div>
            </div>

            <div className="w-full">
                <div className='flex left-0 w-full justify-around py-2'>
                    <button type="button" onClick={() => navigate('/home')} className="flex flex-col items-center gap-1">
                        <Home width={26} height={26} className='text-violet-400' />
                    </button>

                    <button type="button" onClick={() => navigate('/configuracoes')} className="flex flex-col items-center gap-1">
                        <Settings width={26} height={26} className='text-blue-400' />
                    </button>

                    <button type="button" onClick={() => navigate('/metricas')} className="flex flex-col items-center gap-1">
                        <BarChart3 width={26} height={26} className='text-green-400' />
                    </button>

                    <button type="button" onClick={verifyPlan} className="relative flex flex-col items-center gap-1">
                        <Bot width={26} height={26} className="text-amber-400" />
                        {user?.plano !== 1 && user?.plano !== 3 && (
                            <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
                        )}
                    </button>
                </div>
            </div>

            <ModalIA setOpenTreinoIA={setOpenTreinoIA} openTreinoIA={openTreinoIA} />
            <PremiumModal isOpen={isPremiumModalOpen} setIsPremiumModalOpen={setIsPremiumModalOpen} onClose={() => { setIsPremiumModalOpen(false); setMotivoPremium(null); }} motivo={motivoPremium} />

        </div>
    );
}
