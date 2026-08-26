import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ClipboardList, ChevronLeft, ChevronRight, X } from "lucide-react";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"

function corNota(nota) {
    if (nota === null || nota === undefined) return "text-gray-400 border-gray-600 bg-gray-700/30";
    if (nota >= 8) return "text-green-400 border-green-400/30 bg-green-400/10";
    if (nota >= 5) return "text-amber-400 border-amber-400/30 bg-amber-400/10";
    return "text-red-400 border-red-400/30 bg-red-400/10";
}

// "Hoje" no fuso de referência do backend (-03:00, ver server.php), não no
// fuso do aparelho - mesma lógica de HistoricoPerguntas.jsx.
function hojeBrasil() {
    const agora = new Date();
    const utcMs = agora.getTime() + agora.getTimezoneOffset() * 60000;
    const brasil = new Date(utcMs - 3 * 60 * 60000);
    return `${brasil.getFullYear()}-${String(brasil.getMonth() + 1).padStart(2, '0')}-${String(brasil.getDate()).padStart(2, '0')}`;
}

function formatarData(data) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

export default function HistoricoTraducaoReversa() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [loading, setLoading] = useState(true);
    const [historico, setHistorico] = useState([]);
    const [filtroData, setFiltroData] = useState("");
    const jaBuscou = useRef(false);

    // Lista de dias com pelo menos um registro, mais recente primeiro - a
    // navegação anterior/próximo pula direto entre esses dias, sem depender
    // do <input type="date"> nativo (não abre de forma confiável dentro do
    // app instalado como PWA no iOS - reportado pelo usuário).
    const datasDisponiveis = useMemo(() => {
        const unicas = new Set(historico.map(item => item.data_criacao?.slice(0, 10)).filter(Boolean));
        return [...unicas].sort().reverse();
    }, [historico]);

    const indiceData = filtroData ? datasDisponiveis.indexOf(filtroData) : -1;

    const historicoFiltrado = useMemo(() => {
        if (!filtroData) return historico;
        return historico.filter(item => item.data_criacao?.slice(0, 10) === filtroData);
    }, [historico, filtroData]);

    useEffect(() => {
        if (jaBuscou.current) return;
        jaBuscou.current = true;

        fetch(`${API_URL}/controller/TraducaoReversaController.php?action=historico`, {
            method: 'GET',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const lista = data.historico || [];
                    setHistorico(lista);

                    const hoje = hojeBrasil();
                    if (lista.some(item => item.data_criacao?.slice(0, 10) === hoje)) {
                        setFiltroData(hoje);
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    function irParaDataAnterior() {
        if (indiceData === -1) {
            setFiltroData(datasDisponiveis[0]);
        } else if (indiceData < datasDisponiveis.length - 1) {
            setFiltroData(datasDisponiveis[indiceData + 1]);
        }
    }

    function irParaDataSeguinte() {
        if (indiceData === 0) {
            setFiltroData("");
        } else if (indiceData > 0) {
            setFiltroData(datasDisponiveis[indiceData - 1]);
        }
    }

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

                <div className="flex items-center gap-2 mb-4">
                    <ClipboardList className="w-6 h-6 text-purple-400" />
                    <h1 className="text-2xl font-bold text-white">{t("traducao_reversa_history_title")}</h1>
                </div>

                {historico.length > 0 && (
                    <div className="flex items-center gap-2 mb-6">
                        <button
                            type="button"
                            onClick={irParaDataAnterior}
                            disabled={indiceData === datasDisponiveis.length - 1}
                            className="p-2 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 disabled:opacity-30 hover:bg-gray-700/50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="flex-1 text-center text-white text-sm font-medium bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-1.5">
                            {filtroData ? formatarData(filtroData) : t("history_all_dates_label")}
                        </span>

                        <button
                            type="button"
                            onClick={irParaDataSeguinte}
                            disabled={!filtroData}
                            className="p-2 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 disabled:opacity-30 hover:bg-gray-700/50 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        {filtroData && (
                            <button
                                onClick={() => setFiltroData("")}
                                className="p-1.5 rounded-full bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}

                {historico.length === 0 && (
                    <p className="text-gray-400 text-center mt-10">{t("traducao_reversa_history_empty")}</p>
                )}

                {historico.length > 0 && historicoFiltrado.length === 0 && (
                    <p className="text-gray-400 text-center mt-10">{t("history_no_results_for_date")}</p>
                )}

                <div className="space-y-3">
                    {historicoFiltrado.map((item, index) => (
                        <div
                            key={index}
                            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4"
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <p className="text-white font-medium">{item.texto_nativo}</p>
                                <span className={`shrink-0 text-sm font-bold px-2 py-0.5 rounded-full border ${corNota(item.nota)}`}>
                                    {item.nota === null || item.nota === undefined ? t("history_unanswered_label") : `${item.nota}/10`}
                                </span>
                            </div>

                            {item.resposta && (
                                <p className="text-gray-400 text-sm italic mb-2">"{item.resposta}"</p>
                            )}

                            {item.feedback && (
                                <p className="text-gray-300 text-sm border-t border-gray-700 pt-2 mb-2">{item.feedback}</p>
                            )}

                            {item.texto_traduzido_gabarito && (
                                <p className="text-purple-300 text-sm border-t border-gray-700 pt-2">
                                    <span className="text-purple-400 text-xs uppercase tracking-wide font-semibold block mb-1">{t("suggested_translation_label")}</span>
                                    {item.texto_traduzido_gabarito}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
