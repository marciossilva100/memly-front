import { useState, useEffect, useRef } from "react";
import { Send, Loader2, X, MessageCircleQuestion } from "lucide-react";
import { useTranslation } from "react-i18next";

const MAX_MENSAGENS = 3;

// Chat de dúvida anexado ao feedback de uma pergunta (treino de Perguntas
// por IA) - bem limitado de propósito (no máximo 3 mensagens do aluno,
// escopo travado só nessa pergunta específica no backend, ver
// model/DuvidaPerguntaIA.php). Só aparece DEPOIS do feedback, nunca antes
// de responder.
export default function DuvidaChat({ questionId }) {
    const { t } = useTranslation();
    const API_URL = import.meta.env.VITE_API_URL;

    const [aberto, setAberto] = useState(false);
    const [carregandoHistorico, setCarregandoHistorico] = useState(false);
    const [mensagens, setMensagens] = useState([]);
    const [restantes, setRestantes] = useState(MAX_MENSAGENS);
    const [texto, setTexto] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState(null);
    const fimRef = useRef(null);
    const jaCarregou = useRef(false);

    useEffect(() => {
        if (!aberto || jaCarregou.current) return;
        jaCarregou.current = true;

        setCarregandoHistorico(true);
        fetch(`${API_URL}/controller/DailyQuestionController.php?action=duvida_historico&question_id=${questionId}`, {
            headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setMensagens(data.historico || []);
                    setRestantes(data.mensagens_restantes ?? MAX_MENSAGENS);
                }
            })
            .catch(() => {})
            .finally(() => setCarregandoHistorico(false));
    }, [aberto, questionId, API_URL]);

    useEffect(() => {
        fimRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens]);

    async function enviar(e) {
        e.preventDefault();
        if (!texto.trim() || enviando || restantes <= 0) return;

        const mensagemUsuario = texto.trim();
        setTexto("");
        setErro(null);
        setEnviando(true);
        // Otimista - mostra a pergunta do aluno na hora, a resposta da IA
        // entra depois de chegar.
        setMensagens(prev => [...prev, { role: "user", mensagem: mensagemUsuario }]);

        try {
            const formData = new FormData();
            formData.append("action", "duvida_enviar");
            formData.append("question_id", questionId);
            formData.append("mensagem", mensagemUsuario);

            const res = await fetch(`${API_URL}/controller/DailyQuestionController.php`, {
                method: "POST",
                headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
                body: formData
            });
            const data = await res.json();

            if (!data.success) {
                setErro(data.message || t("unexpected_error"));
                // remove a bolha otimista - a mensagem não foi salva de verdade
                setMensagens(prev => prev.slice(0, -1));
                if (data.limite_atingido) {
                    setRestantes(0);
                }
                return;
            }

            setMensagens(prev => [...prev, { role: "assistant", mensagem: data.resposta }]);
            setRestantes(data.mensagens_restantes ?? 0);
        } catch {
            setErro(t("server_connection_error"));
            setMensagens(prev => prev.slice(0, -1));
        } finally {
            setEnviando(false);
        }
    }

    if (!aberto) {
        return (
            <button
                type="button"
                onClick={() => setAberto(true)}
                className="flex items-center justify-center gap-2 text-sm font-medium text-[#4cb8c4] border border-[#4cb8c4]/30 bg-[#4cb8c4]/5 hover:bg-[#4cb8c4]/10 transition-colors rounded-xl py-3"
            >
                <MessageCircleQuestion className="w-4 h-4" />
                {t("ask_doubt_button")}
            </button>
        );
    }

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm flex flex-col max-h-80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-br from-[#233245] to-[#0d1425] border-b border-gray-700">
                <p className="flex items-center gap-1.5 text-[#4cb8c4] text-xs uppercase tracking-wide font-semibold">
                    <MessageCircleQuestion className="w-3.5 h-3.5" />
                    {t("doubt_chat_title")}
                </p>
                <button type="button" onClick={() => setAberto(false)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-[80px]">
                {carregandoHistorico && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    </div>
                )}

                {!carregandoHistorico && mensagens.length === 0 && (
                    <p className="text-gray-500 text-xs text-center py-2">{t("doubt_chat_empty")}</p>
                )}

                {mensagens.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <p className={`text-sm rounded-2xl px-3 py-2 max-w-[85%] ${m.role === "user"
                            ? "bg-[#4cb8c4] text-white rounded-br-sm"
                            : "bg-gray-700 text-white rounded-bl-sm"
                            }`}>
                            {m.mensagem}
                        </p>
                    </div>
                ))}

                {enviando && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 rounded-2xl rounded-bl-sm px-3 py-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-300" />
                        </div>
                    </div>
                )}

                <div ref={fimRef} />
            </div>

            {erro && <p className="text-red-400 text-xs px-4 pb-1">{erro}</p>}

            <div className="border-t border-gray-700 p-2">
                {restantes > 0 ? (
                    <form onSubmit={enviar} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            placeholder={t("doubt_chat_placeholder")}
                            disabled={enviando}
                            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none px-2 py-1.5 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={enviando || !texto.trim()}
                            className="shrink-0 w-8 h-8 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] disabled:opacity-40 text-white flex items-center justify-center transition-colors"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </form>
                ) : (
                    <p className="text-gray-500 text-xs text-center py-1">{t("doubt_limit_reached")}</p>
                )}
            </div>
        </div>
    );
}
