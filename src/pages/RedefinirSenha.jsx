import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import imgZaldemy from "../assets/img/zaldemy.png"

export default function RedefinirSenha() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    const token = searchParams.get("token");

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [erro, setErro] = useState('')
    const [loading, setLoading] = useState(false)
    const [sucesso, setSucesso] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()

        if (!token) {
            setErro(t("invalid_or_expired_link"))
            return
        }

        if (!password) {
            setErro(t("enter_password"))
            return
        }

        if (!confirmPassword) {
            setErro(t("enter_password_confirm"))
            return
        }

        setErro('')
        setLoading(true)

        try {
            const res = await fetch(`${API_URL}/controller/auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reset_password',
                    token: token,
                    password: password,
                    confirm_password: confirmPassword
                })
            })

            const data = await res.json()

            if (!data.sucesso) {
                setErro(data.erro || t("server_connection_error"))
                return
            }

            setSucesso(true)

            setTimeout(() => {
                navigate("/login")
            }, 3000)

        } catch {
            setErro(t("server_connection_error"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-screen flex items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br px-8">
            <div className="w-full max-w-md text-center">

                <div className="flex justify-center mb-4">
                    <img width={200} src={imgZaldemy} alt="Zaldemy" />
                </div>

                {!token && (
                    <>
                        <h2 className="text-red-400 text-lg font-semibold">
                            {t("invalid_or_expired_link")}
                        </h2>
                        <button
                            className="mt-5 w-full bg-[#4cb8c4] text-white py-3 rounded-full text-lg font-medium"
                            onClick={() => navigate("/esquecisenha")}
                        >
                            {t("forgot_password")}
                        </button>
                    </>
                )}

                {token && sucesso && (
                    <>
                        <h2 className="text-green-400 text-lg font-semibold">
                            {t("password_reset_success")}
                        </h2>
                        <p className="text-gray-300 text-sm mt-2">
                            {t("redirecting_to_login")}
                        </p>
                    </>
                )}

                {token && !sucesso && (
                    <>
                        <h5 className="text-sm text-white mb-4">
                            {t("choose_new_password")}
                        </h5>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="flex items-center border rounded-full overflow-hidden py-3 px-3">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full px-2 outline-none flex-1 !bg-transparent text-white"
                                    placeholder={t("password")}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
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

                            <div className="flex items-center border rounded-full overflow-hidden py-3 px-3">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="w-full px-2 outline-none flex-1 !bg-transparent text-white"
                                    placeholder={t("confirm_password_placeholder")}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value)
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
                                disabled={loading}
                                className="w-full bg-[#4cb8c4] text-white py-3 rounded-full fw-800 text-lg disabled:opacity-60"
                            >
                                {loading ? t("sending") : t("save")}
                            </button>
                        </form>
                    </>
                )}

            </div>
        </div>
    );
}
