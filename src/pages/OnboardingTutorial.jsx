import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import imgZaldemy from "../assets/img/zaldemy.png";
import useEnableBodyScroll from "../hooks/useEnableBodyScroll";
import { useAuth } from "../context/AuthContext";

const slides = [
    { emoji: "📚", titleKey: "onboarding_slide1_title", subtitleKey: "onboarding_slide1_subtitle" },
    { emoji: "🌍", titleKey: "onboarding_slide2_title", subtitleKey: "onboarding_slide2_subtitle" },
    { emoji: "🧠", titleKey: "onboarding_slide3_title", subtitleKey: "onboarding_slide3_subtitle" },
];

export default function OnboardingTutorial() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    useEnableBodyScroll();
    const API_URL = import.meta.env.VITE_API_URL;
    const [step, setStep] = useState(0);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (user?.step > 3) {
            navigate("/home", { replace: true });
        }
    }, [user]);

    async function finalizar() {
        if (enviando) return;
        setEnviando(true);

        try {
            await fetch(`${API_URL}/controller/onboarding.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                },
                body: JSON.stringify({ action: "finalizar_tutorial" }),
            });
        } catch {
            // segue pro app mesmo se a chamada falhar - não é algo que deva travar o usuário
        }

        localStorage.setItem("zaldemy_guia_add_categoria_pendente", "1");
        setUser((prev) => ({ ...prev, step: 4 }));
        navigate("/home", { replace: true });
    }

    function proximo() {
        if (step < slides.length - 1) {
            setStep(step + 1);
        } else {
            finalizar();
        }
    }

    const ultimaTela = step === slides.length - 1;
    const slideAtual = slides[step];

    return (
        <div className="min-h-screen flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br px-8">
            <div className="flex justify-between items-center pt-6">
                <img src={imgZaldemy} alt="Zaldemy" className="h-8" />
                {!ultimaTela && (
                    <button
                        type="button"
                        onClick={finalizar}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {t("onboarding_skip")}
                    </button>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
                <div className="text-7xl mb-8">{slideAtual.emoji}</div>

                <h2 className="text-2xl font-bold text-white mb-3">
                    {t(slideAtual.titleKey)}
                </h2>

                <p className="text-gray-300 text-base">
                    {t(slideAtual.subtitleKey)}
                </p>
            </div>

            <div className="flex justify-center gap-2 mb-6">
                {slides.map((_, index) => (
                    <div
                        key={index}
                        className={`h-2 rounded-full transition-all ${index === step ? "w-6 bg-[#4cb8c4]" : "w-2 bg-gray-600"
                            }`}
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={proximo}
                disabled={enviando}
                className="mb-10 w-full bg-[#4cb8c4] text-white py-3 rounded-full text-lg font-semibold hover:brightness-110 transition disabled:opacity-60"
            >
                {ultimaTela ? t("onboarding_start") : t("next")}
            </button>
        </div>
    );
}
