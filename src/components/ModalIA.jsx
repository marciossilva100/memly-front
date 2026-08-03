import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    BookOpenText,
    MessageCircleQuestion,
    ChevronRight,
    Sparkles,
    X
} from "lucide-react";

export default function ModalIA({ setOpenTreinoIA, openTreinoIA }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const opcoes = [
        {
            icon: BookOpenText,
            cor: "text-blue-400",
            fundo: "bg-blue-400/10 border-blue-400/30",
            titulo: t("daily_phrase_title"),
            descricao: t("daily_phrase_modal_desc"),
            rota: "/treinoia"
        },
        {
            icon: MessageCircleQuestion,
            cor: "text-emerald-400",
            fundo: "bg-emerald-400/10 border-emerald-400/30",
            titulo: t("questions_training"),
            descricao: t("questions_training_desc"),
            rota: "/perguntasia"
        }
    ];

    return (
        <Dialog
            open={openTreinoIA}
            onClose={setOpenTreinoIA}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 p-5 shadow-2xl">

                    <button
                        onClick={() => setOpenTreinoIA(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2 mb-5">
                        <Sparkles className="w-5 h-5 text-[#4cb8c4]" />
                        <h2 className="text-lg font-semibold text-white">{t("ai_training")}</h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        {opcoes.map((opcao) => (
                            <button
                                key={opcao.rota}
                                type="button"
                                onClick={() => {
                                    setOpenTreinoIA(false);
                                    navigate(opcao.rota);
                                }}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 hover:border-gray-600 transition-colors text-left"
                            >
                                <div className={`flex items-center justify-center w-11 h-11 shrink-0 rounded-full border ${opcao.fundo}`}>
                                    <opcao.icon className={`w-5 h-5 ${opcao.cor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium leading-tight">{opcao.titulo}</p>
                                    <p className="text-gray-400 text-xs mt-0.5 leading-snug">{opcao.descricao}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                            </button>
                        ))}
                    </div>

                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
