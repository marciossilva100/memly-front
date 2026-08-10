import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { CloudRain, Target, Crown, Gamepad2 } from "lucide-react";

// Um card por jogo - cada um consulta seu próprio 'status_acesso' (só
// leitura, não gasta cota) pra mostrar a coroa de bloqueado, mesmo padrão
// já usado em Home.jsx pro ícone antigo de jogo único.
function CardJogo({ icon, titulo, descricao, bloqueado, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="relative w-full text-left flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 hover:bg-gray-700/50 transition-colors"
        >
            <span className="flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#4cb8c4]/20 to-[#085078]/20 text-[#4cb8c4]">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-white font-semibold">{titulo}</p>
                <p className="text-gray-400 text-sm">{descricao}</p>
            </div>
            {bloqueado && <Crown className="absolute top-3 right-3 w-4 h-4 text-yellow-400" />}
        </button>
    );
}

export default function Jogos() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL;

    // Premium nunca bloqueia, free bloqueia sempre nos dois - dá pra saber
    // isso na hora, sem precisar de fetch/efeito. Só o limitado precisa
    // consultar o backend (cota diária pode já estar gasta ou não).
    const bloqueioConhecido = user?.plano === 1 ? false : user?.plano !== 3 ? true : null;

    const [chuvaBloqueadaFetch, setChuvaBloqueadaFetch] = useState(false);
    const [tiroBloqueadoFetch, setTiroBloqueadoFetch] = useState(false);

    useEffect(() => {
        if (!user?.id || bloqueioConhecido !== null) return;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        };

        fetch(`${API_URL}/controller/jogoChuvaFrases.php`, {
            method: 'POST', headers, body: JSON.stringify({ action: 'status_acesso' })
        })
            .then(res => res.json())
            .then(data => setChuvaBloqueadaFetch(Boolean(data?.bloqueado)))
            .catch(() => setChuvaBloqueadaFetch(false));

        fetch(`${API_URL}/controller/tiroCerteiro.php`, {
            method: 'POST', headers, body: JSON.stringify({ action: 'status_acesso' })
        })
            .then(res => res.json())
            .then(data => setTiroBloqueadoFetch(Boolean(data?.bloqueado)))
            .catch(() => setTiroBloqueadoFetch(false));
    }, [user?.id, bloqueioConhecido, API_URL]);

    const chuvaBloqueada = bloqueioConhecido ?? chuvaBloqueadaFetch;
    const tiroBloqueado = bloqueioConhecido ?? tiroBloqueadoFetch;

    return (
        <div className="px-5 h-dvh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex items-center gap-3 mb-6 mt-4">
                <div className="cursor-pointer" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left text-2xl text-white"></i>
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#4cb8c4]/20 to-[#085078]/20 text-[#4cb8c4]">
                        <Gamepad2 className="w-5 h-5" />
                    </span>
                    <h1 className="text-lg font-semibold text-white leading-tight truncate">
                        {t("games_title")}
                    </h1>
                </div>
            </div>

            <p className="text-gray-400 text-sm mb-4">{t("choose_game_hint")}</p>

            <div className="flex flex-col gap-3">
                <CardJogo
                    icon={<CloudRain className="w-6 h-6" />}
                    titulo={t("phrase_rain_title")}
                    descricao={t("phrase_rain_card_desc")}
                    bloqueado={chuvaBloqueada}
                    onClick={() => navigate('/chuvadefrases')}
                />
                <CardJogo
                    icon={<Target className="w-6 h-6" />}
                    titulo={t("sure_shot_title")}
                    descricao={t("sure_shot_card_desc")}
                    bloqueado={tiroBloqueado}
                    onClick={() => navigate('/tirocerteiro')}
                />
            </div>
        </div>
    );
}
