import { useEffect, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Download, Smartphone, Share2, Globe } from "lucide-react";
import imgZaldemy from "../assets/img/zaldemy.png";

export default function InstallPwaNotice() {
    const { t } = useTranslation();
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);
    const [showManualFallback, setShowManualFallback] = useState(false);

    useEffect(() => {
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        const inApp = /Instagram|FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|TikTok|BytedanceWebview/i.test(navigator.userAgent);
        setIsInAppBrowser(inApp);

        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);

        // O Chrome só dispara beforeinstallprompt quando decide, pela própria
        // heurística de engajamento, que o app "merece" ser instalável — o que
        // pode nunca acontecer nessa visita. Depois de um tempo, mostramos o
        // passo a passo manual como alternativa ao botão automático.
        const timer = setTimeout(() => setShowManualFallback(true), 4000);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            clearTimeout(timer);
        };
    }, []);

    async function instalarApp() {
        if (!installPrompt) return;

        installPrompt.prompt();
        const choice = await installPrompt.userChoice;

        if (choice.outcome === "accepted") {
            console.log("Usuário instalou o app");
        }

        setInstallPrompt(null);
    }

    return (
        <div className="h-svh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide flex items-center justify-center px-8">
                <div className="w-full max-w-md text-center py-10">
                    <div className="flex justify-center mb-6">
                        <img width={240} src={imgZaldemy} alt="Zaldemy" />
                    </div>

                    <h2 className="text-[#41a9e3] text-2xl font-bold mb-4">
                        {t("install_our_app")}
                    </h2>

                    <p className="text-white mb-8">
                        {t("install_for_full_experience")}
                    </p>

                    {isInAppBrowser ? (
                        // Navegadores internos de apps (Instagram, Facebook, TikTok, etc.)
                        // não suportam a instalação de PWA - orientar a abrir no navegador padrão
                        <div className="bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-2xl p-6 border border-[#4cb8c4]/20">
                            <div className="flex justify-center mb-4">
                                <div className="bg-[#4cb8c4] p-3 rounded-full">
                                    <Globe className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-[#085078] mb-3">
                                {t("open_in_browser_title")}
                            </h3>

                            <p className="text-sm text-gray-600 text-left">
                                {t("open_in_browser_description")}
                            </p>
                        </div>
                    ) : isIOS ? (
                        // Instruções para iPhone/iPad
                        <div className="bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-2xl p-6 border border-[#4cb8c4]/20">
                            <div className="flex justify-center mb-4">
                                <div className="bg-[#4cb8c4] p-3 rounded-full">
                                    <Share2 className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-[#085078] mb-3">
                                {t("how_to_install_iphone")}
                            </h3>

                            <div className="space-y-4 text-left">
                                <div className="flex items-start gap-3">
                                    <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#085078] font-bold text-sm">1</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        <Trans i18nKey="ios_step1_before" components={{ b: <span className="font-semibold" /> }} /> <Share2 className="w-4 h-4 inline text-[#4cb8c4]" /> {t("ios_step1_after")}
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#085078] font-bold text-sm">2</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        <Trans i18nKey="ios_step2" components={{ 1: <span className="font-semibold" /> }} />
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#085078] font-bold text-sm">3</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        <Trans i18nKey="ios_step3" components={{ 1: <span className="font-semibold" /> }} />
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 p-3 bg-white/50 rounded-lg">
                                <p className="text-xs text-gray-500">
                                    <Globe className="w-3 h-3 inline mr-1" />
                                    {t("after_install_native")}
                                </p>
                            </div>
                        </div>
                    ) : (
                        // Botão de instalação para Android/outros (com as cores da marca)
                        <>
                            <button
                                onClick={installPrompt ? instalarApp : null}
                                disabled={!installPrompt}
                                className={`w-full bg-gradient-to-r from-[#4cb8c4] to-[#085078] text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3 group ${!installPrompt ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Download className="w-5 h-5 group-hover:animate-bounce" />
                                <span>{t("install_app_button")}</span>
                                <Smartphone className="w-5 h-5" />
                            </button>

                            {!installPrompt && !showManualFallback && (
                                <p className="text-sm text-gray-500 mt-4">
                                    {t("install_button_hint")}
                                </p>
                            )}

                            {!installPrompt && showManualFallback && (
                                <div className="mt-6 bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-2xl p-6 border border-[#4cb8c4]/20 text-left">
                                    <h3 className="text-sm font-semibold text-[#085078] mb-3 text-center">
                                        {t("install_manual_android_title")}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {t("install_manual_android_steps")}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
