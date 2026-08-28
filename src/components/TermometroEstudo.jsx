import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Flame, Star, Calendar, MessageCircleQuestion, BookOpenText, Gamepad2, Target, Languages, X } from "lucide-react";
import { useTranslation } from "react-i18next";

// Pontuação combinada: cada palavra aprendida vale 1 ponto, cada dia
// distinto em que o usuário acessou o app vale PONTOS_POR_DIA_ACESSO -
// junta as duas métricas na mesma "moeda" sem uma dominar a outra. Jogos e
// treino com IA aparecem só no popover (informativo), não entram na conta -
// não têm uma unidade natural comparável (partida jogada, resposta
// corrigida) que valha a pena converter em pontos sem parecer arbitrário.
const PALAVRAS_POR_NIVEL = 20;
const PONTOS_POR_DIA_ACESSO = 5;

// Preenchimento mínimo visível, mesmo com 0 pontos - um usuário recém-
// cadastrado não deve ver o termômetro literalmente vazio (parece
// "quebrado"/desmotivador). Ele começa com uma base visível e só cresce -
// a pontuação nunca diminui, então o termômetro também nunca "esvazia".
const PISO_VISUAL_PERCENT = 12;

function LinhaStat({ icon, label, valor }) {
    return (
        <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-800 last:border-b-0">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
                {icon}
                {label}
            </div>
            <span className="text-white font-semibold text-sm shrink-0">{valor}</span>
        </div>
    );
}

export default function TermometroEstudo({ totalAprendidas = 0, streak = 0, diasAcesso = 0, treinoIaStats = null, jogoResumo = null, jogoTiroResumo = null }) {
    const { t } = useTranslation();
    const [aberto, setAberto] = useState(false);

    const pontosTotais = totalAprendidas + diasAcesso * PONTOS_POR_DIA_ACESSO;
    const nivel = Math.floor(pontosTotais / PALAVRAS_POR_NIVEL) + 1;
    const progressoNivel = pontosTotais % PALAVRAS_POR_NIVEL;
    const percentBruto = (progressoNivel / PALAVRAS_POR_NIVEL) * 100;
    const percent = Math.max(PISO_VISUAL_PERCENT, percentBruto);
    const faltamProximoNivel = PALAVRAS_POR_NIVEL - progressoNivel;

    const perguntasRespondidas = treinoIaStats?.perguntas?.total ?? 0;
    const frasesDoDiaRespondidas = treinoIaStats?.frase_do_dia?.total ?? 0;
    const traducaoReversaRespondidas = treinoIaStats?.traducao_reversa?.total ?? 0;
    const partidasJogadas = jogoResumo?.partidas_jogadas ?? 0;
    const melhorPontuacaoJogo = jogoResumo?.melhor_pontuacao ?? 0;
    const partidasTiroJogadas = jogoTiroResumo?.partidas_jogadas ?? 0;
    const melhorPontuacaoTiro = jogoTiroResumo?.melhor_pontuacao ?? 0;

    return (
        <>
            <button
                type="button"
                onClick={() => setAberto(true)}
                // relative + z-20: a barra fixa de baixo (Home.jsx) usa
                // margin-top negativo pra sobrepor visualmente a área acima
                // dela (efeito de fade), e sem um z-index maior aqui essa
                // área invisível da barra captura o clique antes de chegar
                // no ícone de nível (parte de baixo do termômetro).
                className="relative z-20 flex flex-col items-center w-10 shrink-0 h-full  pb-6"
                aria-label={t("study_level_tooltip", { nivel, total: totalAprendidas })}
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
            </button>

            <Dialog open={aberto} onClose={() => setAberto(false)} className="relative z-50">
                <div className="fixed inset-0 backdrop-blur-[2px]" />

                <div className="fixed inset-0 flex items-center justify-center px-4">
                    <Dialog.Panel className="w-full max-w-sm rounded-2xl from-gray-900 to-gray-800 bg-gradient-to-br border border-white/30 px-6 py-6 shadow-xl">
                        <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex items-center justify-center shrink-0">
                                    <Star className="w-4 h-4 text-white" fill="currentColor" />
                                </div>
                                <div>
                                    <Dialog.Title className="text-lg font-semibold text-white leading-tight">
                                        {t("study_level_title", { nivel })}
                                    </Dialog.Title>
                                    <p className="text-xs text-gray-400">
                                        {t("study_level_next_hint", { count: faltamProximoNivel })}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setAberto(false)} className="text-gray-400 hover:text-white shrink-0">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-400 text-xs mt-3 mb-2">
                            {t("study_level_explainer", { pontosDia: PONTOS_POR_DIA_ACESSO, pontosNivel: PALAVRAS_POR_NIVEL })}
                        </p>

                        <div className="mt-2">
                            <LinhaStat
                                icon={<BookOpenText className="w-4 h-4 text-emerald-400" />}
                                label={t("words_learned_label")}
                                valor={totalAprendidas}
                            />
                            <LinhaStat
                                icon={<Flame className="w-4 h-4 text-orange-400" />}
                                label={t("streak_label")}
                                valor={`${streak} ${t("days")}`}
                            />
                            <LinhaStat
                                icon={<Calendar className="w-4 h-4 text-sky-400" />}
                                label={t("days_accessed_label")}
                                valor={`${diasAcesso} ${t("days")}`}
                            />
                        </div>

                        <p className="text-gray-500 text-[11px] uppercase tracking-wide mt-4 mb-1">
                            {t("other_activity_label")}
                        </p>
                        <p className="text-gray-500 text-[11px] mb-1">
                            {t("other_activity_hint")}
                        </p>
                        <div>
                            <LinhaStat
                                icon={<BookOpenText className="w-4 h-4 text-[#4cb8c4]" />}
                                label={t("daily_phrase_title")}
                                valor={frasesDoDiaRespondidas}
                            />
                            <LinhaStat
                                icon={<MessageCircleQuestion className="w-4 h-4 text-[#4cb8c4]" />}
                                label={t("questions_training")}
                                valor={perguntasRespondidas}
                            />
                            <LinhaStat
                                icon={<Languages className="w-4 h-4 text-[#4cb8c4]" />}
                                label={t("traducao_reversa_training")}
                                valor={traducaoReversaRespondidas}
                            />
                            <LinhaStat
                                icon={<Gamepad2 className="w-4 h-4 text-[#4cb8c4]" />}
                                label={t("phrase_rain_game_label")}
                                valor={partidasJogadas > 0
                                    ? t("games_played_with_best_score", { count: partidasJogadas, pontos: melhorPontuacaoJogo })
                                    : t("games_not_played_yet")}
                            />
                            <LinhaStat
                                icon={<Target className="w-4 h-4 text-[#4cb8c4]" />}
                                label={t("sure_shot_title")}
                                valor={partidasTiroJogadas > 0
                                    ? t("games_played_with_best_score", { count: partidasTiroJogadas, pontos: melhorPontuacaoTiro })
                                    : t("games_not_played_yet")}
                            />
                        </div>

                        <button
                            onClick={() => setAberto(false)}
                            className="mt-6 w-full px-4 py-2.5 rounded-full bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors"
                        >
                            {t("understood")}
                        </button>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
    );
}
