import { useState, useEffect, useRef } from "react"
import { Volume, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";


export default function () {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null)
    const [question, setQuestion] = useState('')
    const [response, setResponse] = useState('')
    const [answer, setAnswer] = useState('')
    const jaBuscou = useRef(false);
    const [textLoading, setTextLoading] = useState('')
    const navigate = useNavigate();

    useEffect(() => {
        // setResponse('Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.');

        //  return
        if (jaBuscou.current) return;
        jaBuscou.current = true;
        //   if (jaBuscou.current) return;
        //jaBuscou.current = true;
        setTextLoading('Gerando treino...')
        setLoading(true);
        setError(null);

        fetch('https://zaldemy.com/controller/DailyQuestionController.php', {
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
              //  setQuestion('teste');

            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        setTextLoading('Processando resposta...')

        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/controller/DailyQuestionController.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, answer })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            if (!data.success) throw new Error(data.error);
            setLoading(false);

            setResponse(data.feedback);
            setAnswer(false)
        } catch (err) {
            console.error(err);
        }
    };

    function tryAgain(e){
        jaBuscou.current = true;
        e.preventDefault()
        setResponse('')
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-70px)] flex items-center justify-center">
                <Loader2 className="animate-spin mr-2 w-8 h-8 text-indigo-600" />
                <span className="text-slate-600 text-lg">{textLoading}</span>
            </div>
        );
    }

    // Função para pronunciar o texto traduzido
    const speakText = (e) => {
        e.preventDefault()
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(question);
            utterance.lang = 'en-US'; // ou 'en-US' para inglês
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech Synthesis não suportado nesse navegador.');
        }
    };

    return (
        <div className="p-4 justify-center  w-full px-6">
            <div className="relative  mb-6">

                <div
                    className=" cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-xl"></i>
                </div>

            </div>
            {response &&
            <form action="" onSubmit={handleSubmit} className="w-full ">
                <div>

                    <div className="flex border p-4 text-center shadow-md overflow-y-auto  relative justify-between bg-white-800  rounded-lg h-[calc(100vh-160px)] flex items-center">
                        <p className="text-md">{response}</p>
                    </div>

                </div>
                <div className=" bg-white fixed bottom-0 left-0 w-full justify-center items-center py-4 text-center">
                 
                    <button onClick={(e)=>tryAgain(e)} className="
                        px-6
                        py-3
                        rounded-full
                        bg-blue-500
                        text-white
                        font-medium
                        hover:bg-blue-600
                        transition
                        " >
                        Tentar novamente
                    </button>
                </div>
            </form>
            }
            {!response &&
            <form action="" onSubmit={handleSubmit} className="w-full">
                <div>

                    <div className="flex border p-4 text-center shadow-md relative justify-between bg-purple-800 text-white rounded-lg h-60 flex items-center">
                        <p className="text-xl">{question}</p>
                    </div>

                    <div className="text-center w-full justify-center flex mt-5 ">
                        <button onClick={(e)=>speakText(e)} className="
                     
                    px-4 flex
                    py-2
                    rounded-md
                    bg-slate-400
                    text-white
                    text-sm
                    hover:bg-blue-600
                    transition
                    " >
                            <Volume className="text-sm   w-5 h-5 p-0" />

                            Ouvir
                        </button>
                    </div>



                </div>
                <div className=" bg-white fixed bottom-0 left-0 w-full justify-center items-center py-4 text-center">
                    <div className=" mt-3 px-6">
                        {/*               <input onChange={(e) => setAnswer(e.target.value)} type="text" className="w-full px-3 py-2 outline-none" placeholder="Resposta" /> */}
                        <textarea

                            onChange={(e) => setAnswer(e.target.value)}
                            className="
                            w-full
                                mb-6
                                text-lg
                                focus:outline-none focus:ring-0 
                                h-32
                                pt-6
                                text-center
                                focus:outline-none
                                focus:ring-2 focus:ring-blue-500
                                rounded-lg border border-gray-300
                                resize-none transition
                            "
                        />
                    </div>

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
            }
        </div>
    )
}