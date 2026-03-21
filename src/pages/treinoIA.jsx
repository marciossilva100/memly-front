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

    const jaBuscou = useRef(false);

    useEffect(() => {
        if (jaBuscou.current) return;
        jaBuscou.current = true;

        setLoading(true);
        setError(null);

        fetch('https://api.zaldemy.com/controller/aiController.php', {
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
            <div className="min-h-[calc(100vh-70px)] flex items-center justify-center">
                <Loader2 className="animate-spin mr-2 w-8 h-8 text-indigo-600" />
                <span className="text-slate-700 text-lg">Gerando treino...</span>
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
        <div className="h-[100dvh] flex flex-col items-center  px-4 gap-4 ">
            <div className="relative text-left w-full mt-3">
                <div
                    className="left-0  cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-2xl"></i>
                </div>
            </div>
            <div>
                <div
                    className="flashcard-container cursor-pointer select-none "
                    onClick={() => setFlipped(!flipped)}
                >
                    <div className={`flashcard ${flipped ? "flipped" : ""} `}>
                        <div className="relative py-20 bg-default-gradient text-white shadow-md rounded-lg flex items-center justify-center p-6 text-center text-white-700">
                            <p className="text-2xl md:text-2xl font-medium ">
                                {textoTraduzido}
                            </p>
                            <div className="absolute right-0 top-0 mt-3 me-3">
                                <RefreshCw />

                            </div>
                        </div>
                        <div className="relative py-20 back rounded-lg flex items-center justify-center p-6 text-center bg-white">
                            <p className="text-2xl md:text-2xl font-medium">
                                {textoNativo}
                            </p>
                              <div className="absolute right-0 top-0 mt-3 me-3">
                                <RefreshCw />

                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full flex justify-center items-center">
                    <button
                        onClick={()=>playAudio(textoTraduzido,user,true)}
                        className="mt-2 px-4 py-2 bg-slate-400 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <Volume /> Ouvir
                    </button>
                </div>

            </div>

        </div>
    );
}
