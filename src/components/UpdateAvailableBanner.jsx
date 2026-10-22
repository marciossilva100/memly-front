import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, X } from "lucide-react";
import { isNativePlatform } from "../utils/googleNativeAuth";

const CHAVE_DISPENSADO = "zaldemy_update_dispensado_versao";

// Compara o versionCode instalado (App.getInfo().build, Android) com o
// mínimo recomendado pelo backend (controller/appVersion.php) - só existe
// pro app nativo Android, PWA/web não tem conceito de "versão instalada
// desatualizada" dessa forma (atualiza sozinho a cada load). Banner no topo
// (não entra na fila dos avisos laterais de toastLane.js de propósito -
// esse é mais importante e não deve competir/ser escondido por eles, nem
// sumir sozinho depois de alguns segundos).
export default function UpdateAvailableBanner() {
    const { t } = useTranslation();
    const [urlPlayStore, setUrlPlayStore] = useState(null);
    const [versaoMinima, setVersaoMinima] = useState(null);

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
                const minima = Number(data.android_min_version_code);

                if (cancelado || !minima || Number.isNaN(buildAtual)) return;

                if (buildAtual < minima) {
                    const jaDispensado = localStorage.getItem(CHAVE_DISPENSADO);
                    if (jaDispensado === String(minima)) return;

                    setVersaoMinima(minima);
                    setUrlPlayStore(data.android_play_store_url || "https://play.google.com/store/apps/details?id=com.zaldemy.app");
                }
            } catch {
                // sem conexão ou endpoint fora do ar - não trava o app, só
                // não mostra o aviso dessa vez.
            }
        }

        verificar();
        return () => { cancelado = true; };
    }, []);

    if (!urlPlayStore) return null;

    function dispensar() {
        if (versaoMinima) {
            localStorage.setItem(CHAVE_DISPENSADO, String(versaoMinima));
        }
        setUrlPlayStore(null);
    }

    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 flex items-center gap-3 text-sm">
            <Download className="w-4 h-4 shrink-0" />
            <span className="flex-1">{t("update_available_message")}</span>
            <a
                href={urlPlayStore}
                target="_blank"
                rel="noreferrer"
                onClick={dispensar}
                className="shrink-0 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-semibold transition-colors"
            >
                {t("update_available_button")}
            </a>
            <button type="button" onClick={dispensar} className="shrink-0 text-white/80 hover:text-white">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
