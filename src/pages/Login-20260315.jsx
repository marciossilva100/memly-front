import { useEffect, useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
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


    const [form, setForm] = useState({
        email: '',
        password: ''
    })
    const [erro, setErro] = useState('')

    useEffect(() => {
        setTitulo('Login')
    }, [])

    useEffect(() => {
        setTitulo('Login')

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

                await checkAuth();

                console.log("DEPOIS DO CHECKAUTH");

                navigate("/escolheridioma");

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

        //  setErro('')

    }

    async function validate() {

        setLoading(true)

        try {
            const res = await fetch('https://api.zaldemy.com/controller/auth.php', {
                method: 'POST',
                // credentials: "include",
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

            console.log("DATA:", data)

            if (!data.sucesso) {
                setErro(data.erro || "Erro ao fazer login")
                return
            }

            localStorage.setItem("token", data.token);

            await checkAuth()

            navigate("/escolheridioma")




        } catch (error) {
            setErro('Erro ao conectar com o servidor')
        } finally {
            setLoading(false)
        }


    }

    //if (finish) return;



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
                            {/* <Mail size={20} className='ps-2'></Mail> */}
                            <input
                                type="email"
                                className="   outline-none bg-white"
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
                                    className="w-full outline-none"
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
                            className="w-full bg-[#4cb8c4] text-white py-3 rounded-full fw-800 "
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
                    {/* <button className="text-sm w-full border border-gray-300 py-2 rounded-full flex items-center justify-center gap-3">
                        <img src={imgGoogle} alt="Google icone" width={30} />
                        <span className="ff-inter">Entrar com Google</span>
                    </button> */}
                    <button
                        onClick={() => login()}
                        className="text-sm w-full border border-gray-300 py-2 rounded-full flex items-center justify-center gap-3"
                    >
                        <img src={imgGoogle} alt="Google icone" width={30} />
                        <span className="ff-inter">Entrar com Google</span>
                    </button>
                    <br />

                    {/* Facebook */}
                    <button className="text-sm w-full bg-blue-500 hover:bg-blue-700 text-white py-2 rounded-full flex items-center justify-center gap-3">
                        <img src={imgFacebook} alt="Facebook icone" width={30} />
                        <span className="ff-inter">Entrar com Facebook</span>
                    </button>

                    <br />

                    <p className="text-sm">
                        Não tem uma conta?{' '}
                        <Link
                            to="/cadastrar"
                            className="underline text-primary link-offset-2"
                        >
                            Cadastrar
                        </Link>
                    </p>

                    {installPrompt && (
                        <button
                            onClick={instalarApp}
                            className="mb-4 bg-green-600 text-white px-4 py-2 rounded-full text-sm"
                        >
                            📲 Instalar aplicativo
                        </button>
                    )}

                </div>
            </div>
        </div>
    )
}
