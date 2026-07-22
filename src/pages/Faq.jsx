import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HelpCircle, ChevronDown } from "lucide-react";

const TOTAL_PERGUNTAS = 12;

export default function Faq() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [aberto, setAberto] = useState(null);

    const perguntas = Array.from({ length: TOTAL_PERGUNTAS }, (_, i) => ({
        pergunta: t(`faq_q${i + 1}`),
        resposta: t(`faq_a${i + 1}`),
    }));

    function toggle(index) {
        setAberto(aberto === index ? null : index);
    }

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
                    <div className="flex items-center gap-2 mb-6">
                        <HelpCircle className="w-6 h-6 text-[#4cb8c4]" />
                        <h1 className="text-2xl font-bold">{t("faq_title")}</h1>
                    </div>

                    <div className="space-y-3">
                        {perguntas.map((item, index) => (
                            <div
                                key={index}
                                className="rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 overflow-hidden"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggle(index)}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                                >
                                    <span className="text-sm font-medium">{item.pergunta}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${aberto === index ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>

                                {aberto === index && (
                                    <div className="px-4 pb-4 text-sm text-gray-300 leading-relaxed">
                                        {item.resposta}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
