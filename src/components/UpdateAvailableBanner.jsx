import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, X, AlertTriangle } from "lucide-react";
import { isNativePlatform } from "../utils/googleNativeAuth";

const CHAVE_DISPENSADO = "zaldemy_update_dispensado_versao";

// Compara o versionCode instalado (App.getInfo().build, Android) com o
// mínimo do backend (controller/appVersion.php) - só existe pro app nativo
// Android, PWA/web não tem esse conceito (atualiza sozinho a cada load).
//
// Dois níveis, de propósito (ver comentário em appVersion.php):
// - "recomendado": banner dispensável no topo, não atrapalha quem tá
//   usando - não entra na fila dos avisos laterais de toastLane.js (esse é
//   mais importante e fica até ser dispensado, sem timer de auto-esconder).
// - "obrigatorio": tela cheia, sem botão de fechar - reservado pra bug
//   grave o suficiente pra justificar travar o app até atualizar. Sempre
//   mostra de novo (não usa a flag de dispensado), já que não é opcional.
export default function UpdateAvailableBanner() {
    const { t } = useTranslation();
    const [modo, setModo] = useState(null); // null | "recomendado" | "obrigatorio"
    const [urlPlayStore, setUrlPlayStore] = useState(null);
    const [versaoRecomendada, setVersaoRecomendada] = useState(null);

    useEffect(() => {
        if (!isNativePlatform()) return;

        let cancelado = false;

        async function verificar() {
            try {
                const { App } = await import("@capacitor/app");
                const info = await App.getInfo();
                const buildAtual = parseInt(info.build, 10);

                const API_URL = import.meta.env.VITE_API_URL;
                const res = await fetch(`${API_URL}/controller/appVersion.php`);
                const data = await res.json();
                const recomendado = Number(data.android_min_version_code);
                const obrigatorio = Number(data.android_min_version_code_obrigatorio);
                const url = data.android_play_store_url || "https://play.google.com/store/apps/details?id=com.zaldemy.app";

                if (cancelado || Number.isNaN(buildAtual)) return;

                if (obrigatorio > 0 && buildAtual < obrigatorio) {
                    setModo("obrigatorio");
                    setUrlPlayStore(url);
                    return;
                }

                if (recomendado && buildAtual < recomendado) {
                    const jaDispensado = localStorage.getItem(CHAVE_DISPENSADO);
                    if (jaDispensado === String(recomendado)) return;

                    setModo("recomendado");
                    setUrlPlayStore(url);
                    setVersaoRecomendada(recomendado);
                }
            } catch {
                // sem conexão ou endpoint fora do ar - não trava o app, só
                // não mostra o aviso dessa vez.
            }
        }

        verificar();
        return () => { cancelado = true; };
    }, []);

    if (!modo) return null;

    function dispensar() {
        if (versaoRecomendada) {
            localStorage.setItem(CHAVE_DISPENSADO, String(versaoRecomendada));
        }
        setModo(null);
    }

    if (modo === "obrigatorio") {
        return (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/40 rounded-2xl max-w-sm w-full p-6 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-red-500/15 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-7 h-7 text-red-400" />
                    </div>
                    <h2 className="text-white text-lg font-bold mb-2">{t("update_required_title")}</h2>
                    <p className="text-gray-400 text-sm mb-5">{t("update_required_message")}</p>
                    <a
                        href={urlPlayStore}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-semibold py-3 rounded-full transition-colors"
                    >
                        {t("update_available_button")}
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 flex items-center gap-3 text-sm">
            <Download className="w-4 h-4 shrink-0" />
            <span className="flex-1">{t("update_available_message")}</span>
            <a
                href={urlPlayStore}
                target="_blank"
                rel="noreferrer"
                onClick={() => setModo(null)}
                className="shrink-0 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-semibold transition-colors"
            >
                {t("update_available_button")}
            </a>
            <button
                type="button"
                onClick={dispensar}
                className="shrink-0 text-white/80 hover:text-white"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
