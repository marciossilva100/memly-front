import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { XCircle } from "lucide-react";

export default function AssinaturaCancelada() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="h-dvh flex flex-col items-center justify-center text-center p-6 from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="w-16 h-16 rounded-full bg-gray-700/50 border border-gray-600 flex items-center justify-center mb-5">
                <XCircle className="w-8 h-8 text-gray-400" />
            </div>

            <h1 className="text-xl font-semibold text-white mb-2">
                {t("subscription_canceled_title")}
            </h1>
            <p className="text-gray-400 text-sm max-w-xs">
                {t("subscription_canceled_desc")}
            </p>

            <button
                onClick={() => navigate("/home")}
                className="mt-8 px-6 py-3 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
            >
                {t("back_to_home")}
            </button>
        </div>
    );
}
