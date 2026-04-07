import { useEffect, useRef, useState } from "react";
import { Loader2, Volume } from "lucide-react";
import { playAudio } from "../utils/audioPlayer";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RefreshCw } from "lucide-react";

import "../treinoIA.css";

export default function TreinoIA() {

    const [textoTraduzido, setTextoTraduzido] = useState('');
    const [textoNativo, setTextoNativo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [flipped, setFlipped] = useState(false);
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL;
    const jaBuscou = useRef(false);

    useEffect(() => {

        // setTextoTraduzido('Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.');
        // return

        if (jaBuscou.current) return;
        jaBuscou.current = true;

        setLoading(true);
        setError(null);

        fetch(`${API_URL}/controller/aiController.php`, {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (!data.success) throw new Error(data.error || 'Erro desconhecido');
                setTextoTraduzido(data.traduzido);
                setTextoNativo(data.nativo);
            })
            .catch(err => {
                console.error(err);
                setError('Não foi possível gerar o treino.');
            })
            .finally(() => setLoading(false));
    }, []);

    // Função para pronunciar o texto traduzido
    // const speakText = () => {
    //     if ('speechSynthesis' in window) {
    //         const utterance = new SpeechSynthesisUtterance(textoTraduzido);
    //         utterance.lang = 'en-US'; // ou 'en-US' para inglês
    //         window.speechSynthesis.speak(utterance);
    //     } else {
    //         console.warn('Speech Synthesis não suportado nesse navegador.');
    //     }
    // };

    if (loading) {
        return (
            <div className="h-dvh flex items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br">
                <Loader2 className="animate-spin mr-2 w-8 h-8 text-indigo-400" />
                <span className="text-white text-lg">Gerando treino...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[calc(100vh-70px)] flex items-center justify-center text-red-600 text-center px-4">
                {error}
            </div>
        );
    }

    return (
        <div className="h-[100dvh] flex flex-col items-center  px-4 gap-4 from-gray-900 to-gray-800 bg-gradient-to-br ">
            <div className="overflow-y-auto scrollbar-hide pb-4">
                <div className="relative text-left w-full mt-3">
                    <div className="left-0  cursor-pointer" onClick={() => navigate(-1)} >
                        <i className="bi bi-arrow-left text-2xl text-white"></i>
                    </div>
                </div>
                <div>
                    <div className="flashcard-container cursor-pointer select-none " onClick={() => setFlipped(!flipped)} >
                        <div className={`flashcard ${flipped ? "flipped" : ""} `}>
                            <div className="relative py-20 bg-[linear-gradient(to_right,#233245,#0d1425)] text-white shadow-md rounded-lg flex items-center justify-center p-6 text-center text-white-700">
                                <p className="text-2xl md:text-2xl font-medium">
                                    {textoTraduzido}
                                </p>
                                <div className="absolute right-0 top-0 mt-3 me-3">
                                    <RefreshCw className="text-white" />
                                </div>
                            </div>
                            <div className="relative py-20 back rounded-lg flex items-center justify-center p-6 text-center bg-[linear-gradient(to_right,#0d1425,#233245)]">
                                <p className="text-2xl md:text-2xl font-medium text-white">
                                    {textoNativo}
                                </p>
                                <div className="absolute right-0 top-0 mt-3 me-3">
                                    <RefreshCw className="text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex justify-center items-center">
                        <button
                            onClick={() => playAudio(textoTraduzido, user, true)}
                            className="mt-2 px-4 py-2 bg-slate-500 text-white rounded  flex items-center"
                        >
                            <Volume /> Ouvir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
