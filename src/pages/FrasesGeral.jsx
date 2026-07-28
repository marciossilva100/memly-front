import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import ModalFrase from "../components/ModalFrase";
import { useAuth } from "../context/AuthContext";
import PremiumModal from '../components/PremiumModal';
import { useTranslation } from "react-i18next";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"
import { playAudio } from "../utils/audioPlayer";
import usePremiumLimitListener from "../hooks/usePremiumLimitListener";

import {
    Trash,
    Search,
    Filter,
    Volume2
} from "lucide-react";


export default function FrasesGeral() {
    const { t } = useTranslation();
    const { id } = useParams();
    const { user } = useAuth();

    const [frases, setFrases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [textoBusca, setTextoBusca] = useState("")
    const [openFrase, setOpenFrase] = useState(false)
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [motivoPremium, setMotivoPremium] = useState(null);
const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    usePremiumLimitListener((motivo) => {
        setMotivoPremium(motivo);
        setIsPremiumModalOpen(true);
    });

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

        <div className="px-5 h-dvh flex flex-col bg-gray-900 ">
            <div className="relative mb-4 mt-4">
                <div
                    className="left-0  cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-2xl text-white"></i>
                </div>
            </div>
            <div className={`mt-4 `}>
                <div className="flex items-center border rounded-md overflow-hidden ">
                    <span className="px-3 text-gray-500">
                        <Search width={20} />
                    </span>

                    <input
                        type="email"
                        className="w-full px-3 py-2 outline-none text-lg text-white !bg-transparent"
                        placeholder={t("search")}
                        value={textoBusca}
                        onChange={(e) => setTextoBusca(e.target.value)}
                    />
                </div>
            </div>
            {frases.length > 0 && (
                <div className="cursor-pointer flex justify-end mb-4">
                    <Filter className="text-white mt-2" size={18} />
                </div>
            )}
            <div className="overflow-auto scrollbar-hide">

                <div className="flex-1 flex flex-col">

                    <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">

                        {frasesFiltradas.map((item, index) => {
                            const isLast = index === frasesFiltradas.length - 1;
                            return (
                                <div key={item.id} className={`text-lg grid grid-cols-[1fr_1fr_auto] gap-4 items-center py-3 overflow text-white ${!isLast ? 'border-b-2' : ''}`}
                                >
                                    <div>{item.texto_nativo}</div>
                                    <div>{item.texto_traduzido}</div>
                                    <div className="flex justify-center">
                                        <Volume2 size={18} className="text-blue-400" onClick={() => {
                                            playAudio(item.texto_traduzido, user);
                                        }} />
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                </div>

                <div className="fixed bottom-0 left-0 w-full justify-center items-center py-4  w-full px-6 bg-gray-900">
                    <button className="
                    px-6
                    py-3
                    w-full
                    rounded-full
                      bg-gray-800/50   border border-gray-700
                    text-white
                    text-lg
                    hover:bg-blue-600
                    transition
                    "
                        onClick={() => {
                            setOpenFrase(true);
                        }}>
                        {t("add")}
                    </button>
                </div>
            </div>

            <ModalFrase openPhrase={openFrase} setOpenPhrase={setOpenFrase} category={id} listPhrase={listPhrase}
                onOpenPremium={() => {
                    setMotivoPremium(null);
                    setIsPremiumModalOpen(true);
                    setOpenFrase(false);
                }} />
            <PremiumModal isOpen={isPremiumModalOpen} setIsPremiumModalOpen={setIsPremiumModalOpen} onClose={() => { setIsPremiumModalOpen(false); setMotivoPremium(null); }} setOpenPhrase={setOpenFrase} motivo={motivoPremium} />

        </div>
    );
}
