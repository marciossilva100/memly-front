import { useEffect, useRef, useState } from "react";
import { Loader2, Volume } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

import "../treinoIA.css";

export default function TreinoIA() {
    const [textoTraduzido, setTextoTraduzido] = useState('');
    const [textoNativo, setTextoNativo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [flipped, setFlipped] = useState(false);
    const navigate = useNavigate();

    const jaBuscou = useRef(false);

    useEffect(() => {
        if (jaBuscou.current) return;
        jaBuscou.current = true;

        setLoading(true);
        setError(null);

        fetch('https://zaldemy.com/controller/aiController.php', {
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
    const speakText = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(textoTraduzido);
            utterance.lang = 'en-US'; // ou 'en-US' para inglês
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech Synthesis não suportado nesse navegador.');
        }
    };

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
        <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center px-4 gap-4 ">
            <div className="relative text-left w-full mt-3">
                <div
                    className="left-0  cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-xl"></i>
                </div>
            </div>
            <div
                className="flashcard-container cursor-pointer select-none"
                onClick={() => setFlipped(!flipped)}
            >
                <div className={`flashcard ${flipped ? "flipped" : ""}`}>
                    <div className="bg-default-gradient text-white shadow-md rounded-lg flex items-center justify-center p-6 text-center text-white-700">
                        <p className="text-xl md:text-2xl font-medium ">
                            {textoTraduzido}
                        </p>
                    </div>
                    <div className="back rounded-lg flex items-center justify-center p-6 text-center bg-white">
                        <p className="text-xl md:text-2xl font-medium">
                            {textoNativo}
                        </p>
                    </div>
                </div>
            </div>

            {/* Botão para ouvir a pronúncia */}
            <button
                onClick={speakText}
                className="mt-2 px-4 py-2 bg-slate-400 text-white rounded hover:bg-indigo-700 transition flex"
            >
                <Volume /> Ouvir
            </button>
        </div>
    );
}
