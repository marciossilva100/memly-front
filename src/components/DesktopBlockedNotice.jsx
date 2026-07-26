import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Smartphone } from "lucide-react";
import imgZaldemy from "../assets/img/zaldemy.png";

export default function DesktopBlockedNotice() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="h-app-svh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col px-8">
                <div className="w-full max-w-md text-center py-10 m-auto">
                    <div className="flex justify-center mb-4">
                        <img width={200} src={imgZaldemy} alt="Zaldemy" />
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-[#4cb8c4]/15 flex items-center justify-center mx-auto mb-4">
                        <Smartphone className="text-[#4cb8c4]" size={28} />
                    </div>

                    <h2 className="text-white text-lg font-semibold">
                        {t("desktop_only_title")}
                    </h2>
                    <p className="text-gray-300 text-sm mt-2">
                        {t("desktop_only_message")}
                    </p>

                    <button
                        className="mt-6 w-full bg-[#4cb8c4] text-white py-3 rounded-full text-lg font-medium"
                        onClick={() => navigate("/")}
                    >
                        {t("desktop_only_back_button")}
                    </button>
                </div>
            </div>
        </div>
    );
}
