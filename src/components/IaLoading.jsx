import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png";

// Tela de "gerando conteúdo com IA", compartilhada por treinoIA.jsx,
// Perguntas.jsx e TraducaoReversa.jsx (os 3 treinos que esperam uma geração
// de IA antes de mostrar qualquer coisa). Antes era só o chapéu pulsando +
// uma frase fixa - pedido do usuário por algo "mais dinâmico": barra de
// progresso (falsa, já que não existe progresso real vindo do backend - só
// dá sensação de avanço) + chapéu saltitando + mensagens que revezam, em vez
// de uma tela parada.
const MENSAGENS = [
    "ia_gerando_conteudo",
    "ia_loading_msg_analisando",
    "ia_loading_msg_montando",
    "ia_loading_msg_quase",
];

const INTERVALO_MENSAGEM_MS = 2200;

export default function IaLoading() {
    const { t } = useTranslation();
    const [indiceMensagem, setIndiceMensagem] = useState(0);

    useEffect(() => {
        const intervalo = setInterval(() => {
            setIndiceMensagem((i) => (i + 1) % MENSAGENS.length);
        }, INTERVALO_MENSAGEM_MS);

        return () => clearInterval(intervalo);
    }, []);

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-6 from-gray-900 to-gray-800 bg-gradient-to-br px-10">
            <img
                src={imgChapeuFormatura}
                alt={t("loading")}
                className="w-24 animate-ia-loading-bounce"
            />

            <div className="w-full max-w-xs">
                <div className="h-2 w-full rounded-full bg-gray-700/50 overflow-hidden">
                    <div className="h-full w-[6%] rounded-full ia-loading-bar-fill" />
                </div>
            </div>

            {/* key muda a cada mensagem - força o React a remontar o <p>, o
                que reinicia a animação de fade a cada troca (CSS animation
                não reinicia sozinha só porque o texto mudou). */}
            <p
                key={indiceMensagem}
                className="text-gray-400 text-sm text-center min-h-[1.25rem] animate-ia-loading-fade"
            >
                {t(MENSAGENS[indiceMensagem])}
            </p>
        </div>
    );
}
