import { useEffect, useRef, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Download, Smartphone, Share2, Globe, Loader2, CheckCircle2 } from "lucide-react";
import imgZaldemy from "../assets/img/zaldemy.png";
import { getInstallPrompt, onInstallPromptChange, clearInstallPrompt, isPwaKnownInstalled } from "../utils/pwaInstallPrompt";
import useEnableBodyScroll from "../hooks/useEnableBodyScroll";

// Aguarda o evento appinstalled (instalação de fato concluída) com um limite
// de tempo, já que em alguns navegadores/versões ele pode nunca disparar.
function waitForAppInstalled(timeoutMs) {
    return new Promise((resolve) => {
        const handle = () => {
            window.removeEventListener("appinstalled", handle);
            clearTimeout(timer);
            resolve();
        };
        window.addEventListener("appinstalled", handle);
        const timer = setTimeout(() => {
            window.removeEventListener("appinstalled", handle);
            resolve();
        }, timeoutMs);
    });
}

export default function InstallPwaNotice() {
    const { t } = useTranslation();
    useEnableBodyScroll();
    const [installPrompt, setInstallPrompt] = useState(() => getInstallPrompt());
    const [alreadyInstalled] = useState(() => isPwaKnownInstalled());
    const [isIOS, setIsIOS] = useState(false);
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);
    const [showManualFallback, setShowManualFallback] = useState(false);
    // idle | awaiting | installing | installed
    const [installStep, setInstallStep] = useState("idle");
    const isMountedRef = useRef(true);

    useEffect(() => {
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        const inApp = /Instagram|FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|TikTok|BytedanceWebview/i.test(navigator.userAgent);
        setIsInAppBrowser(inApp);

        // O evento pode já ter sido capturado antes deste componente montar
        // (ver src/utils/pwaInstallPrompt.js) - onInstallPromptChange cobre
        // os dois casos: já capturado, ou capturado só a partir de agora.
        const unsubscribe = onInstallPromptChange(setInstallPrompt);

        // O Chrome só dispara beforeinstallprompt quando decide, pela própria
        // heurística de engajamento, que o app "merece" ser instalável — o que
        // pode nunca acontecer nessa visita. Depois de um tempo, mostramos o
        // passo a passo manual como alternativa ao botão automático.
        const timer = setTimeout(() => setShowManualFallback(true), 4000);

        return () => {
            isMountedRef.current = false;
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    async function instalarApp() {
        if (!installPrompt) return;

        setInstallStep("awaiting");
        installPrompt.prompt();
        const choice = await installPrompt.userChoice;

        if (choice.outcome !== "accepted") {
            if (isMountedRef.current) setInstallStep("idle");
            return;
        }

        if (isMountedRef.current) setInstallStep("installing");

        await waitForAppInstalled(8000);

        clearInstallPrompt();
        setInstallPrompt(null);
        if (isMountedRef.current) setInstallStep("installed");
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br px-8">
            <div className="w-full max-w-md text-center py-10">
                <div className="flex justify-center mb-6">
                    <img width={240} src={imgZaldemy} alt="Zaldemy" />
                </div>

                <h2 className="text-[#41a9e3] text-2xl font-bold mb-4">
                    {alreadyInstalled ? t("pwa_already_installed_title") : t("install_our_app")}
                </h2>

                <p className="text-white mb-8">
                    {alreadyInstalled ? t("pwa_already_installed_message") : t("install_for_full_experience")}
                </p>

                {alreadyInstalled ? (
                    // O navegador não tem como saber, numa aba comum, se o app já
                    // foi instalado antes - só sabemos por um flag que a gente
                    // mesmo guardou (ver isPwaKnownInstalled). Nesse caso, pedir
                    // pra instalar de novo não faz sentido: só falta abrir pelo
                    // ícone certo.
                    <div className="flex justify-center">
                        <div className="bg-[#4cb8c4] p-4 rounded-full">
                            <Smartphone className="w-10 h-10 text-white" />
                        </div>
                    </div>
                ) : isInAppBrowser ? (
                    // Navegadores internos de apps (Instagram, Facebook, TikTok, etc.)
                    // não suportam a instalação de PWA - orientar a abrir no navegador padrão
                    <div className="bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-2xl p-6 border border-[#4cb8c4]/20">
                        <div className="flex justify-center mb-4">
                            <div className="bg-[#4cb8c4] p-3 rounded-full">
                                <Globe className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-[#4cb8c4] mb-3">
                            {t("open_in_browser_title")}
                        </h3>

                        <p className="text-sm text-gray-300 text-left">
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

                        <h3 className="text-lg font-semibold text-[#4cb8c4] mb-3">
                            {t("how_to_install_iphone")}
                        </h3>

                        <div className="space-y-4 text-left">
                            <div className="flex items-start gap-3">
                                <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[#4cb8c4] font-bold text-sm">1</span>
                                </div>
                                <p className="text-sm text-gray-300">
                                    <Trans i18nKey="ios_step1_before" components={{ b: <span className="font-semibold" /> }} /> <Share2 className="w-4 h-4 inline text-[#4cb8c4]" /> {t("ios_step1_after")}
                                </p>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[#4cb8c4] font-bold text-sm">2</span>
                                </div>
                                <p className="text-sm text-gray-300">
                                    <Trans i18nKey="ios_step2" components={{ 1: <span className="font-semibold" /> }} />
                                </p>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="bg-[#4cb8c4]/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[#4cb8c4] font-bold text-sm">3</span>
                                </div>
                                <p className="text-sm text-gray-300">
                                    <Trans i18nKey="ios_step3" components={{ 1: <span className="font-semibold" /> }} />
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 p-3 bg-white/10 rounded-lg">
                            <p className="text-xs text-gray-300">
                                <Globe className="w-3 h-3 inline mr-1" />
                                {t("after_install_native")}
                            </p>
                        </div>
                    </div>
                ) : (
                    // Botão de instalação para Android/outros (com as cores da marca)
                    <>
                        <button
                            onClick={installPrompt && installStep === "idle" ? instalarApp : null}
                            disabled={!installPrompt || installStep !== "idle"}
                            className={`w-full font-bold py-4 px-6 rounded-xl transition-all transform shadow-xl flex items-center justify-center space-x-3 group ${installStep === "installed"
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                : "bg-gradient-to-r from-[#4cb8c4] to-[#085078] text-white hover:scale-[1.02] hover:shadow-2xl"
                                } ${!installPrompt || (installStep !== "idle" && installStep !== "installed") ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {installStep === "awaiting" || installStep === "installing" ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : installStep === "installed" ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <Download className="w-5 h-5 group-hover:animate-bounce" />
                            )}

                            <span>
                                {installStep === "awaiting"
                                    ? t("install_awaiting_confirmation")
                                    : installStep === "installing"
                                        ? t("install_installing")
                                        : installStep === "installed"
                                            ? t("install_installed")
                                            : t("install_app_button")}
                            </span>

                            {installStep === "idle" && <Smartphone className="w-5 h-5" />}
                        </button>

                        {!installPrompt && installStep === "idle" && !showManualFallback && (
                            <p className="text-sm text-gray-400 mt-4">
                                {t("install_button_hint")}
                            </p>
                        )}

                        {!installPrompt && installStep === "idle" && showManualFallback && (
                            <div className="mt-6 bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-2xl p-6 border border-[#4cb8c4]/20 text-left">
                                <h3 className="text-sm font-semibold text-[#4cb8c4] mb-3 text-center">
                                    {t("install_manual_android_title")}
                                </h3>
                                <p className="text-sm text-gray-300">
                                    {t("install_manual_android_steps")}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
