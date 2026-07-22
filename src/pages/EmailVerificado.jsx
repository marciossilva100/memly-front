import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import imgZaldemy from "../assets/img/zaldemy.png"

export default function EmailVerificado() {
    const { t } = useTranslation();

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("verificando");

    // 🔒 Proteção contra execução dupla (React 18 StrictMode)
    const hasRun = useRef(false);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {

        // Impede rodar duas vezes no modo desenvolvimento
        if (hasRun.current) return;
        hasRun.current = true;

        const token = searchParams.get("token");

        if (!token) {
            setStatus("erro");
            return;
        }

        fetch(`${API_URL}/controller/verify.php?token=` + token)
            .then(res => {
                if (!res.ok) {
                    throw new Error("Erro HTTP");
                }
                return res.json();
            })
            .then(data => {

                if (data.success === true) {
                    setStatus("sucesso");

                    setTimeout(() => {
                        navigate("/login");
                    }, 3000);

                } else {
                    setStatus("erro");
                }

            })
            .catch((err) => {
                console.error("Erro:", err);
                setStatus("erro");
            });

    }, [searchParams, navigate]);

    return (
        <div className="h-screen flex items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br px-8">
            <div className="w-full max-w-md text-center">

                <div className="flex justify-center mb-4">
                    <img width={200} src={imgZaldemy} alt="Zaldemy" />
                </div>

                {status === "verificando" && (
                    <p className="text-white text-sm">
                        {t("verifying_email")}
                    </p>
                )}

                {status === "erro" && (
                    <>
                        <h2 className="text-red-400 text-lg font-semibold">
                            {t("invalid_or_expired_link")}
                        </h2>
                        <button
                            className="mt-5 w-full bg-[#4cb8c4] text-white py-3 rounded-full text-lg font-medium"
                            onClick={() => navigate("/login")}
                        >
                            {t("go_to_login")}
                        </button>
                    </>
                )}

                {status === "sucesso" && (
                    <>
                        <h2 className="text-green-400 text-lg font-semibold">
                            {t("email_confirmed_success")}
                        </h2>
                        <p className="text-gray-300 text-sm mt-2">
                            {t("redirecting_to_login")}
                        </p>
                    </>
                )}

            </div>
        </div>
    );
}
