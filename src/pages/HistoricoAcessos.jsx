import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Smartphone, Monitor } from "lucide-react";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"

// Extrai um rótulo legível (SO + navegador) do user agent bruto - sem
// dependência nova, só heurística simples o suficiente pra exibição.
function dispositivoLegivel(userAgent, t) {
    if (!userAgent) return t("unknown_device");

    let so = null;
    if (/android/i.test(userAgent)) so = "Android";
    else if (/iphone|ipad|ipod/i.test(userAgent)) so = "iOS";
    else if (/windows/i.test(userAgent)) so = "Windows";
    else if (/mac os/i.test(userAgent)) so = "macOS";
    else if (/linux/i.test(userAgent)) so = "Linux";

    let navegador = null;
    if (/edg\//i.test(userAgent)) navegador = "Edge";
    else if (/chrome\//i.test(userAgent)) navegador = "Chrome";
    else if (/firefox\//i.test(userAgent)) navegador = "Firefox";
    else if (/safari\//i.test(userAgent)) navegador = "Safari";

    const partes = [so, navegador].filter(Boolean);

    return partes.length > 0 ? partes.join(" · ") : t("unknown_device");
}

function isMobile(userAgent) {
    return /android|iphone|ipad|ipod/i.test(userAgent || "");
}

export default function HistoricoAcessos() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [loading, setLoading] = useState(true);
    const [acessos, setAcessos] = useState([]);
    const jaBuscou = useRef(false);

    useEffect(() => {
        if (jaBuscou.current) return;
        jaBuscou.current = true;

        fetch(`${API_URL}/controller/configuracoes.php`, {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token"),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ action: 'historico_acessos' })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAcessos(data.acessos || []);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br">
                <img
                    src={imgChapeuFormatura}
                    alt={t("loading")}
                    className="w-28 animate-pulse"
                />
            </div>
        );
    }

    return (
        <div className="h-dvh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-[100px]">
                <div className="relative mb-4 mt-4">
                    <div className="left-0 cursor-pointer inline-block" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left text-2xl text-white"></i>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck className="w-6 h-6 text-[#4cb8c4]" />
                    <h1 className="text-2xl font-bold text-white">{t("access_history_title")}</h1>
                </div>

                {acessos.length === 0 && (
                    <p className="text-gray-400 text-center mt-10">{t("access_history_empty")}</p>
                )}

                <div className="space-y-3">
                    {acessos.map((item, index) => {
                        const Icone = isMobile(item.user_agent) ? Smartphone : Monitor;

                        return (
                            <div
                                key={index}
                                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 flex items-center gap-3"
                            >
                                <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30">
                                    <Icone className="w-5 h-5 text-[#4cb8c4]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-white font-medium truncate">{dispositivoLegivel(item.user_agent, t)}</p>
                                    <p className="text-gray-400 text-sm">
                                        {item.ip ? `${t("access_ip_label")}: ${item.ip} · ` : ''}
                                        {new Date(item.data_acesso).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
