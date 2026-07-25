import { useEffect, useState } from 'react'
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Mail, Download, Globe } from "lucide-react";
import imgGoogle from '../assets/img/google.png'
import imgFacebook from '../assets/img/logo-face.webp'
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"
import imgZaldemy from "../assets/img/zaldemy.png"
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from '@react-oauth/google';
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";
import { useTranslation, Trans } from "react-i18next";
import { isNativePlatform, signInWithGoogleNative } from "../utils/googleNativeAuth";
import { startGoogleRedirectLogin, consumeGoogleRedirectToken } from "../utils/googleRedirectAuth";
import { isAdminEmail } from "../utils/adminEmails";
import { getInstallPrompt, onInstallPromptChange, clearInstallPrompt } from "../utils/pwaInstallPrompt";

export default function Login({ setTitulo }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [finish, setFinish] = useState(false)
    const { checkAuth, syncAuth } = useAuth();
    const [installPrompt, setInstallPrompt] = useState(() => getInstallPrompt());
    const [isStandalone, setIsStandalone] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [forceDesktop, setForceDesktop] = useState(false);
    const [showAdminGate, setShowAdminGate] = useState(false);
    const [adminGateEmail, setAdminGateEmail] = useState('');
    const [adminGateErro, setAdminGateErro] = useState('');
    const { user, setUser } = useAuth();
    const appUrl = "https://zaldem.com"; // troque pelo seu domínio
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        console.log("API:", import.meta.env.VITE_API_URL);
    }, []);

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
        setTitulo(t("login"))
    }, [])

    useEffect(() => {
        setTitulo(t("login"))

        // Detectar se está rodando como app instalado (standalone) ou como app nativo (Capacitor)
        const standalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            isNativePlatform();
        setIsStandalone(standalone);

        // Detectar se é mobile
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(mobile);

        const unsubscribe = onInstallPromptChange(setInstallPrompt)

        return () => {
            unsubscribe()
        }

    }, [])

    // Ao voltar do redirecionamento do Google (fluxo usado no PWA instalado),
    // o access_token vem na hash da URL
    useEffect(() => {
        const accessToken = consumeGoogleRedirectToken();
        if (accessToken) {
            handleGoogleAccessToken(accessToken);
        }
    }, [])

    async function instalarApp() {
        if (!installPrompt) return

        installPrompt.prompt()

        const choice = await installPrompt.userChoice

        if (choice.outcome === "accepted") {
            console.log("Usuário instalou o app")
        }

        clearInstallPrompt()
        setInstallPrompt(null)
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
            startGoogleRedirectLogin("/login");
            return;
        }

        loginWeb();
    }

    function handleChange(e) {
        setForm({
            ...form, [e.target.name]: e.target.value
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()

        if (loading) return

        if (!form.email) {
            setErro(t("email_required"))
            return
        }

        if (!form.password) {
            setErro(t("enter_password"))
            return
        }

        await validate()
    }

    async function validate() {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/controller/auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    email: form.email,
                    password: form.password,
                })
            });

            const data = await res.json();

            if (!data.sucesso) {
                setErro(data.erro || t("login_error"))
                return;
            }

            localStorage.setItem("token", data.token);
            const loggedUser = await checkAuth();

            if (!loggedUser) {
                setErro(t("login_error"));
                return;
            }

            if (loggedUser.step > 2) {
                navigate("/home", { replace: true });
            } else {
                navigate("/escolheridioma", { replace: true });
            }

        } catch (error) {
            setErro(t("server_connection_error"))
        } finally {
            setLoading(false)
        }
    }

    // if (finishStep) {
    //     console.log('passou aqui 1')

    //     navigate("/home")
    //     return
    // }

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

    // NOVA FUNCIONALIDADE: Se for acesso por desktop (não mobile), mostrar apenas QR Code
    if (!isMobile && !forceDesktop) {
        const currentUrl = window.location.href;

        return (
            <div className="w-full mx-auto px-8 section-login py-4 h-svh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col">
                    <div className="w-full max-w-md text-center m-auto">
                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <img width={240} src={imgZaldemy} alt="Zaldemy" />
                        </div>

                        <h2 className="text-[#41a9e3] text-2xl font-bold mb-4">
                            {t("access_from_phone")}
                        </h2>

                        <p className="text-white mb-6">
                            {t("scan_qr_instructions")}
                        </p>

                        {/* QR Code */}
                        <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-xl">
                            <QRCodeCanvas
                                value={currentUrl}
                                size={200}
                                bgColor="#ffffff"
                                fgColor="#085078"
                                level="H"
                                includeMargin={true}
                            />
                        </div>

                        {/* Instruções */}
                        <div className="bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-2xl p-6 border border-[#4cb8c4]/20 text-left">
                            <h3 className="text-lg font-semibold text-[#085078] mb-3 text-center">
                                {t("how_to_install_mobile")}
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#085078] font-bold text-sm">1</span>
                                    </div>
                                    <p className="text-sm text-white">
                                        {t("scan_qr_step")}
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#085078] font-bold text-sm">2</span>
                                    </div>
                                    <p className="text-sm text-white">
                                        <Trans i18nKey="iphone_step2" components={{ 1: <span className="font-semibold" /> }} />
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#085078] font-bold text-sm">3</span>
                                    </div>
                                    <p className="text-sm text-white">
                                        <Trans i18nKey="android_step3" components={{ 1: <span className="font-semibold" /> }} />
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="text-xs text-gray-400">
                                <Globe className="w-3 h-3 inline mr-1" />
                                {t("after_install_hint")}
                            </p>
                        </div>

                        {/* Acesso pelo computador: restrito ao e-mail de administrador */}
                        <div className="mt-8">
                            {!showAdminGate ? (
                                <button
                                    onClick={() => setShowAdminGate(true)}
                                    className="text-[#41a9e3] hover:text-[#085078] transition-colors text-sm underline"
                                >
                                    {t("continue_on_desktop")}
                                </button>
                            ) : (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (isAdminEmail(adminGateEmail)) {
                                            setForceDesktop(true);
                                        } else {
                                            setAdminGateErro(t("desktop_access_admin_only"));
                                        }
                                    }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <input
                                        type="email"
                                        value={adminGateEmail}
                                        onChange={(e) => {
                                            setAdminGateEmail(e.target.value);
                                            setAdminGateErro('');
                                        }}
                                        placeholder={t("email")}
                                        className="w-full max-w-xs rounded-lg border border-[#4cb8c4]/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#41a9e3]"
                                    />
                                    {adminGateErro && (
                                        <p className="text-xs text-red-400">{adminGateErro}</p>
                                    )}
                                    <button
                                        type="submit"
                                        className="text-[#41a9e3] hover:text-[#085078] transition-colors text-sm underline"
                                    >
                                        {t("confirm")}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Tela de login normal (para desktop ou quando já está instalado)
    return (
        <div className="max-w-6xl mx-auto px-8 section-login py-4 h-svh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col">
                <div className="w-full max-w-md text-center m-auto">

                    <div className="flex justify-center mb-2">
                        <img width={260} src={imgZaldemy} alt="Login" />
                    </div>

                    <h2 className="text-white text-2xl font-semibold ">
                        {t("welcome")}
                    </h2>

                    <h5 className="text-sm text-white">
                        {t("login_to_continue")}
                    </h5>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                        {/* Email */}
                        <div className="flex items-center border rounded-full overflow-hidden py-3">
                            <span className="px-3 text-gray-500 ">
                                <i className="bi bi-envelope ps-2 text-white"></i>
                            </span>
                            <input
                                type="email"
                                className="outline-none bg-white flex-1 !bg-transparent text-white"
                                name='email'
                                placeholder={t("email")}
                                value={form.email}
                                onChange={(e) => handleChange(e)}
                            />
                        </div>

                        {/* Senha */}
                        <div>
                            <div className="flex items-center border overflow-hidden rounded-full py-3">
                                <span className="px-3 text-gray-500">
                                    <i className="bi bi-lock ps-2 text-white"></i>
                                </span>

                                <input
                                    type="password"
                                    className="flex-1 outline-none !bg-transparent text-white"
                                    name='password'
                                    placeholder={t("password")}
                                    value={form.password}
                                    onChange={(e) => handleChange(e)}
                                />
                            </div>

                            <div className="text-right mt-2">
                                <Link to="/esquecisenha" className='text-white'>
                                    <small className="text-white">
                                        {t("forgot_password_question")}
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
                            className="w-full bg-[#4cb8c4] text-white py-3 rounded-full fw-800 text-lg"
                        >
                            {loading ? t("entering") : t("sign_in")}
                        </button>
                    </form>

                    {/* Divisor */}
                    <div className="flex items-center my-6">
                        <div className="flex-grow border-t"></div>
                        <span className="mx-3 text-white text-sm">
                            {t("or_login_with")}
                        </span>
                        <div className="flex-grow border-t"></div>
                    </div>

                    {/* Google */}
                    <button
                        onClick={() => login()}
                        className="text-sm w-full border border-gray-300 py-2 rounded-full flex items-center justify-center gap-3 transition-colors"
                    >
                        <img src={imgGoogle} alt="Google icone" width={30} />
                        <span className="ff-inter text-white">{t("continue_with_google")}</span>
                    </button>

                    <br />

                    {/* Facebook */}
                    {/* <button className="text-sm w-full  hover:bg-[#0d65d9] text-white py-2 rounded-full border border-gray-300 flex items-center justify-center gap-3 transition-colors">
                        <img src={imgFacebook} alt="Facebook icone" width={30} className="rounded-full" />
                        <span className="ff-inter">{t("continue_with_facebook")}</span>
                    </button> */}

                    <br />

                    <p className="text-sm text-white">
                        {t("no_account_question")}{' '}
                        <Link
                            to="/cadastrar"
                            className="underline text-[#4cb8c4] hover:text-[#085078] transition-colors"
                        >
                            {t("sign_up_button")}
                        </Link>
                    </p>

                    {/* Botão de instalação para desktop (opcional) */}
                    {installPrompt && !isMobile && (
                        <button
                            onClick={instalarApp}
                            className="mt-6 w-full bg-gradient-to-r from-[#4cb8c4] to-[#085078] text-white px-4 py-3 rounded-full text-sm font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
                        >
                            <Download className="w-4 h-4" />
                            <span>{t("install_app_short")}</span>
                        </button>
                    )}

                </div>
            </div>
        </div>
    )
}