import { useEffect, useState } from 'react'
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import imgZaldemy from "../assets/img/zaldemy.png"

export default function EsqueciSenha({ setTitulo }) {
    const { t } = useTranslation();
    const API_URL = import.meta.env.VITE_API_URL;

    const [email, setEmail] = useState('')
    const [erro, setErro] = useState('')
    const [loading, setLoading] = useState(false)
    const [enviado, setEnviado] = useState(false)

    useEffect(() => {
        setTitulo(t("forgot_password"))
    }, [])

    async function handleSubmit(e) {
        e.preventDefault()

        if (!email) {
            setErro(t("email_required"))
            return
        }

        setErro('')
        setLoading(true)

        try {
            const res = await fetch(`${API_URL}/controller/auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'forgot_password',
                    email: email
                })
            })

            const data = await res.json()

            if (!data.sucesso) {
                setErro(data.erro || t("server_connection_error"))
                return
            }

            setEnviado(true)

        } catch {
            setErro(t("server_connection_error"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 px-8 py-4 h-screen from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex justify-center">
                <div className="w-full max-w-md text-center mt-4">

                    <div className="flex justify-center mb-2">
                        <img width={200} src={imgZaldemy} alt="Zaldemy" />
                    </div>

                    <h5 className="text-sm text-white">
                        {t("forgot_password")}
                    </h5>

                    {enviado ? (
                        <div className="mt-6">
                            <h2 className="text-green-400 text-lg font-semibold">
                                {t("reset_link_sent")}
                            </h2>
                            <p className="text-gray-300 text-sm mt-2">
                                {t("reset_link_sent_hint")}
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                            {/* Email */}
                            <div className="flex items-center border rounded-full overflow-hidden py-3 px-4">
                                <input
                                    type="email"
                                    className="w-full outline-none flex-1 !bg-transparent text-white"
                                    placeholder={t("email")}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        setErro('')
                                    }}
                                />
                            </div>

                            {/* Erro */}
                            {erro && (
                                <div className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded">
                                    {erro}
                                </div>
                            )}

                            {/* Botão */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#4cb8c4] text-white py-3 rounded-full fw-800 text-lg disabled:opacity-60"
                            >
                                {loading ? t("sending") : t("send")}
                            </button>
                        </form>
                    )}

                    <br />

                    <p className="text-sm text-white">
                        {t("remembered_password")}{' '}
                        <Link to="/login" className="underline text-[#4cb8c4] hover:text-[#085078] transition-colors">
                            {t("do_login")}
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    )
}
