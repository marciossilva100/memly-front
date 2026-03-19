import { useState, useEffect } from "react"
import youtubeIcone from '../assets/img/youtube.png'
import playstoreIcone from '../assets/img/app.png'
import instagramIcone from '../assets/img/instagram.png'
import tiktokIcone from '../assets/img/tiktok.png'
import googleIcone from '../assets/img/google.png'
import linkedinIcone from '../assets/img/linkedin.png'
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"
import { useAuth } from "../context/AuthContext";
import { Navigate,useNavigate } from "react-router-dom";


export default function ReferenciaUsuario({ setTitulo }) {

    const { user, setUser } = useAuth();
    const [finishStep, setFinishStep] = useState(false)

    const navigate = useNavigate();

    if (user?.step > 2) {
        return <Navigate to="/home" replace />
    }



    // useEffect(() => {
    //     setUser(prev => ({
    //         ...prev,
    //         step: 3
    //     }));
    // }, [])

    function enviarCanal(rede) {

        fetch('https://api.zaldemy.com/controller/canalaquisicao.php',
            {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },

                body: JSON.stringify({
                    action: 'register_channel',
                    rede_social: rede
                })
            }
        )
            .then(res => res.json())
            .then(data => {
                setUser(prev => ({
                    ...prev,
                    step: 3
                }));
                navigate("/home")

                console.log(data)
            })
            .catch(() => {
                console.log('Erro ao conectar com o servidor');
            });

    }


    return (
        <div className="h-[calc(100svh-41px)] overflow-hidden flex flex-col px-10 pt-6 pb-[env(safe-area-inset-bottom)]">

            <div className="w-full max-w-md mx-auto text-center mb-6">
                <div className="flex justify-center mb-3">
                    <img src={imgChapeuFormatura} alt="Chapeu formatura" className="w-28" />
                </div>
                <h4 className="text-lg font-medium text-slate-700">
                    Como ficou conhecendo a gente?
                </h4>
            </div>

            <div className="w-full max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-4">

                    <button
                        onClick={() => enviarCanal('playstore')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                    >
                        <img src={playstoreIcone} alt="Play Store" className="w-10 h-10 object-contain" />
                        <span className="text-md font-medium text-gray-700">Play Store</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('youtube')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                    >
                        <img src={youtubeIcone} alt="YouTube" className="w-10 h-10 object-contain" />
                        <span className="text-md font-medium text-gray-700">YouTube</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('instagram')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                    >
                        <img src={instagramIcone} alt="Instagram" className="w-10 h-10 object-contain" />
                        <span className="text-md font-medium text-gray-700">Instagram</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('linkedin')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                    >
                        <img src={linkedinIcone} alt="LinkedIn" className="w-10 h-10 object-contain" />
                        <span className="text-md font-medium text-gray-700">LinkedIn</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('tiktok')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                    >
                        <img src={tiktokIcone} alt="TikTok" className="w-10 h-10 object-contain" />
                        <span className="text-md font-medium text-gray-700">TikTok</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('google')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                    >
                        <img src={googleIcone} alt="Google" className="w-10 h-10 object-contain" />
                        <span className="text-md font-base text-gray-700">Google</span>
                    </button>

                </div>
            </div>

        </div>
    )
}