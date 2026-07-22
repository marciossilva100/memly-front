import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { Mail } from "lucide-react";
import imgZaldemy from "../assets/img/zaldemy.png"

export default function VerificarEmail() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const location = useLocation();
    const emailOriginal = location.state?.email;
    const emailMascarado = emailOriginal
        ? mascararEmail(emailOriginal)
        : null;

    function reenviarEmail() {
        return;
    }

    function mascararEmail(email) {
        const [usuario, dominio] = email.split("@");

        const inicio = usuario.slice(0, 2);
        const oculto = "*".repeat(usuario.length - 2);

        return `${inicio}${oculto}@${dominio}`;
    }

    return (
        <div className="max-w-6xl mx-auto px-8 py-4 h-screen from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex justify-center">
                <div className="w-full max-w-md text-center mt-4">

                    <div className="flex justify-center mb-2">
                        <img width={200} src={imgZaldemy} alt="Zaldemy" />
                    </div>

                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 w-16 h-16 flex items-center justify-center">
                            <Mail className="text-[#4cb8c4]" width={30} height={30} />
                        </div>
                    </div>

                    <h2 className="text-white text-lg font-semibold">
                        {t("registration_complete")}
                    </h2>

                    <p className="text-gray-300 text-sm mt-3">
                        <Trans i18nKey="verification_email_sent" values={{ email: emailMascarado }} components={{ 1: <strong className="text-white" /> }} />
                    </p>

                    <p className="text-gray-300 text-sm mt-2">
                        {t("verify_email_instructions")}
                    </p>

                    <div className="grid gap-3 mt-6">
                        <button
                            className="bg-[#4cb8c4] px-5 py-3 rounded-full font-medium text-white text-lg"
                            onClick={reenviarEmail}
                        >
                            {t("resend_email")}
                        </button>

                        <button
                            className="w-full text-white text-lg py-3 rounded-full shadow-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700"
                            onClick={() => navigate('/login')}
                        >
                            {t("already_confirmed")}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
