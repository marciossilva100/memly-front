import { useState, useEffect, useRef } from "react"
import { Volume, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { playAudio } from "../utils/audioPlayer";
import { useAuth } from "../context/AuthContext";


export default function () {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null)
    const [question, setQuestion] = useState('')
    const [response, setResponse] = useState('')
    const [answer, setAnswer] = useState('')
    const jaBuscou = useRef(false);
    const [textLoading, setTextLoading] = useState('')
    const navigate = useNavigate();
    const { user, setUser } = useAuth();

    useEffect(() => {

        /*Teste*/
        // setResponse(' when an unknown printer took a galley of  It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.');
        // return

        if (jaBuscou.current) return;
        jaBuscou.current = true;
        //   if (jaBuscou.current) return;
        //jaBuscou.current = true;
        setTextLoading('Gerando treino...')
        setLoading(true);
        setError(null);

        fetch('https://zaldemy.com/controller/DailyQuestionController.php', {
            method: 'GET',
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
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
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

    function tryAgain(e) {
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
    // const speakText = (e) => {
    //     e.preventDefault()
    //     if ('speechSynthesis' in window) {
    //         const utterance = new SpeechSynthesisUtterance(question);
    //         utterance.lang = 'en-US'; // ou 'en-US' para inglês
    //         window.speechSynthesis.speak(utterance);
    //     } else {
    //         console.warn('Speech Synthesis não suportado nesse navegador.');
    //     }
    // };

    return (
        <div className="p-4 justify-center  w-full px-6 h-dvh flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-hide ">
                <div className="relative  mb-6">

                    <div
                        className=" cursor-pointer"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-2xl"></i>
                    </div>

                </div>
                {response &&
                    <form action="" onSubmit={handleSubmit} className="w-full " id="responderForm">
                        <div>

                            <div className="flex border p-4 text-center shadow-md overflow-y-auto  relative justify-between bg-white-800  rounded-lg min-h-80 flex items-center">
                                <p className="text-md text-lg">{response}</p>
                            </div>

                        </div>

                    </form>
                }
                {!response &&
                    <form action="" onSubmit={handleSubmit} className="w-full" id="respostaForm">
                        <div>

                            <div className="flex border p-6 text-center shadow-md relative justify-between bg-gradient-to-r from-[#4cb8c4] to-[#085078] text-white rounded-lg min-h-80 flex items-center justify-center">
                                <p className="text-2xl">{question}</p>
                            </div>

                            <div className="text-center w-full justify-center flex mt-5 ">
                                <button onClick={(e) => {
                                    e.preventDefault();
                                    playAudio(question, user);
                                }} className="
                     
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
                        <div className=" bg-white  bottom-0 left-0 w-full justify-center items-center py-4 text-center">
                            <div className=" mt-3">
                                {/*               <input onChange={(e) => setAnswer(e.target.value)} type="text" className="w-full px-3 py-2 outline-none" placeholder="Resposta" /> */}
                                <textarea

                                    onChange={(e) => setAnswer(e.target.value)}
                                    className="
                            w-full
                                mb-6
                                text-lg
                                focus:outline-none focus:ring-0 
                                toutline-none
                                h-32
                                pt-6
                                text-center
                                focus:outline-none
                            
                                rounded-lg border border-gray-300
                                resize-none transition
                            "
                                />
                            </div>

                        </div>
                    </form>


                }

            </div>
            {!response &&
                <div className=" bg-white sticky bottom-0 left-0 w-full justify-center items-center py-4 text-center">


                    <button form="respostaForm" className="
                            px-6
                            py-3
                            rounded-full
                            bg-[#4cb8c4]
                            text-white
                            font-medium
                            hover:bg-blue-600
                            transition
                            w-full
                            "
                        type="submit"

                    >
                        Enviar
                    </button>
                </div>
            }
            {response &&
                <div className=" bg-white sticky bottom-0 left-0 w-full justify-center items-center py-4 text-center">

                    <button form="responderForm" onClick={(e) => tryAgain(e)} className="
                                px-6
                                py-3
                                w-full
                                rounded-full
                                bg-red-400
                                text-lg
                                text-white
                                font-medium
                                hover:bg-blue-600
                                transition
                                " >
                        Tentar novamente
                    </button>
                </div>
            }
        </div>

    )
}