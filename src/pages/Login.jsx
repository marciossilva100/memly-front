import { useEffect, useState } from 'react'
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Mail, Smartphone, Download, Share2, Globe } from "lucide-react";
import imgLogin from '../assets/img/img-login.png'
import imgGoogle from '../assets/img/google.png'
import imgFacebook from '../assets/img/logo-face.webp'
import imgCoruja from '../assets/img/coruja.png'
import imgMemly from "../assets/img/mascote-memly.png"
import imgZaldemy from "../assets/img/zaldemy.png"
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleLogin } from '@react-oauth/google';
import axios from "axios";

export default function Login({ setTitulo }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [finish, setFinish] = useState(false)
    const { checkAuth } = useAuth();
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { user,setUser } = useAuth(); 

    const [form, setForm] = useState({
        email: '',
        password: ''
    })
    const [erro, setErro] = useState('')

    // useEffect(() => {
    //     if (!user) return;

    //     if (user.step > 2) {
    //         navigate("/home", { replace: true });
    //     } else {
    //         navigate("/escolheridioma");
    //     }
    // }, [user]);

    useEffect(() => {
        setTitulo('Login')
    }, [])

    useEffect(() => {
        setTitulo('Login')

        // Detectar se é iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        // Detectar se está rodando como app instalado (standalone)
        const standalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        setIsStandalone(standalone);

        // Detectar se é mobile
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(mobile);

        const handler = (e) => {
            e.preventDefault()
            setInstallPrompt(e)
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => {
            window.removeEventListener("beforeinstallprompt", handler)
        }

    }, [])

    async function instalarApp() {
        if (!installPrompt) return

        installPrompt.prompt()

        const choice = await installPrompt.userChoice

        if (choice.outcome === "accepted") {
            console.log("Usuário instalou o app")
        }

        setInstallPrompt(null)
    }

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {

            try {

                const res = await fetch('https://api.zaldemy.com/controller/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'login_google',
                        token: tokenResponse.access_token
                    })
                });

                const data = await res.json();

                console.log("DATA:", data);

                if (!data.sucesso) {
                    setErro(data.erro || "Erro ao fazer login com Google");
                    return;
                }

                localStorage.setItem("token", data.token);

                console.log("ANTES DO CHECKAUTH");
                console.log('dados ', data);

                await checkAuth();

                //await checkAuth();
                // setUser({
                //     id: data.user_id,
                //     name: data.nome,
                //     email: data.email,
                //     step: data.step
                // });

                // setTimeout(() => {
                //     checkAuth();
                // }, 0);
                // if (data.step > 2) {
                //     setFinishStep(true)

                // }

                // if (data.step > 2) {
                //     navigate("/home", { replace: true })
                //     return
                // }


                // navigate("/escolheridioma");

            } catch (error) {
                setErro('Erro ao conectar com o servidor');
            }

        },

        onError: () => {
            setErro("Erro ao autenticar com Google");
        }
    });

    function handleChange(e) {
        setForm({
            ...form, [e.target.name]: e.target.value
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()

        if (loading) return

        if (!form.email) {
            setErro('O email deve ser preenchido')
            return
        }

        if (!form.password) {
            setErro('Digite a senha')
            return
        }

        await validate()
    }

    async function validate() {

        setLoading(true)

        try {
            const res = await fetch('https://api.zaldemy.com/controller/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email: form.email,
                    password: form.password,
                })
            });

            const data = await res.json();

            if (!data.sucesso) {
                setErro(data.erro || "Erro ao fazer login")
                return
            }

            localStorage.setItem("token", data.token);
            await checkAuth();

           // setUser(data.usuario);

            // setTimeout(() => {
            //     checkAuth();
            // }, 0);

            console.log('dados ', data);

            // if (data.usuario.step > 2) {
            //     navigate("/home", { replace: true })
            //     return
            // }

            // navigate("/escolheridioma")

        } catch (error) {
            setErro('Erro ao conectar com o servidor')
        } finally {
            setLoading(false)
        }
    }

    // if (finishStep) {
    //     console.log('passou aqui 1')

    //     navigate("/home")
    //     return
    // }





    // Se for mobile e não estiver instalado como app, mostrar apenas tela de instalação
    if (isMobile && !isStandalone) {
        return (
            <div className="max-w-6xl mx-auto px-8 section-login py-4 h-dvh flex items-center">
                <div className="flex-1 justify-center overflow-y-auto scrollbar-hide ">
                    <div className="w-full max-w-md text-center">

                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <img width={250} src={imgZaldemy} alt="Zaldemy" />
                        </div>

                        {/* Mascote */}
                        {/* <div className="flex justify-center mb-6">
                            <img width={150} src={imgMemly} alt="Memly - Mascote Zaldemy" className="animate-bounce" />
                        </div> */}

                        <h2 className="text-[#085078] text-2xl font-bold mb-4">
                            📱 Instale nosso App
                        </h2>

                        <p className="text-gray-600 mb-8">
                            Para uma experiência completa, instale o Zaldemy em seu dispositivo
                        </p>

                        {isIOS ? (
                            // Instruções para iPhone/iPad
                            <div className="bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-2xl p-6 border border-[#4cb8c4]/20">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-[#4cb8c4] p-3 rounded-full">
                                        <Share2 className="w-8 h-8 text-white" />
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-[#085078] mb-3">
                                    Como instalar no iPhone/iPad
                                </h3>

                                <div className="space-y-4 text-left">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-[#085078] font-bold text-sm">1</span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Toque no <span className="font-semibold">botão Compartilhar</span> <Share2 className="w-4 h-4 inline text-[#4cb8c4]" /> na barra do Safari
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-[#085078] font-bold text-sm">2</span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Role para baixo e selecione <span className="font-semibold">"Adicionar à Tela de Início"</span>
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-[#085078] font-bold text-sm">3</span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Toque em <span className="font-semibold">"Adicionar"</span> no canto superior direito
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 p-3 bg-white/50 rounded-lg">
                                    <p className="text-xs text-gray-500">
                                        <Globe className="w-3 h-3 inline mr-1" />
                                        Após instalar, o Zaldemy funcionará como um app nativo!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            // Botão de instalação para Android/outros (com as cores da marca)
                            <button
                                onClick={installPrompt ? instalarApp : null}
                                disabled={!installPrompt}
                                className={`w-full bg-gradient-to-r from-[#4cb8c4] to-[#085078] text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3 group ${!installPrompt ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Download className="w-5 h-5 group-hover:animate-bounce" />
                                <span>Instalar aplicativo Zaldemy</span>
                                <Smartphone className="w-5 h-5" />
                            </button>
                        )}

                        {!isIOS && !installPrompt && (
                            <p className="text-sm text-gray-500 mt-4">
                                💡 O botão aparecerá quando o aplicativo estiver disponível para instalação
                            </p>
                        )}

                        {/* Link para versão web */}
                        <div className="mt-8">
                            <button
                                onClick={() => setIsStandalone(true)} // Força mostrar login
                                className="text-[#4cb8c4] hover:text-[#085078] transition-colors text-sm underline"
                            >
                                Continuar na versão web
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Tela de login normal (para desktop ou quando já está instalado)
    return (
        <div className="max-w-6xl mx-auto px-8 section-login py-4 h-dvh flex items-center">
            <div className="flex-1 justify-center overflow-y-auto scrollbar-hide ">
                <div className="w-full max-w-md text-center">

                    <div className="flex justify-center mb-2">
                        <img width={200} src={imgZaldemy} alt="Login" />
                    </div>

                    <h2 className="text-slate-500 text-2xl font-semibold">
                        Bem-vindo!
                    </h2>

                    <h5 className="text-sm text-gray-600">
                        Faça o login para continuar
                    </h5>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                        {/* Email */}
                        <div className="flex items-center border rounded-full overflow-hidden py-3">
                            <span className="px-3 text-gray-500 ">
                                <i className="bi bi-envelope ps-2"></i>
                            </span>
                            <input
                                type="email"
                                className="outline-none bg-white flex-1"
                                name='email'
                                placeholder="Email"
                                value={form.email}
                                onChange={(e) => handleChange(e)}
                            />
                        </div>

                        {/* Senha */}
                        <div>
                            <div className="flex items-center border overflow-hidden rounded-full py-3">
                                <span className="px-3 text-gray-500">
                                    <i className="bi bi-lock ps-2"></i>
                                </span>

                                <input
                                    type="password"
                                    className="flex-1 outline-none"
                                    name='password'
                                    placeholder="Senha"
                                    value={form.password}
                                    onChange={(e) => handleChange(e)}
                                />
                            </div>

                            <div className="text-right mt-2">
                                <Link to="/esquecisenha">
                                    <small className="text-primary-aux">
                                        Esqueceu a senha?
                                    </small>
                                </Link>
                            </div>
                        </div>

                        {/* Erro */}
                        {erro && (
                            <div className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded">
                                {erro}
                            </div>
                        )}

                        {/* Botão Entrar */}
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-[#4cb8c4] text-white py-3 rounded-full fw-800"
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>

                    {/* Divisor */}
                    <div className="flex items-center my-6">
                        <div className="flex-grow border-t"></div>
                        <span className="mx-3 text-gray-400 text-sm">
                            Ou entre com
                        </span>
                        <div className="flex-grow border-t"></div>
                    </div>

                    {/* Google */}
                    <button
                        onClick={() => login()}
                        className="text-sm w-full border border-gray-300 py-2 rounded-full flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                        <img src={imgGoogle} alt="Google icone" width={30} />
                        <span className="ff-inter">Entrar com Google</span>
                    </button>

                    <br />

                    {/* Facebook */}
                    <button className="text-sm w-full bg-[#1877f2] hover:bg-[#0d65d9] text-white py-2 rounded-full flex items-center justify-center gap-3 transition-colors">
                        <img src={imgFacebook} alt="Facebook icone" width={30} className="rounded-full" />
                        <span className="ff-inter">Entrar com Facebook</span>
                    </button>

                    <br />

                    <p className="text-sm">
                        Não tem uma conta?{' '}
                        <Link
                            to="/cadastrar"
                            className="underline text-[#4cb8c4] hover:text-[#085078] transition-colors"
                        >
                            Cadastrar
                        </Link>
                    </p>

                    {/* Botão de instalação para desktop (opcional) */}
                    {installPrompt && !isMobile && (
                        <button
                            onClick={instalarApp}
                            className="mt-6 w-full bg-gradient-to-r from-[#4cb8c4] to-[#085078] text-white px-4 py-3 rounded-full text-sm font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
                        >
                            <Download className="w-4 h-4" />
                            <span>📲 Instalar aplicativo</span>
                        </button>
                    )}

                </div>
            </div>
        </div>
    )
}