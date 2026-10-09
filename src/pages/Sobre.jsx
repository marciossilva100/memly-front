import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, Shield, Trash2, Mail, HelpCircle, ChevronRight } from "lucide-react";
import { isNativePlatform } from "../utils/googleNativeAuth";
import logo from "../assets/img/chapeu_formatura.png";

function ItemLink({ icone: Icone, titulo, cor, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center justify-between gap-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-3 text-left"
        >
            <span className="flex items-center gap-3">
                <Icone className={`w-5 h-5 ${cor}`} />
                <span className="text-white text-sm">{titulo}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
    );
}

export default function Sobre() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [versao, setVersao] = useState(null);
    const [build, setBuild] = useState(null);

    useEffect(() => {
        if (!isNativePlatform()) return;

        let cancelado = false;

        import("@capacitor/app").then(({ App }) => {
            App.getInfo()
                .then((info) => {
                    if (cancelado) return;
                    setVersao(info.version);
                    setBuild(info.build);
                })
                .catch(() => {});
        });

        return () => {
            cancelado = true;
        };
    }, []);

    return (
        <div className="h-dvh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-10">
                <div className="relative mb-4 mt-4">
                    <div
                        className="left-0 cursor-pointer inline-block"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-2xl text-white"></i>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto text-white">
                    <div className="flex flex-col items-center text-center mb-6">
                        <img src={logo} alt="Zaldemy" className="w-16 h-16 mb-3" />
                        <h1 className="text-2xl font-bold">{t("about")}</h1>
                        <p className="text-sm text-gray-300 mt-3">
                            {t("about_app_description")}
                        </p>

                        {versao && (
                            <p className="text-xs text-gray-400 mt-4">
                                {t("app_version_label")} {versao}
                                {build ? ` (${t("app_build_label")} ${build})` : ""}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <ItemLink
                            icone={FileText}
                            titulo={t("terms_of_use")}
                            cor="text-blue-400"
                            onClick={() => navigate("/termosdeuso")}
                        />
                        <ItemLink
                            icone={Shield}
                            titulo={t("privacy_policy")}
                            cor="text-purple-400"
                            onClick={() => navigate("/politicaprivacidade")}
                        />
                        <ItemLink
                            icone={Trash2}
                            titulo={t("delete_account")}
                            cor="text-red-500"
                            onClick={() => navigate("/exclusaodeconta")}
                        />
                        <ItemLink
                            icone={HelpCircle}
                            titulo={t("faq")}
                            cor="text-[#4cb8c4]"
                            onClick={() => navigate("/faq")}
                        />
                        <ItemLink
                            icone={Mail}
                            titulo={t("contact")}
                            cor="text-green-400"
                            onClick={() => navigate("/contato")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
