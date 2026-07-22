import { useEffect, useState } from 'react'
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import imgLogin from '../assets/img/img-login.png'
import imgGoogle from '../assets/img/google.png'
import imgFacebook from '../assets/img/logo-face.webp'
import imgCoruja from '../assets/img/coruja-esqueci-senha.png'

export default function EsqueciSenha({ setTitulo }) {
    const { t } = useTranslation();

    const [email, setEmail] = useState('')
    const [erro, setErro] = useState('')

    useEffect(() => {
        setTitulo(t("forgot_password"))
    }, [])

    function handleSubmit(e) {
        e.preventDefault()

        if (!email) {
            setErro(t("email_required"))
            return
        }

        setErro('')
    }

    return (
        <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-center">
                <div className="w-full max-w-md text-center mt-4">

                    <div className="mt-4 flex justify-center">
                        <img className="logo-coruja" src={imgCoruja} alt={t("forgot_password")} />
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                        {/* Email */}
                        <div className="flex items-center border rounded-md overflow-hidden">
                            <span className="px-3 text-gray-500">
                                <i className="bi bi-envelope"></i>
                            </span>

                            <input
                                type="email"
                                className="w-full px-3 py-2 outline-none"
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
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded fw-700"
                        >
                            {t("send")}
                        </button>
                    </form>

                    <hr className="my-6" />

                    <div>
                        <h6 className="text-primary-aux">
                            {t("remembered_password")}
                        </h6>

                        <Link
                            to="/login"
                            className="text-primary-aux underline"
                        >
                            {t("do_login")}
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    )
}
