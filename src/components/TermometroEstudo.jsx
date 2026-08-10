import { Flame, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

// Palavras aprendidas por nível - controla só a velocidade com que o
// termômetro sobe, nunca se ele "esvazia": totalAprendidas só cresce (nunca
// diminui), então o nível também só sobe.
const PALAVRAS_POR_NIVEL = 20;

// Preenchimento mínimo visível, mesmo com 0 palavras aprendidas - um usuário
// recém-cadastrado não deve ver o termômetro literalmente vazio (parece
// "quebrado"/desmotivador). Ele começa com uma base visível e só cresce.
const PISO_VISUAL_PERCENT = 12;

export default function TermometroEstudo({ totalAprendidas = 0, streak = 0 }) {
    const { t } = useTranslation();

    const nivel = Math.floor(totalAprendidas / PALAVRAS_POR_NIVEL) + 1;
    const progressoNivel = totalAprendidas % PALAVRAS_POR_NIVEL;
    const percentBruto = (progressoNivel / PALAVRAS_POR_NIVEL) * 100;
    const percent = Math.max(PISO_VISUAL_PERCENT, percentBruto);

    return (
        <div
            className="flex flex-col items-center w-10 shrink-0 h-full py-1"
            title={t("study_level_tooltip", { nivel, total: totalAprendidas })}
        >
            {/* topo: chama do streak */}
            <div className="relative shrink-0">
                <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${streak > 0
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 border-orange-300/40 shadow-[0_0_6px_1px_rgba(251,146,60,0.55)]"
                        : "bg-gray-800/70 border-gray-700"
                        }`}
                >
                    <Flame className={`w-2.5 h-2.5 ${streak > 0 ? "text-white" : "text-gray-600"}`} />
                </div>
                {streak > 0 && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1 rounded-full bg-gray-900 border border-orange-400/50 text-orange-300 text-[8px] font-bold leading-tight">
                        {streak}
                    </span>
                )}
            </div>

            {/* tubo */}
            <div className="relative w-2.5 flex-1 min-h-0 mt-3 rounded-full bg-gray-900/80 border border-white/10 overflow-hidden flex items-end shadow-inner">
                <div
                    className="relative w-full rounded-full bg-gradient-to-t from-fuchsia-500 via-cyan-400 to-lime-300 transition-all duration-700 ease-out overflow-hidden"
                    style={{ height: `${percent}%` }}
                >
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-70 blur-[1px]" />
                    <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-termometro-shimmer" />
                </div>
            </div>

            {/* base: nível */}
            <div className="relative mt-3 shrink-0">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-[0_0_7px_1px_rgba(232,121,249,0.5),0_0_12px_3px_rgba(34,211,238,0.35)]">
                    <Star className="w-3 h-3 text-white" fill="currentColor" />
                </div>
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1 rounded-full bg-gray-900 border border-cyan-300/50 text-cyan-300 text-[8px] font-bold leading-tight">
                    {nivel}
                </span>
            </div>
        </div>
    );
}
