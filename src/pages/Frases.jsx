import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import ModalFrase from "../components/ModalFrase";
import { useAuth } from "../context/AuthContext";
import PremiumModal from '../components/PremiumModal';
import ModalConfirm from '../components/ModalConfirm';
import { useTranslation } from "react-i18next";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"
import { playAudio, pararAudio } from "../utils/audioPlayer";

import {
    Trash,
    Search,
    Volume2,
    Loader2,
    BookOpen
} from "lucide-react";


export default function Frases() {
    const { t } = useTranslation();
    const { id } = useParams();
    const { user } = useAuth();

    const [frases, setFrases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [textoBusca, setTextoBusca] = useState("")
    const [openFrase, setOpenFrase] = useState(false)
    const [fraseEditando, setFraseEditando] = useState(null)
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);
    const [openModalConfirm, setOpenModalConfirm] = useState(false);
    // Id da frase cujo áudio está sendo buscado - a voz natural pode levar
    // um tempo pra gerar (chamada de verdade na API), sem nenhum indicador
    // visual o clique parecia travado/sem resposta.
    const [tocandoAudioId, setTocandoAudioId] = useState(null);
    const [deleteId, setDeleteId] = useState(0);
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

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
                action: 'frases',
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

    async function deletePhrase(id) {

        try {

            const res = await fetch(`${API_URL}/controller/frases.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'delete_phrase',
                    id_phrase: id,
                })
            });

            const data = await res.json()

            if (!data.success) {
                console.log(message)
            }

            listPhrase()

        } catch (error) {

        } finally {
            setLoading(false)
        }

    }

    function confirmarExclusaoFrase() {
        deletePhrase(deleteId);
        setOpenModalConfirm(false);
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
                        <BookOpen className="w-5 h-5" />
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

            {/* único container com altura real (flex-1 dentro do flex-col com
                h-dvh do wrapper) - antes essa div e as duas de dentro dela
                tinham flex-1/overflow sem um pai flex com altura definida,
                então não delimitavam nada de verdade: a lista crescia a
                página inteira em vez de rolar sozinha, e a busca "sumia"
                junto quando a lista era grande. */}
            <div className="flex-1 overflow-y-auto scrollbar-hide mt-4 pb-24 space-y-2">

                {frasesFiltradas.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        {t("no_phrase_found")}
                    </div>
                )}

                {frasesFiltradas.map((item) => (
                    <div key={item.id}
                        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-700/50 transition-colors"
                        onClick={() => {
                            setFraseEditando(item);
                            setOpenFrase(true);
                        }}
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-white truncate">{item.texto_nativo}</p>
                            <p className="text-[#4cb8c4] text-sm truncate mt-0.5">{item.texto_traduzido}</p>
                        </div>
                        <div className="flex items-center shrink-0">
                            <button
                                type="button"
                                disabled={tocandoAudioId === item.id}
                                className="p-2 -m-1 rounded-full hover:bg-gray-700/50 transition-colors"
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    setTocandoAudioId(item.id);
                                    try {
                                        await playAudio(item.texto_traduzido, user);
                                    } finally {
                                        setTocandoAudioId(null);
                                    }
                                }}
                            >
                                {tocandoAudioId === item.id ? (
                                    <Loader2 size={18} className="text-blue-400 animate-spin" />
                                ) : (
                                    <Volume2 size={18} className="text-blue-400" />
                                )}
                            </button>
                            <button
                                type="button"
                                className="p-2 -m-1 rounded-full hover:bg-gray-700/50 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(item.id);
                                    setOpenModalConfirm(true);
                                }}
                            >
                                <Trash size={18} className="text-red-400" />
                            </button>
                        </div>
                    </div>
                ))}

            </div>

            {/* barra fixa precisa de fundo opaco - sem isso era um retângulo
                transparente (só o botão tinha cor), deixando a lista aparecer
                por trás dela ao rolar. Também faltava a classe "flex" pra
                justify-center/items-center funcionarem. */}
            <div className="fixed bottom-0 left-0 w-full flex justify-center items-center py-4 px-6 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent">
                <button className="px-6 py-3 w-full rounded-full bg-gradient-to-r from-[#4cb8c4] to-[#085078] hover:from-[#3da5b0] hover:to-[#064060] text-white text-lg font-medium transition-colors"
                    onClick={() => {
                        setFraseEditando(null);
                        setOpenFrase(true);
                    }}>
                    {t("add")}
                </button>
            </div>

            <ModalFrase openPhrase={openFrase} setOpenPhrase={setOpenFrase} category={id} listPhrase={listPhrase}
                phraseToEdit={fraseEditando}
                onOpenPremium={() => {
                    setMotivoPremium(null);
                    setIsPremiumModalOpen(true);
                    setOpenFrase(false);
                }} />
            <PremiumModal isOpen={isPremiumModalOpen} setIsPremiumModalOpen={setIsPremiumModalOpen}
                onClose={() => {
                    setIsPremiumModalOpen(false);
                    setMotivoPremium(null);
                }
                } motivo={motivoPremium} />
            <ModalConfirm
                openModalConfirm={openModalConfirm}
                setOpenModalConfirm={setOpenModalConfirm}
                msg={t("confirm_delete_phrase")}
                onConfirm={confirmarExclusaoFrase}
            />

        </div>
    );
}
