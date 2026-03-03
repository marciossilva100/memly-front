import { useState, useEffect, useRef } from "react"
import { Volume, Loader2 } from "lucide-react";

export default function () {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null)
    const [question, setQuestion] = useState('')
    const [answer, setAnswer] = useState('')
    const jaBuscou = useRef(false);
    const [textLoading,setTextLoading] = useState('')

    useEffect(() => {

        if (jaBuscou.current) return;
        jaBuscou.current = true;
        //   if (jaBuscou.current) return;
        //jaBuscou.current = true;
        setTextLoading('Gerando treino...')
        setLoading(true);
        setError(null);

        fetch('http://localhost:8081/controller/DailyQuestionController.php', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (!data.success) throw new Error(data.error || 'Erro desconhecido');
                setQuestion(data.question);
            })
            .catch(err => {
                console.error(err);
                setError('Não foi possível gerar o treino.');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
            setTextLoading('Processando resposta...')

        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8081/controller/DailyQuestionController.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, answer })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            if (!data.success) throw new Error(data.error);
                setLoading(false);

            setQuestion(data.feedback);
            setAnswer(false)
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-70px)] flex items-center justify-center">
                <Loader2 className="animate-spin mr-2 w-8 h-8 text-indigo-600" />
                <span className="text-slate-600 text-lg">{textLoading}</span>
            </div>
        );
    }

    // Função para pronunciar o texto traduzido
    const speakText = () => {

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(question);
            utterance.lang = 'en-US'; // ou 'en-US' para inglês
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech Synthesis não suportado nesse navegador.');
        }
    };

    return (
        <div className="p-4 justify-center flex w-full">
            <form action="" onSubmit={handleSubmit} className="w-full">
                <div>

                    <div className="flex border p-3 shadow-md relative justify-between">
                        <p className="text-lg">{question}</p>
                        <Volume className="text-sm ms-2  w-10 h-10 p-0" onClick={speakText} />
                    </div>
                    <div className=" mt-3">
          {/*               <input onChange={(e) => setAnswer(e.target.value)} type="text" className="w-full px-3 py-2 outline-none" placeholder="Resposta" /> */}
                          <textarea

                                onChange={(e) => setAnswer(e.target.value)}
                                className="
                                text-lg
                                focus:outline-none focus:ring-0 
                                w-full h-32
                                pt-6
                                text-center
                                focus:outline-none
                                focus:ring-2 focus:ring-blue-500
                                rounded-lg border border-gray-300
                                resize-none transition
                            "
                            />
                    </div>

                </div>
                <div className="flex bg-white fixed bottom-0 left-0 w-full justify-center items-center py-4">
                    <button className="
                    px-6
                    py-3
                    rounded-full
                    bg-blue-500
                    text-white
                    font-medium
                    hover:bg-blue-600
                    transition
                    " >
                        Enviar
                    </button>
                </div>
            </form>
        </div>
    )
}