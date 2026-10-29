import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Gamepad2 } from "lucide-react";
import imgNave from "../assets/img/nave.png";

function CardJogo({ icon, titulo, descricao, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="relative w-full text-left flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 hover:bg-gray-700/50 transition-colors"
        >
            <span className="flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#4cb8c4]/15 to-[#085078]/15">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-white font-semibold">{titulo}</p>
                <p className="text-gray-400 text-sm">{descricao}</p>
            </div>
        </button>
    );
}

export default function Jogos() {
    const { t } = useTranslation();
    const navigate = useNavigate();

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
                    icon={<span className="text-3xl leading-none" role="img" aria-hidden="true">🌧️</span>}
                    titulo={t("phrase_rain_title")}
                    descricao={t("phrase_rain_card_desc")}
                    onClick={() => navigate('/chuvadefrases')}
                />
                <CardJogo
                    icon={<img src={imgNave} alt="" className="w-10 h-10 object-contain" />}
                    titulo={t("sure_shot_title")}
                    descricao={t("sure_shot_card_desc")}
                    onClick={() => navigate('/tirocerteiro')}
                />
            </div>
        </div>
    );
}
