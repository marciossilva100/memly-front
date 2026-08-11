import { useState, useEffect } from "react"
import youtubeIcone from '../assets/img/youtube.png'
import playstoreIcone from '../assets/img/app.png'
import instagramIcone from '../assets/img/instagram.png'
import tiktokIcone from '../assets/img/tiktok.png'
import googleIcone from '../assets/img/google.png'
import linkedinIcone from '../assets/img/linkedin.png'
import tandemIcone from '../assets/img/tandem.png'
import speakyIcone from '../assets/img/speaky.png'
import imgChapeuFormatura from "../assets/img/chapeu_formatura-v2.png"
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";


export default function ReferenciaUsuario({ setTitulo }) {
    const { t } = useTranslation();

    const { user, setUser, checkAuth } = useAuth();
    const [erro, setErro] = useState('');
    const [finishStep, setFinishStep] = useState(false)
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.fromBack) return;

        if (user?.step > 3) {
            navigate("/home", { replace: true });
        } else if (user?.step === 3) {
            navigate("/onboarding-tutorial", { replace: true });
        } else if (user?.step > 1 && !user?.nivel) {
            navigate("/escolhernivel", { replace: true });
        } else if (user?.step > 1 && user?.nivel && !user?.interesses_definidos) {
            navigate("/escolhercategorias", { replace: true });
        }
    }, [user]);

    useEffect(() => {
        console.log("USER ATUALIZADO:", user);
    }, [user]);

    // useEffect(() => {
    //     setUser(prev => ({
    //         ...prev,
    //         step: 3
    //     }));
    // }, [])

    function enviarCanal(rede) {

        fetch(`${API_URL}/controller/canalaquisicao.php`,
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
            .then(async (data) => {
                // Sem essa checagem, uma resposta success:false (ex: canal já
                // registrado antes, corrida de clique duplo) ainda avançava a
                // tela normalmente - o step=3 só existia no estado local dessa
                // aba, nunca era persistido. Fechar e reabrir o app buscava o
                // step de verdade do servidor (ainda o antigo) e mandava o
                // usuário de volta pra essa mesma tela, mesmo já tendo
                // "passado" por ela na sessão anterior.
                if (!data.success) {
                    setErro(data.message || t("server_connection_error"));
                    return;
                }

                setUser(prev => ({
                    ...prev,
                    step: 3
                }));
                // Mesmo padrão das outras telas de onboarding (EscolherNivel,
                // EscolherIdiomaAprender, EscolherCategoriasInteresse):
                // resincroniza com o servidor antes de seguir, em vez de só
                // confiar no patch local.
                await checkAuth(true);

                navigate("/onboarding-tutorial")
            })
            .catch(() => {
                setErro(t("server_connection_error"));
            });

    }


    return (
        <div className="h-dvh overflow-hidden flex flex-col px-10 pt-6 pb-[env(safe-area-inset-bottom)] from-gray-900 to-gray-800 bg-gradient-to-br">

            <div className="relative mb-2">
                <div
                    className="left-0 cursor-pointer inline-block"
                    onClick={() => navigate("/escolhercategorias", { state: { fromBack: true } })}
                >
                    <i className="bi bi-arrow-left text-2xl text-white"></i>
                </div>
            </div>

            <div className="w-full max-w-md mx-auto text-center mb-6">
                <div className="flex justify-center mb-3">
                    <img src={imgChapeuFormatura} alt="Chapeu formatura" className="w-28" />
                </div>
                <h4 className="text-lg font-medium text-white">
                    {t("how_did_you_hear_about_us")}
                </h4>
            </div>

            <div className="w-full max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-4">

                    <button
                        onClick={() => enviarCanal('playstore')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm  border border-gray-700  hover:bg-white/5 transition"
                    >
                        <img src={playstoreIcone} alt="Play Store" className="w-7 h-7 object-contain" />
                        <span className="text-sm font-medium text-white">Play Store</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('youtube')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm  border border-gray-700  hover:bg-white/5 transition"
                    >
                        <img src={youtubeIcone} alt="YouTube" className="w-7 h-7 object-contain" />
                        <span className="text-sm font-medium text-white">YouTube</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('instagram')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm  border border-gray-700  hover:bg-white/5 transition"
                    >
                        <img src={instagramIcone} alt="Instagram" className="w-7 h-7 object-contain" />
                        <span className="text-sm font-medium text-white">Instagram</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('linkedin')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm  border border-gray-700  hover:bg-white/5 transition"
                    >
                        <img src={linkedinIcone} alt="LinkedIn" className="w-7 h-7 object-contain" />
                        <span className="text-sm font-medium text-white">LinkedIn</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('tiktok')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm  border border-gray-700 hover:bg-white/5 transition"
                    >
                        <img src={tiktokIcone} alt="TikTok" className="w-7 h-7 object-contain" />
                        <span className="text-sm font-medium text-white">TikTok</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('google')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm  border border-gray-700  hover:bg-white/5 transition"
                    >
                        <img src={googleIcone} alt="Google" className="w-7 h-7 object-contain" />
                        <span className="text-sm font-base text-white">Google</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('tandem')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm  border border-gray-700  hover:bg-white/5 transition"
                    >
                        <img src={tandemIcone} alt="Tandem" className="w-7 h-7 object-contain rounded-full" />
                        <span className="text-sm font-medium text-white">Tandem</span>
                    </button>

                    <button
                        onClick={() => enviarCanal('speaky')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm  border border-gray-700  hover:bg-white/5 transition"
                    >
                        <img src={speakyIcone} alt="Speaky" className="w-7 h-7 object-contain rounded-full" />
                        <span className="text-sm font-medium text-white">Speaky</span>
                    </button>

                </div>

                {erro && (
                    <div className="bg-red-100 text-red-700 text-sm px-3 py-2 rounded mt-4">
                        {erro}
                    </div>
                )}
            </div>

        </div>
    )
}