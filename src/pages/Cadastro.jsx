import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import imgZaldemy from "../assets/img/zaldemy.png"
import imgGoogle from '../assets/img/google.png'
import imgFacebook from '../assets/img/logo-face.webp'
import { useGoogleLogin } from '@react-oauth/google';
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"
import { useAuth } from "../context/AuthContext";
import { isNativePlatform, signInWithGoogleNative } from "../utils/googleNativeAuth";
import { startGoogleRedirectLogin, consumeGoogleRedirectToken } from "../utils/googleRedirectAuth";

export default function Cadastro({ setTitulo }) {
    const { t } = useTranslation();
    const { syncAuth } = useAuth();

    const [loading, setLoading] = useState(false);
    const [finish, setFinish] = useState(false)
    const API_URL = import.meta.env.VITE_API_URL;
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirm_password: ''
    })

    const [erro, setErro] = useState('')
    const [isStandalone, setIsStandalone] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setTitulo(t("sign_up"))

        const standalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            isNativePlatform();
        setIsStandalone(standalone);
    }, [])

    // Ao voltar do redirecionamento do Google (fluxo usado no PWA instalado),
    // o access_token vem na hash da URL
    useEffect(() => {
        const accessToken = consumeGoogleRedirectToken();
        if (accessToken) {
            handleGoogleAccessToken(accessToken);
        }
    }, [])

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    async function handleGoogleAccessToken(accessToken) {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/controller/auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login_google',
                    token: accessToken
                })
            });

            const data = await res.json();

            if (!data.sucesso) {
                setErro(data.erro || t("google_login_error"));
                setLoading(false);
                return;
            }

            // Usa syncAuth em vez de checkAuth e confirma que o usuário
            // foi realmente autenticado antes de navegar para uma rota privada
            const loggedUser = await syncAuth(data.token);

            if (!loggedUser) {
                setErro(t("google_login_error"));
                setLoading(false);
                return;
            }

            if (loggedUser.step > 2) {
                navigate("/home", { replace: true });
            } else {
                navigate("/escolheridioma", { replace: true });
            }

        } catch (error) {
            console.error(error);
            setErro(t("server_connection_error"));
            setLoading(false);
        }
    }

    // Fluxo web (popup do Google Identity Services) — não funciona dentro
    // da WebView do Capacitor, por isso o app nativo usa signInWithGoogleNative.
    const loginWeb = useGoogleLogin({
        onSuccess: (tokenResponse) => handleGoogleAccessToken(tokenResponse.access_token),
        onError: () => {
            setErro(t("google_login_error"));
        },
    });

    async function login() {
        if (isNativePlatform()) {
            try {
                const accessToken = await signInWithGoogleNative();
                await handleGoogleAccessToken(accessToken);
            } catch (error) {
                console.error(error);
                setErro(t("google_login_error"));
            }
            return;
        }

        // PWA instalado (standalone): o popup do Google não consegue se
        // comunicar de volta com o app, então usamos redirecionamento de página inteira
        if (isStandalone) {
            startGoogleRedirectLogin("/cadastrar");
            return;
        }

        loginWeb();
    }

    function handleSubmit(e) {
        e.preventDefault()

        if (!form.name) {
            setErro(t("name_required"))
            return
        }

        if (!form.email) {
            setErro(t("email_required"))
            return
        }

        if (!form.password) {
            setErro(t("enter_password"))
            return
        }

        if (!form.confirm_password) {
            setErro(t("enter_password_confirm"))
            return
        }

        setErro('')
        cadastrar()
    }

    function cadastrar() {
        setLoading(true)

        fetch(`${API_URL}/controller/auth.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'register',
                name: form.name,
                email: form.email,
                password: form.password,
                confirm_password: form.confirm_password
            })
        })
            .then(res => res.json())
            .then(data => {

                if (data.erro) {
                    setLoading(false)
                    setErro(data.erro)
                    return
                }

                setFinish(true)
                setLoading(false)

                navigate(`/verificaremail`, {
                    state: { email: form.email }
                })

            })
            .catch(() => {
                setErro(t("server_connection_error"))
            })
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br">
                <img
                    src={imgChapeuFormatura}
                    alt={t("loading")}
                    className="w-28 animate-pulse"
                />
            </div>
        );
    }

    if (finish) return;

    return (
        <div className="max-w-6xl mx-auto px-4 px-8 py-4 h-screen from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex justify-center">
                <div className="w-full max-w-md text-center mt-4">

                    <div className="flex justify-center mb-2">
                        <img width={200} src={imgZaldemy} alt="Login" />
                    </div>

                    <h5 className="text-sm text-white">
                        {t("do_your_signup")}
                    </h5>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">

                        {/* Nome */}
                        <div className="flex items-center border rounded-full overflow-hidden py-3 ">
                            <input
                                type="text"
                                className="w-full px-4 outline-none bg-white flex-1 !bg-transparent text-white"
                                placeholder={t("name")}
                                name="name"
                                value={form.name}
                                onChange={(e) => {
                                    handleChange(e)
                                    setErro('')
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div className="flex items-center border rounded-full overflow-hidden py-3">
                            <input
                                type="email"
                                className="w-full px-4 outline-none bg-white flex-1 !bg-transparent text-white"
                                placeholder={t("email")}
                                name="email"
                                value={form.email}
                                onChange={(e) => {
                                    handleChange(e)
                                    setErro('')
                                }}
                            />
                        </div>

                        {/* Senha */}
                        <div className="flex items-center border rounded-full overflow-hidden py-3 px-3">

                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full px-2 outline-none bg-white flex-1 !bg-transparent text-white"
                                placeholder={t("password")}
                                name="password"
                                value={form.password}
                                onChange={(e) => {
                                    handleChange(e)
                                    setErro('')
                                }}
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-500"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>

                        </div>

                        {/* Confirmar senha */}
                        <div className="flex items-center border rounded-full overflow-hidden py-3 px-3">

                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="w-full px-2 outline-none bg-white flex-1 !bg-transparent text-white"
                                placeholder={t("confirm_password_placeholder")}
                                name="confirm_password"
                                value={form.confirm_password}
                                onChange={(e) => {
                                    handleChange(e)
                                    setErro('')
                                }}
                            />

                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="text-gray-500"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>

                        </div>

                        {erro && (
                            <div className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded">
                                {erro}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-[#4cb8c4] text-white py-3 rounded-full fw-800 text-lg"
                        >
                            {t("sign_up_button")}
                        </button>

                    </form>

                    <div className="flex items-center my-6">
                        <div className="flex-grow border-t"></div>
                        <span className="mx-3 text-white text-sm">
                            {t("or_signup_with")}
                        </span>
                        <div className="flex-grow border-t"></div>
                    </div>

                    <button
                        onClick={() => login()}
                        className="text-sm w-full border border-gray-300 py-2 rounded-full flex items-center justify-center gap-3  transition-colors"
                    >
                        <img src={imgGoogle} alt="Google icone" width={30} />
                        <span className="ff-inter text-white">{t("continue_with_google")}</span>
                    </button>

                    <br />

                    {/* <button className="text-sm w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full flex items-center justify-center gap-3">
                        <img src={imgFacebook} alt="Facebook icone" width={20}/>
                        {t("continue_with_facebook")}
                    </button> */}

                    <br />

                    <p className="text-sm text-white">
                        {t("already_have_account")}{' '}
                        <Link to="/login" className="underline text-[#4cb8c4] hover:text-[#085078] transition-colors">
                            {t("sign_in")}
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    )
}